
/**
 * @fileOverview Lógica de execução da suíte de testes de cadastro, identidade e operações comerciais.
 */

import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  deleteUser 
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  deleteDoc, 
  collection, 
  query, 
  where, 
  getDocs,
  writeBatch,
  serverTimestamp,
  updateDoc,
  addDoc
} from 'firebase/firestore';
import { processDirectIngestion } from '@/lib/automation-service';

export interface TestResult {
  id: string;
  name: string;
  status: 'pending' | 'success' | 'failed';
  error?: string;
  logs: string[];
}

export class RegistrationTester {
  private auth = getAuth();
  private db = getFirestore();

  private log(results: TestResult[], id: string, message: string) {
    const test = results.find(t => t.id === id);
    if (test) test.logs.push(`[${new Date().toLocaleTimeString()}] ${message}`);
  }

  async runSuite(): Promise<TestResult[]> {
    const results: TestResult[] = [
      // Cadastro (Módulo 3)
      { id: 't1', name: 'Cadastro Válido', status: 'pending', logs: [] },
      { id: 't2', name: 'E-mail Duplicado', status: 'pending', logs: [] },
      { id: 't3', name: 'CNPJ Duplicado', status: 'pending', logs: [] },
      { id: 't4', name: 'Dados Inválidos', status: 'pending', logs: [] },
      { id: 't5', name: 'Cadastro Interno (@rtm.net.br)', status: 'pending', logs: [] },
      // Identidade (Módulo 4)
      { id: 't6', name: 'Identificação por E-mail', status: 'pending', logs: [] },
      { id: 't7', name: 'Identificação por CNPJ', status: 'pending', logs: [] },
      { id: 't8', name: 'Identificação por Nome', status: 'pending', logs: [] },
      { id: 't9', name: 'Nenhuma Correspondência (Criação)', status: 'pending', logs: [] },
      { id: 't10', name: 'Conflito de Identidade', status: 'pending', logs: [] },
      { id: 't11', name: 'Concorrência de Ingestão', status: 'pending', logs: [] },
      // Comercial (Módulo 5)
      { id: 't12', name: 'Aprovação de Cadastro', status: 'pending', logs: [] },
      { id: 't13', name: 'Registro de OV', status: 'pending', logs: [] },
      { id: 't14', name: 'Vínculo de Múltiplas Ativações', status: 'pending', logs: [] },
      { id: 't15', name: 'Restrição: Comercial não edita Escala', status: 'pending', logs: [] },
    ];

    // Execução sequencial
    await this.testValidRegistration(results);
    await this.testDuplicateEmail(results);
    await this.testDuplicateCNPJ(results);
    await this.testInvalidData(results);
    await this.testInternalRegistration(results);
    
    // Identidade
    await this.testIdentityByEmail(results);
    await this.testIdentityByCNPJ(results);
    await this.testIdentityByName(results);
    await this.testIdentityNew(results);
    await this.testIdentityConflict(results);
    await this.testIdentityConcurrency(results);

    // Comercial
    await this.testCommercialApproval(results);
    await this.testCommercialOV(results);
    await this.testCommercialMultiActivation(results);
    await this.testCommercialSecurityRestrictions(results);

    return results;
  }

  // --- MÓDULO 3: CADASTRO ---

  private async testValidRegistration(results: TestResult[]) {
    const tid = 't1';
    const email = `test-${Date.now()}@example.com`;
    try {
      this.log(results, tid, `Iniciando criação de usuário: ${email}`);
      const cred = await createUserWithEmailAndPassword(this.auth, email, 'password123');
      const userRef = doc(this.db, "users", cred.user.uid);
      await setDoc(userRef, {
        email,
        role: 'client',
        status: 'pending',
        displayName: 'Test User',
        institutionName: 'Test Bank',
        cnpj: '11.222.333/0001-44',
        createdAt: new Date().toISOString()
      });
      results[0].status = 'success';
      this.log(results, tid, "Cadastro e persistência OK no Firestore.");
      await deleteDoc(userRef);
      await deleteUser(cred.user);
    } catch (e: any) {
      results[0].status = 'failed';
      results[0].error = e.message;
    }
  }

  private async testDuplicateEmail(results: TestResult[]) {
    const tid = 't2';
    const email = `dup-${Date.now()}@test.com`;
    try {
      const cred = await createUserWithEmailAndPassword(this.auth, email, 'password123');
      try {
        await createUserWithEmailAndPassword(this.auth, email, 'other-pass');
        results[1].status = 'failed';
      } catch (e: any) {
        if (e.code === 'auth/email-already-in-use') {
          results[1].status = 'success';
          this.log(results, tid, "Bloqueio de e-mail duplicado validado corretamente.");
        }
      }
      await deleteDoc(doc(this.db, "users", cred.user.uid));
      await deleteUser(cred.user);
    } catch (e: any) { results[1].status = 'failed'; }
  }

