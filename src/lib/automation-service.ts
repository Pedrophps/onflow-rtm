/**
 * @fileOverview Serviço de orquestração de automação.
 * Integra a inteligência artificial com a persistência de dados.
 */

import { parseERPEmail } from '@/ai/flows/parse-erp-email-flow';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  setDoc, 
  doc, 
  serverTimestamp,
  Firestore 
} from 'firebase/firestore';
import { OnboardingInstance, UserProfile } from '@/lib/types';

export async function processAutomationFromEmail(
  db: Firestore, 
  subject: string, 
  body: string
) {
  // 1. Executa a extração via IA Nemotron
  const extracted = await parseERPEmail({ emailSubject: subject, emailBody: body });

  // 2. Busca o cliente pelo CNPJ extraído
  const usersRef = collection(db, "users");
  const q = query(usersRef, where("cnpj", "==", extracted.cnpj));
  const querySnapshot = await getDocs(q);
  
  let clientId = "";
  let finalInstitutionName = extracted.institutionName;

  if (querySnapshot.empty) {
    // Se o cliente não existe, cria um perfil "Lead" (Pendente)
    const newClientRef = doc(collection(db, "users"));
    clientId = newClientRef.id;
    await setDoc(newClientRef, {
      institutionName: extracted.institutionName,
      displayName: "Contato via ERP",
      email: `onboarding@${extracted.cnpj.replace(/\D/g, '')}.auto.br`,
      cnpj: extracted.cnpj,
      role: "client",
      status: "pending",
      createdAt: new Date().toISOString()
    } as UserProfile);
  } else {
    clientId = querySnapshot.docs[0].id;
    finalInstitutionName = querySnapshot.docs[0].data().institutionName || extracted.institutionName;
  }

  // 3. Cria a instância de ativação técnica para o suporte
  const instancesRef = collection(db, "onboardingInstances");
  const newInstance: OnboardingInstance = {
    clientId: clientId,
    institutionName: finalInstitutionName,
    productId: extracted.productName,
    productName: extracted.productName,
    status: 'pending', // Fica na aba "Disponíveis" para o suporte assumir
    currentStepOrder: 1,
    startedAt: new Date().toISOString(),
    updatedAt: serverTimestamp(),
  };

  const docRef = await addDoc(instancesRef, newInstance);

  // 4. Log do sistema para auditoria
  await addDoc(collection(db, "system_logs"), {
    message: `Automação IA: Ativação criada para ${finalInstitutionName} | Prioridade: ${extracted.priority}`,
    type: 'success',
    timestamp: new Date().toISOString(),
    userId: 'power-automate-bot',
    context: 'api-automation'
  });

  return {
    instanceId: docRef.id,
    extracted
  };
}
