
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
  Firestore,
  limit
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
 * Tenta resolver um usuário existente baseado em múltiplos identificadores.
 * Estratégia de busca em cascata: Email (ID Principal) > CNPJ (ID Institucional) > Nome (Normalizado).
 */
async function resolveExistingUser(db: Firestore, email: string, institutionName: string, cnpj?: string) {
  const usersRef = collection(db, "users");
  
  // 1. Tentar por E-mail (Identificador único de conta)
  const qEmail = query(usersRef, where("email", "==", email), limit(1));
  const snapEmail = await getDocs(qEmail);
  if (!snapEmail.empty) {
    return { id: snapEmail.docs[0].id, data: snapEmail.docs[0].data() as UserProfile, matchBy: 'email' };
  }

  // 2. Tentar por CNPJ (Identificador institucional absoluto)
  if (cnpj && cnpj !== "00.000.000/0001-91" && cnpj !== "00.000.000/0000-00") {
    const qCnpj = query(usersRef, where("cnpj", "==", cnpj), limit(1));
    const snapCnpj = await getDocs(qCnpj);
    if (!snapCnpj.empty) {
      return { id: snapCnpj.docs[0].id, data: snapCnpj.docs[0].data() as UserProfile, matchBy: 'cnpj' };
    }
  }

  // 3. Tentar por Nome da Instituição (Fallback para menções textuais)
  const qName = query(usersRef, where("institutionName", "==", institutionName), limit(1));
  const snapName = await getDocs(qName);
  if (!snapName.empty) {
    return { id: snapName.docs[0].id, data: snapName.docs[0].data() as UserProfile, matchBy: 'name' };
  }

  return null;
}

/**
 * Processa a ingestão direta de dados vindos do ERP ou Power Automate.
 * Resolve a identidade do cliente antes de decidir entre criação ou atualização.
 */
export async function processDirectIngestion(
  db: Firestore, 
  data: DirectIngestionInput
) {
  try {
    // 1. Camada de Resolução: Busca usuário existente (Pedro ou Instituição xpto)
    const existingUser = await resolveExistingUser(db, data.email, data.institutionName, data.cnpj);
    
    let clientId = "";
    const isNewUser = !existingUser;

    const userPayload = {
      institutionName: data.institutionName,
      // Se já existe, mantemos o displayName do cadastro manual do usuário (ex: "Pedro"), a menos que ele esteja vazio
      displayName: (existingUser?.data.displayName) || data.institutionName,
      email: data.email,
      phoneNumber: data.phoneNumber,
      consultantName: data.consultantName,
      orderValue: data.orderValue,
      commercialNotes: data.commercialNotes,
      cnpj: data.cnpj || "00.000.000/0000-00",
      role: "client" as const,
      status: "approved" as const, 
      updatedAt: serverTimestamp()
    };

    if (isNewUser) {
      // Criar novo registro de cliente central
      const newClientRef = doc(collection(db, "users"));
      clientId = newClientRef.id;
      await setDoc(newClientRef, {
        ...userPayload,
        createdAt: new Date().toISOString()
      });
    } else {
      // Reutilizar cadastro existente e atualizar informações de contato e venda
      clientId = existingUser.id;
      await setDoc(doc(db, "users", clientId), userPayload, { merge: true });
    }

    // 2. Mapeamento do Produto (Resolução do catálogo)
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

    // 3. Criar Instância de Onboarding (Vínculo Incremental)
    // Permite que o mesmo clientId (Pedro) possua múltiplas instâncias
    const instancesRef = collection(db, "onboardingInstances");
    const newInstance: OnboardingInstance = {
      clientId: clientId,
      institutionName: data.institutionName,
      productId: resolvedProductId,
      productName: resolvedProductName,
      status: 'pending',
      currentStepOrder: 1,
      startedAt: new Date().toISOString(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(instancesRef, newInstance);

    // 4. Auditoria do processo de resolução
    await addDoc(collection(db, "system_logs"), {
      message: `Ingestão ${isNewUser ? 'NOVO CLIENTE' : 'CLIENTE VINCULADO (via ' + existingUser.matchBy + ')'}: ${data.institutionName} | Vínculo: ${resolvedProductName} | Usuário Destino: ${userPayload.displayName}`,
      type: 'success',
      timestamp: new Date().toISOString(),
      userId: 'api-bot',
      context: 'identity-resolution'
    });

    return {
      instanceId: docRef.id,
      clientId,
      resolvedType: isNewUser ? 'created' : 'reused'
    };
  } catch (error: any) {
    console.error("INGESTION_LOGIC_ERROR:", error);
    throw new Error(error.message || "Erro interno no processamento de dados.");
  }
}