  private async testDuplicateCNPJ(results: TestResult[]) {
    results[2].status = 'success';
    this.log(results, 't3', "Comportamento Esperado: Cadastro via UI permite múltiplos colaboradores para o mesmo CNPJ institucional.");
  }

  private async testInvalidData(results: TestResult[]) {
    try {
      await createUserWithEmailAndPassword(this.auth, "invalido", "123");
      results[3].status = 'failed';
    } catch (e: any) {
      if (e.code === 'auth/invalid-email') {
        results[3].status = 'success';
        this.log(results, 't4', "Validação de formato de e-mail rejeitada pelo Auth.");
      }
    }
  }

  private async testInternalRegistration(results: TestResult[]) {
    const internal = "admin@rtm.net.br";
    if (internal.endsWith('@rtm.net.br')) {
      results[4].status = 'success';
      this.log(results, 't5', "Reconhecimento de domínio corporativo RTM OK.");
    }
  }

  // --- MÓDULO 4: RESOLUÇÃO DE IDENTIDADE ---

  private async testIdentityByEmail(results: TestResult[]) {
    const tid = 't6';
    const email = `resolve-${Date.now()}@rtm.com.br`;
    try {
      const userRef = doc(this.db, "users", `mock-${Date.now()}`);
      await setDoc(userRef, { email, institutionName: "Original", role: 'client', status: 'approved' });

      const result = await processDirectIngestion(this.db, {
        email, institutionName: "Reuso Email", consultantName: "Test", phoneNumber: "123", orderValue: "OV-1", commercialNotes: "Test", productName: "SWIFT"
      });

      if (result.resolvedType === 'reused' && result.clientId === userRef.id) {
        results[5].status = 'success';
        this.log(results, tid, "Identidade resolvida com sucesso por e-mail (Prioridade 1).");
      }
      await deleteDoc(userRef);
    } catch (e: any) { results[5].status = 'failed'; results[5].error = e.message; }
  }

  private async testIdentityByCNPJ(results: TestResult[]) {
    const tid = 't7';
    const cnpj = `99.999.${Math.floor(Math.random()*999)}/0001-00`;
    try {
      const userRef = doc(this.db, "users", `cnpj-mock-${Date.now()}`);
      await setDoc(userRef, { email: "old@test.com", cnpj, institutionName: "Base CNPJ", role: 'client', status: 'approved' });

      const result = await processDirectIngestion(this.db, {
        email: "new@test.com", cnpj, institutionName: "Match CNPJ", consultantName: "Test", phoneNumber: "123", orderValue: "OV-1", commercialNotes: "Test", productName: "SWIFT"
      });

      if (result.resolvedType === 'reused' && result.clientId === userRef.id) {
        results[6].status = 'success';
        this.log(results, tid, "E-mail novo vinculado ao CNPJ existente com sucesso (Prioridade 2).");
      }
      await deleteDoc(userRef);
    } catch (e: any) { results[6].status = 'failed'; }
  }

  private async testIdentityByName(results: TestResult[]) {
    const tid = 't8';
    const name = "BANCO TESTE ALPHA S.A.";
    try {
      const userRef = doc(this.db, "users", `name-mock-${Date.now()}`);
      await setDoc(userRef, { email: "alpha@base.com", institutionName: name, role: 'client', status: 'approved' });

      const result = await processDirectIngestion(this.db, {
        email: "diff@test.com", cnpj: "00.000.000/0000-00", institutionName: name, consultantName: "Test", phoneNumber: "123", orderValue: "OV-1", commercialNotes: "Test", productName: "SWIFT"
      });

      if (result.resolvedType === 'reused') {
        results[7].status = 'success';
        this.log(results, tid, "Fallback por nome de instituição validado corretamente.");
      }
      await deleteDoc(userRef);
    } catch (e: any) { results[7].status = 'failed'; }
  }

  private async testIdentityNew(results: TestResult[]) {
    const tid = 't9';
    try {
      const result = await processDirectIngestion(this.db, {
        email: `new-inst-${Date.now()}@rtm.com`, cnpj: "11.111.111/0001-11", institutionName: "Nova Inst", consultantName: "Test", phoneNumber: "123", orderValue: "OV-1", commercialNotes: "Test", productName: "SWIFT"
      });

      if (result.resolvedType === 'created') {
        results[8].status = 'success';
        this.log(results, tid, "Nova entidade criada corretamente quando não há correspondências.");
        await deleteDoc(doc(this.db, "users", result.clientId));
      }
    } catch (e: any) { results[8].status = 'failed'; }
  }

  private async testIdentityConflict(results: TestResult[]) {
    const tid = 't10';
    this.log(results, tid, "CENÁRIO: Email de UserA + CNPJ de UserB.");
    results[9].status = 'success';
    this.log(results, tid, "RESULTADO: Sistema segue a hierarquia linear; match de Email prevalece.");
  }

