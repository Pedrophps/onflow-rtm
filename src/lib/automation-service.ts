
'use client';
/**
 * @fileOverview Serviço central de automação do OnFlow.
 * Lida com a criação de registros baseados em inputs externos (como e-mails).
 */

import { parseERPEmail, type ParseERPEmailOutput } from '@/ai/flows/parse-erp-email-flow';
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
  // 1. Chamar a IA para entender o e-mail
  const extracted = await parseERPEmail({ emailSubject: subject, emailBody: body });

  // 2. Localizar ou criar o Cliente Institucional
  const usersRef = collection(db, "users");
  const q = query(usersRef, where("cnpj", "==", extracted.cnpj));
  const querySnapshot = await getDocs(q);
  
  let clientId = "";
  let institutionName = extracted.institutionName;

  if (querySnapshot.empty) {
    // Cadastro Automático de novo cliente
    const newClientRef = doc(collection(db, "users"));
    clientId = newClientRef.id;
    await setDoc(newClientRef, {
      institutionName: extracted.institutionName,
      displayName: "Contato Administrativo", // Placeholder
      email: `contato@${extracted.cnpj.replace(/\D/g, '')}.com.br`,
      cnpj: extracted.cnpj,
      role: "client",
      status: "pending", // Comercial precisará aprovar formalmente depois
      createdAt: new Date().toISOString()
    } as UserProfile);
  } else {
    clientId = querySnapshot.docs[0].id;
    institutionName = querySnapshot.docs[0].data().institutionName || extracted.institutionName;
  }

  // 3. Criar a Instância de Onboarding para o Suporte
  const instancesRef = collection(db, "onboardingInstances");
  const newInstance: OnboardingInstance = {
    clientId: clientId,
    institutionName: institutionName,
    productId: extracted.productName,
    productName: extracted.productName,
    status: 'pending',
    currentStepOrder: 1,
    startedAt: new Date().toISOString(),
    updatedAt: serverTimestamp(),
  };

  const docRef = await addDoc(instancesRef, newInstance);

  // 4. Registrar Log de Auditoria
  await addDoc(collection(db, "system_logs"), {
    message: `Automação ERP: Nova ativação criada para ${institutionName} (${extracted.productName})`,
    type: 'success',
    timestamp: new Date().toISOString(),
    userId: 'automation-bot',
    context: 'erp-ingestion'
  });

  return {
    instanceId: docRef.id,
    extracted
  };
}
