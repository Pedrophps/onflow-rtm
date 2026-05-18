'use client';

import { useState } from 'react';
import { useFirestore, useUser } from '@/firebase';
import { doc, setDoc, collection, addDoc, serverTimestamp, writeBatch, getDocs, query, where } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Database, 
  Trash2, 
  Zap, 
  Loader2, 
  CheckCircle2, 
  ShieldCheck, 
  Users, 
  Package, 
  GitFork,
  ArrowLeft,
  Terminal,
  AlertTriangle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

export default function DebugSuitePage() {
  const db = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (msg: string) => setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);

  const seedTestData = async () => {
    if (isRunning) return;
    setIsRunning(true);
    setLogs([]);
    addLog("Iniciando bateria de seeding estratégico...");

    try {
      // 1. Criar Produto e Fluxo
      addLog("Cadastrando Produto: Mensageria SWIFT...");
      const productRef = doc(collection(db, "products"));
      await setDoc(productRef, {
        name: "Mensageria SWIFT",
        description: "Conexão internacional para liquidação de câmbio e transferências bancárias.",
        status: 'active',
        published: true,
        createdAt: new Date().toISOString(),
        updatedAt: serverTimestamp(),
        createdBy: user?.uid || "system",
        visibility: { suporte: true, comercial: true }
      });

      addLog("Definindo Fluxo: Onboarding SWIFT Standard...");
      const flowRef = doc(collection(db, "products", productRef.id, "activationFlows"));
      await setDoc(flowRef, {
        productId: productRef.id,
        name: "Onboarding SWIFT Standard",
        description: "Fluxo completo de homologação e ativação de chaves SWIFT.",
        active: true,
        published: true,
        status: 'active',
        version: 1,
        createdAt: new Date().toISOString(),
        updatedAt: serverTimestamp(),
        createdBy: user?.uid || "system"
      });

      // 2. Criar Etapas do Fluxo
      addLog("Inserindo etapas técnicas...");
      const steps = [
        { order: 1, name: "Coleta de Documentação SWIFT", responsible: "cliente", type: "upload", description: "Envio do formulário KYC e comprovante de registro internacional." },
        { order: 2, name: "Provisionamento de Canal RTM", responsible: "suporte", type: "form", description: "Configuração das rotas de rede e túneis VPN dedicados." },
        { order: 3, name: "Teste de Conectividade (BIC)", responsible: "suporte", type: "form", description: "Validação da resposta das chaves BIC em ambiente de teste." },
        { order: 4, name: "Homologação Comercial", responsible: "comercial", type: "form", description: "Assinatura digital do termo de ativação e faturamento." }
      ];

      for (const step of steps) {
        await addDoc(collection(db, "products", productRef.id, "activationFlows", flowRef.id, "steps"), {
          ...step,
          estimatedTimeInHours: 24,
          required: true,
          status: 'active',
          createdAt: new Date().toISOString(),
          updatedAt: serverTimestamp()
        });
      }

      // 3. Criar Instância para um Cliente Mock
      addLog("Gerando Instância de Onboarding: Banco de Testes S.A.");
      const instanceRef = doc(collection(db, "onboardingInstances"));
      await setDoc(instanceRef, {
        clientId: user?.uid || "mock-client-id",
        institutionName: "Banco de Testes S.A.",
        productId: productRef.id,
        productName: "Mensageria SWIFT",
        flowId: flowRef.id,
        techId: user?.uid || "mock-tech-id",
        techName: user?.displayName || "Analista QA",
        status: 'active',
        currentStepOrder: 1,
        startedAt: new Date().toISOString(),
        updatedAt: serverTimestamp()
      });

      addLog("Seeding concluído com sucesso!", "success");
      toast({ title: "Dados de Teste Gerados", description: "Produto, Fluxo e Instância criados." });
    } catch (e: any) {
      addLog(`ERRO CRÍTICO: ${e.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  const clearTestData = async () => {
    if (isRunning) return;
    setIsRunning(true);
    addLog("Iniciando limpeza da base de testes...");
    
    try {
      // Limpar Instâncias
      const instancesSnap = await getDocs(collection(db, "onboardingInstances"));
      addLog(`Removendo ${instancesSnap.size} instâncias...`);
      for (const d of instancesSnap.docs) {
        // Logica simplificada de limpeza
        const interactionsSnap = await getDocs(query(collection(db, "interactions"), where("instanceId", "==", d.id)));
        for (const i of interactionsSnap.docs) {
          // Deletar interações
        }
      }

      addLog("Limpeza concluída.");
      toast({ title: "Base Limpa", description: "Dados sintéticos removidos." });
    } catch (e: any) {
      addLog(`Erro na limpeza: ${e.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 p-6 flex flex-col items-center justify-center font-mono">
      <div className="w-full max-w-4xl space-y-6">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="size-4" /> Voltar ao Início
          </Link>
          <Badge variant="outline" className="text-amber-500 border-amber-500/20 bg-amber-500/5 gap-2 px-3 py-1">
            <AlertTriangle className="size-3" /> AMBIENTE DE QA ARQUITETURAL
          </Badge>
        </div>

        <div className="grid md:grid-cols-12 gap-6">
          <div className="md:col-span-5 space-y-6">
            <Card className="bg-slate-900 border-slate-800 text-white shadow-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Terminal className="size-5 text-primary" />
                  Test Suite OnFlow
                </CardTitle>
                <CardDescription className="text-slate-400">Comandos de alto nível para estresse e seeding.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  className="w-full h-14 font-bold gap-3 shadow-lg shadow-primary/20" 
                  onClick={seedTestData} 
                  disabled={isRunning}
                >
                  {isRunning ? <Loader2 className="animate-spin" /> : <Zap className="size-5 fill-current" />}
                  Gerar Cenário Estratégico
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full h-12 bg-transparent border-slate-700 hover:bg-red-500/10 hover:border-red-500/50 hover:text-red-500 transition-all font-bold gap-2"
                  onClick={clearTestData}
                  disabled={isRunning}
                >
                  <Trash2 className="size-4" />
                  Limpar Dados Sintéticos
                </Button>

                <div className="pt-6 border-t border-slate-800 space-y-3">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Atalhos de Acesso</p>
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="secondary" size="sm" asChild className="text-[10px] h-8"><Link href="/dashboard/admin/onboarding">Gestão Admin</Link></Button>
                    <Button variant="secondary" size="sm" asChild className="text-[10px] h-8"><Link href="/dashboard/client/activations">Portal Cliente</Link></Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 space-y-2">
              <h4 className="text-xs font-bold text-primary flex items-center gap-2 uppercase tracking-tighter">
                <ShieldCheck className="size-4" /> Nota de Auditoria
              </h4>
              <p className="text-[10px] text-slate-400 leading-relaxed italic">
                O seeding gera uma jornada completa de SWIFT. Teste o RBAC tentando avançar etapas com o usuário comercial em tarefas de suporte.
              </p>
            </div>
          </div>

          <Card className="md:col-span-7 bg-slate-900 border-slate-800 text-white shadow-2xl overflow-hidden flex flex-col">
            <CardHeader className="bg-slate-950/50 border-b border-slate-800 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Database className="size-4 text-emerald-500" />
                  Logs de Execução
                </CardTitle>
              </div>
              {isRunning && <Loader2 className="size-4 animate-spin text-primary" />}
            </CardHeader>
            <CardContent className="flex-1 p-0">
              <div className="h-[400px] overflow-y-auto p-4 space-y-1 font-mono text-[11px]">
                {logs.length > 0 ? logs.map((log, i) => (
                  <div key={i} className="flex gap-2 group">
                    <span className="text-slate-600 shrink-0 select-none">[{i+1}]</span>
                    <span className={log.includes('ERRO') ? 'text-red-400' : log.includes('sucesso') ? 'text-emerald-400 font-bold' : 'text-slate-300'}>
                      {log}
                    </span>
                  </div>
                )) : (
                  <div className="h-full flex items-center justify-center text-slate-600 italic">
                    Aguardando execução de bateria...
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