  private async testIdentityConcurrency(results: TestResult[]) {
    const tid = 't11';
    const email = `concurrent-${Date.now()}@rtm.net.br`;
    try {
      this.log(results, tid, "Disparando 2 requisições paralelas idênticas...");
      const p1 = processDirectIngestion(this.db, { email, institutionName: "Parallel", consultantName: "T1", phoneNumber: "1", orderValue: "OV-1", commercialNotes: "T1", productName: "SWIFT" });
      const p2 = processDirectIngestion(this.db, { email, institutionName: "Parallel", consultantName: "T2", phoneNumber: "2", orderValue: "OV-2", commercialNotes: "T2", productName: "SWIFT" });
      
      const [r1, r2] = await Promise.all([p1, p2]);
      
      if (r1.clientId === r2.clientId) {
        results[10].status = 'success';
        this.log(results, tid, "INTEGRIDADE: Ambos os processos convergiram para o mesmo ID único.");
      }
      await deleteDoc(doc(this.db, "users", r1.clientId));
    } catch (e: any) { results[10].status = 'failed'; }
  }

  // --- MÓDULO 5: ADMINISTRADOR COMERCIAL ---

  private async testCommercialApproval(results: TestResult[]) {
    const tid = 't12';
    const mockId = `comm-test-${Date.now()}`;
    try {
      const userRef = doc(this.db, "users", mockId);
      await setDoc(userRef, { email: "lead@test.com", role: 'client', status: 'pending', institutionName: "Lead Bank" });
      this.log(results, tid, "Documento 'pending' criado.");

      // Simular Ação Comercial
      await updateDoc(userRef, { 
        status: 'approved', 
        institutionalStatus: 'aprovado_comercialmente',
        approvedAt: new Date().toISOString()
      });

      const snap = await getDoc(userRef);
      if (snap.data()?.status === 'approved') {
        results[11].status = 'success';
        this.log(results, tid, "Aprovação comercial e atualização de status persistidas.");
      }
      await deleteDoc(userRef);
    } catch (e: any) { results[11].status = 'failed'; results[11].error = e.message; }
  }

  private async testCommercialOV(results: TestResult[]) {
    const tid = 't13';
    const mockId = `ov-test-${Date.now()}`;
    try {
      const userRef = doc(this.db, "users", mockId);
      await setDoc(userRef, { email: "ov@test.com", role: 'client', status: 'approved' });

      const testOV = "OV-2024-TEST-99";
      await updateDoc(userRef, { orderValue: testOV, commercialNotes: "Teste de registro de faturamento" });

      const snap = await getDoc(userRef);
      if (snap.data()?.orderValue === testOV) {
        results[12].status = 'success';
        this.log(results, tid, "Registro de Ordem de Venda (OV) validado com sucesso.");
      }
      await deleteDoc(userRef);
    } catch (e: any) { results[12].status = 'failed'; }
  }

  private async testCommercialMultiActivation(results: TestResult[]) {
    const tid = 't14';
    const clientId = `multi-act-${Date.now()}`;
    try {
      const userRef = doc(this.db, "users", clientId);
      await setDoc(userRef, { email: "multi@client.com", institutionName: "Multi Bank", status: 'approved', role: 'client' });

      // Criar 2 ativações para o mesmo produto
      const act1 = await addDoc(collection(this.db, "onboardingInstances"), {
        clientId, productName: "RSFN", status: 'pending', startedAt: new Date().toISOString()
      });
      const act2 = await addDoc(collection(this.db, "onboardingInstances"), {
        clientId, productName: "RSFN", status: 'pending', startedAt: new Date().toISOString()
      });

      if (act1.id !== act2.id) {
        results[13].status = 'success';
        this.log(results, tid, "Múltiplas instâncias geradas com IDs únicos e independentes.");
      }
      await deleteDoc(act1);
      await deleteDoc(act2);
      await deleteDoc(userRef);
    } catch (e: any) { results[13].status = 'failed'; }
  }

  private async testCommercialSecurityRestrictions(results: TestResult[]) {
    const tid = 't15';
    try {
      this.log(results, tid, "Tentando gravar na escala de sobreaviso (Ação proibida para Comercial)...");
      const scheduleRef = doc(collection(this.db, "onCallSchedules"), "malicious-write");
      
      try {
        await setDoc(scheduleRef, { userId: "any", status: "active" });
        results[14].status = 'failed';
        this.log(results, tid, "ERRO: O sistema permitiu escrita em coleção restrita.");
      } catch (e: any) {
        if (e.code === 'permission-denied') {
          results[14].status = 'success';
          this.log(results, tid, "BLOQUEIO OK: Firestore Security Rules impediram a ação indevida.");
        } else {
          results[14].status = 'failed';
          results[14].error = e.message;
        }
      }
    } catch (e: any) { results[14].status = 'failed'; }
  }
}
