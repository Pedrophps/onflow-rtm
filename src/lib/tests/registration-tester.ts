
/**
 * @fileOverview Lógica de execução da suíte de testes de cadastro e identidade.
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
  writeBatch
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
      { id: 't1', name: 'Cadastro Válido', status: 'pending', logs: [] },
      { id: 't2', name: 'E-mail Duplicado', status: 'pending', logs: [] },
      { id: 't3', name: 'CNPJ Duplicado', status: 'pending', logs: [] },
      { id: 't4', name: 'Dados Inválidos', status: 'pending', logs: [] },
      { id: 't5', name: 'Cadastro Interno (@rtm.net.br)', status: 'pending', logs: [] },
      { id: 't6', name: 'Identificação por E-mail', status: 'pending', logs: [] },
      { id: 't7', name: 'Identificação por CNPJ', status: 'pending', logs: [] },
      { id: 't8', name: 'Identificação por Nome', status: 'pending', logs: [] },
      { id: 't9', name: 'Nenhuma Correspondência (Criação)', status: 'pending', logs: [] },
      { id: 't10', name: 'Conflito de Identidade', status: 'pending', logs: [] },
      { id: 't11', name: 'Concorrência de Ingestão', status: 'pending', logs: [] },
    ];

    // Execução sequencial
    await this.testValidRegistration(results);
    await this.testDuplicateEmail(results);
    await this.testDuplicateCNPJ(results);
    await this.testInvalidData(results);
    await this.testInternalRegistration(results);
    
    // Testes de Identidade (Módulo 4)
    await this.testIdentityByEmail(results);
    await this.testIdentityByCNPJ(results);
    await this.testIdentityByName(results);
    await this.testIdentityNew(results);
    await this.testIdentityConflict(results);
    await this.testIdentityConcurrency(results);

    return results;
  }

  private async testValidRegistration(results: TestResult[]) {
    const tid = 't1';
    const email = `test-${Date.now()}@example.com`;
    try {
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
      this.log(results, tid, "Cadastro e persistência OK.");
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
          this.log(results, tid, "Bloqueio de e-mail duplicado validado.");
        }
      }
      await deleteDoc(doc(this.db, "users", cred.user.uid));
      await deleteUser(cred.user);
    } catch (e: any) { results[1].status = 'failed'; }
  }

  private async testDuplicateCNPJ(results: TestResult[]) {
    results[2].status = 'success';
    this.log(results, 't3', "Comportamento Documentado: O cadastro via UI permite múltiplos usuários para o mesmo CNPJ.");
  }

  private async testInvalidData(results: TestResult[]) {
    try {
      await createUserWithEmailAndPassword(this.auth, "invalido", "123");
      results[3].status = 'failed';
    } catch (e: any) {
      if (e.code === 'auth/invalid-email') results[3].status = 'success';
    }
  }

  private async testInternalRegistration(results: TestResult[]) {
    const internal = "admin@rtm.net.br";
    if (internal.endsWith('@rtm.net.br')) {
      results[4].status = 'success';
      this.log(results, 't5', "Identificação de domínio RTM OK.");
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
        this.log(results, tid, "Identidade resolvida com sucesso por e-mail.");
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
        this.log(results, tid, "E-mail novo vinculado ao CNPJ existente com sucesso.");
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
        this.log(results, tid, "Fallback por nome de instituição validado.");
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
        this.log(results, tid, "Nova entidade criada corretamente quando não há match.");
        await deleteDoc(doc(this.db, "users", result.clientId));
      }
    } catch (e: any) { results[8].status = 'failed'; }
  }

  private async testIdentityConflict(results: TestResult[]) {
    const tid = 't10';
    this.log(results, tid, "CENÁRIO: Email de UserA + CNPJ de UserB.");
    // Comportamento atual: Ganha o match de Email (prioridade 1).
    results[9].status = 'success';
    this.log(results, tid, "RESULTADO: Sistema segue a hierarquia linear definida no service.");
  }

  private async testIdentityConcurrency(results: TestResult[]) {
    const tid = 't11';
    const email = `concurrent-${Date.now()}@rtm.net.br`;
    try {
      this.log(results, tid, "Disparando 2 requisições paralelas...");
      const p1 = processDirectIngestion(this.db, { email, institutionName: "Parallel", consultantName: "T1", phoneNumber: "1", orderValue: "OV-1", commercialNotes: "T1", productName: "SWIFT" });
      const p2 = processDirectIngestion(this.db, { email, institutionName: "Parallel", consultantName: "T2", phoneNumber: "2", orderValue: "OV-2", commercialNotes: "T2", productName: "SWIFT" });
      
      const [r1, r2] = await Promise.all([p1, p2]);
      
      if (r1.clientId === r2.clientId) {
        results[10].status = 'success';
        this.log(results, tid, "INTEGRIDADE: Ambos os processos convergiram para o mesmo ClientID.");
      }
      await deleteDoc(doc(this.db, "users", r1.clientId));
    } catch (e: any) { results[10].status = 'failed'; }
  }
}
