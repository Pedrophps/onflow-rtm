/**
 * @fileOverview Serviço de orquestração de automação.
 * Integra a inteligência artificial com a persistência de dados.
 */

import { parseERPEmail, ParseERPEmailOutput } from '@/ai/flows/parse-erp-email-flow';
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
  subject?: string, 
  body?: string,
  directData?: Partial<ParseERPEmailOutput>
) {
  let extracted: ParseERPEmailOutput;

  // 1. Determina se usa IA ou dados diretos
  if (subject && body) {
    // Modo IA: Extração via Nemotron
    extracted = await parseERPEmail({ emailSubject: subject, emailBody: body });
  } else if (directData?.institutionName && directData?.cnpj) {
    // Modo Direto: Usa os dados enviados estruturadamente
    extracted = {
      institutionName: directData.institutionName,
      cnpj: directData.cnpj,
      productName: directData.productName || "PRODUTO NÃO ESPECIFICADO",
      priority: directData.priority || 'medium',
      confidence: 1.0
    };
  } else {
    throw new Error('Dados insuficientes. Envie (subject e body) OU (institutionName e cnpj).');
  }

  // 2. Busca ou cria o cliente pelo CNPJ
  const usersRef = collection(db, "users");
  const q = query(usersRef, where("cnpj", "==", extracted.cnpj));
  const querySnapshot = await getDocs(q);
  
  let clientId = "";
  let finalInstitutionName = extracted.institutionName;

  if (querySnapshot.empty) {
    const newClientRef = doc(collection(db, "users"));
    clientId = newClientRef.id;
    await setDoc(newClientRef, {
      institutionName: extracted.institutionName,
      displayName: "Contato via API/ERP",
      email: `onboarding@${extracted.cnpj.replace(/\D/g, '')}.auto.br`,
      cnpj: extracted.cnpj,
      role: "client",
      status: "pending", // Criado como pendente para o comercial conferir depois
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
    message: `API Ingestion: Ativação criada para ${finalInstitutionName} | Prioridade: ${extracted.priority} | Origem: ${subject ? 'E-mail IA' : 'Direta'}`,
    type: 'success',
    timestamp: new Date().toISOString(),
    userId: 'api-ingestion-bot',
    context: 'api-automation'
  });

  return {
    instanceId: docRef.id,
    extracted
  };
}
