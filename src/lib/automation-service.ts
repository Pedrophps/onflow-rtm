/**
 * @fileOverview Serviço de orquestração de automação.
 * Integra sistemas externos com a persistência de dados do OnFlow.
 */

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

export interface DirectIngestionInput {
  institutionName: string;
  cnpj?: string;
  consultantName: string;
  email: string;
  phoneNumber: string;
  orderValue: string;
  commercialNotes: string;
  productName: string;
}

/**
 * Processa a ingestão direta de dados vindos do ERP ou Power Automate.
 * Cria o usuário (se não existir) ou atualiza e gera a instância de onboarding vinculada.
 */
export async function processDirectIngestion(
  db: Firestore, 
  data: DirectIngestionInput
) {
  try {
    // 1. Busca ou cria o cliente pelo E-mail (chave única vinda do ERP)
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("email", "==", data.email));
    const querySnapshot = await getDocs(q);
    
    let clientId = "";

    const userPayload = {
      institutionName: data.institutionName,
      displayName: data.institutionName,
      email: data.email,
      phoneNumber: data.phoneNumber,
      consultantName: data.consultantName,
      orderValue: data.orderValue,
      commercialNotes: data.commercialNotes,
      cnpj: data.cnpj || "00.000.000/0000-00",
      role: "client" as const,
      status: "approved" as const, // Já nasce aprovado para o comercial
      updatedAt: serverTimestamp()
    };

    if (querySnapshot.empty) {
      const newClientRef = doc(collection(db, "users"));
      clientId = newClientRef.id;
      await setDoc(newClientRef, {
        ...userPayload,
        createdAt: new Date().toISOString()
      });
    } else {
      clientId = querySnapshot.docs[0].id;
      // Vincula os novos dados ao usuário existente
      await setDoc(doc(db, "users", clientId), userPayload, { merge: true });
    }

    // 2. Mapeamento Inteligente do Produto
    // Tenta encontrar o ID real do produto baseado no nome enviado via API
    const productsRef = collection(db, "products");
    const productsSnap = await getDocs(productsRef);
    let resolvedProductId = data.productName;
    let resolvedProductName = data.productName;

    productsSnap.docs.forEach(pDoc => {
      const pData = pDoc.data();
      if (
        pData.name.toLowerCase() === data.productName.toLowerCase() || 
        pDoc.id === data.productName ||
        pData.name.toLowerCase().includes(data.productName.toLowerCase())
      ) {
        resolvedProductId = pDoc.id;
        resolvedProductName = pData.name;
      }
    });

    // 3. Cria a instância de ativação técnica vinculada ao usuário
    const instancesRef = collection(db, "onboardingInstances");
    const newInstance: OnboardingInstance = {
      clientId: clientId,
      institutionName: data.institutionName,
      productId: resolvedProductId,
      productName: resolvedProductName,
      status: 'pending', // Fica na aba "Disponíveis" para o suporte
      currentStepOrder: 1,
      startedAt: new Date().toISOString(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(instancesRef, newInstance);

    // 4. Log do sistema para auditoria técnica
    await addDoc(collection(db, "system_logs"), {
      message: `API Ingestão: Ativação vinculada ao usuário ${data.email} | Produto: ${resolvedProductName} | OV: ${data.orderValue}`,
      type: 'success',
      timestamp: new Date().toISOString(),
      userId: 'api-bot',
      context: 'direct-ingestion'
    });

    return {
      instanceId: docRef.id,
      clientId
    };
  } catch (error: any) {
    console.error("INGESTION_LOGIC_ERROR:", error);
    throw new Error(error.message || "Erro interno no processamento de dados.");
  }
}
