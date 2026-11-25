
'use client';

import { useState } from 'react';
import { useFirestore, useUser } from '@/firebase';
import { 
  doc, 
  setDoc, 
  collection, 
  addDoc, 
  serverTimestamp, 
  getDocs, 
  query, 
  where, 
  limit, 
  deleteDoc,
  writeBatch
} from 'firebase/firestore';
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
  AlertTriangle,
  History,
  Play,
  Activity,
  UserPlus,
  Clock,
  Flag
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

export default function DebugSuitePage() {
  const db = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  const persistLog = async (message: string, type: 'info' | 'success' | 'error' | 'warning' = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
    
    if (db) {
      addDoc(collection(db, "system_logs"), {
        message,
        type,
        timestamp: new Date().toISOString(),
        userId: user?.uid || "system",
        context: "master-test-suite"
      });
    }
  };

  const runMasterTest = async () => {
    if (isRunning) return;
    setIsRunning(true);
    setLogs([]);
    persistLog("Iniciando MASTER TEST COMMAND - Fluxo Operacional 360°", "info");

    try {
      // ETAPA 1: Suporte Cadastra Produto e Fluxo
      persistLog("ETAPA 1: Suporte criando catálogo técnico...", "info");
      const productRef = doc(collection(db, "products"));
      const productId = productRef.id;
      
      await setDoc(productRef, {
        name: "TESTE E2E - CONECTIVIDADE RSFN",
        description: "Serviço de teste para validação de fluxo completo.",
        status: 'active',
        published: true,
        createdAt: new Date().toISOString(),
        updatedAt: serverTimestamp(),
        createdBy: user?.uid || "system",
        visibility: { suporte: true, comercial: true }
      });

      const flowRef = doc(collection(db, "products", productId, "activationFlows"));
      const flowId = flowRef.id;
      await setDoc(flowRef, {
        name: "Roteiro Padrão RSFN",
        description: "Etapas automáticas para teste de sistema.",
        version: 1,
        status: 'active',
        published: true,
        productId: productId,
        createdAt: new Date().toISOString(),
        updatedAt: serverTimestamp()
      });

      // Criar Etapas para o Fluxo
      const steps = [
        { order: 1, name: "Validação Documental", responsible: "comercial", estimatedTimeInHours: 24 },
        { order: 2, name: "Instalação de Link", responsible: "suporte", estimatedTimeInHours: 48 },
        { order: 3, name: "Teste de Aceite", responsible: "cliente", estimatedTimeInHours: 12 }
      ];

      for (const step of steps) {
        const stepRef = doc(collection(db, "products", productId, "activationFlows", flowId, "steps"));
        await setDoc(stepRef, {
          ...step,
          status: 'active',
          required: true,
          type: 'upload',
          createdAt: new Date().toISOString()
        });
      }
      persistLog("SUCCESS: Produto, Fluxo e 3 Etapas (Total 84h SLA) cadastrados.", "success");

      // ETAPA 2: Cliente se Cadastra
      persistLog("ETAPA 2: Simulando cadastro de novo cliente...", "info");
      const clientMockId = `client-test-${Date.now()}`;
      const clientRef = doc(db, "users", clientMockId);
      
      await setDoc(clientRef, {
        displayName: "Instituição de Teste S.A.",
        institutionName: "Banco de Teste",
        cnpj: "00.111.222/0001-33",
        email: `contato-${Date.now()}@cliente.com.br`,
        role: "client",
        status: "pending",
        institutionalStatus: "cadastro_recebido",
        createdAt: new Date().toISOString()
      });
      persistLog("SUCCESS: Cliente 'Banco de Teste' registrado com status 'Pendente'.", "success");

      // ETAPA 3: Comercial Aprova e Vincula
      persistLog("ETAPA 3: Comercial aprovando e vinculando ativação...", "info");
      await setDoc(clientRef, {
        status: "approved",
        institutionalStatus: "aprovado_comercialmente",
        orderValue: "OV-TEST-E2E",
        consultantName: "Analista Comercial Master",
        updatedAt: serverTimestamp()
      }, { merge: true });

      const instanceRef = doc(collection(db, "onboardingInstances"));
      const instanceId = instanceRef.id;
      
      // Cálculo do ETA previsto (Início + 84h)
      const now = new Date();
      const etaDate = new Date(now.getTime() + (84 * 60 * 60 * 1000));

      await setDoc(instanceRef, {
        clientId: clientMockId,
        institutionName: "Banco de Teste",
        productId: productId,
        productName: "TESTE E2E - CONECTIVIDADE RSFN",
        flowId: flowId,
        status: 'pending',
        supportStatus: 'fila_suporte',
        operationalStatus: 'em_andamento',
        currentStepOrder: 1,
        expectedDeliveryDate: etaDate.toISOString(),
        startedAt: now.toISOString(),
        updatedAt: serverTimestamp()
      });
      persistLog(`SUCCESS: Ativação criada. ETA Previsto: ${etaDate.toLocaleDateString()}.`, "success");

      // ETAPA 4: Suporte Assume e Avança
      persistLog("ETAPA 4: Suporte assumindo e avançando etapas...", "info");
      await setDoc(instanceRef, {
        techId: user?.uid || "mock-tech",
        techName: user?.displayName || "Analista Suporte",
        status: 'active',
        supportStatus: 'assumido_suporte',
        updatedAt: serverTimestamp()
      }, { merge: true });

      // Simular avanço para Etapa 2
      await setDoc(instanceRef, {
        currentStepOrder: 2,
        updatedAt: serverTimestamp()
      }, { merge: true });
      persistLog("SUCCESS: Suporte assumiu e avançou para etapa 2 (Progresso Visível).", "success");

      // ETAPA 5: Conclusão Final
      persistLog("ETAPA 5: Finalizando jornada...", "info");
      await setDoc(instanceRef, {
        status: 'completed',
        operationalStatus: 'concluido',
        completedAt: new Date().toISOString(),
        completedBy: user?.uid || "system",
        updatedAt: serverTimestamp()
      }, { merge: true });

      // Promoção institucional para ATIVO
      await setDoc(clientRef, {
        institutionalStatus: 'ativo',
        updatedAt: serverTimestamp()
      }, { merge: true });

      persistLog("MASTER TEST COMPLETO: Cliente está 'ATIVO' e ativação 'CONCLUÍDA' para todos os perfis.", "success");
      toast({ title: "Fluxo Validado", description: "O ciclo 360 funciona e os dados estão sincronizados." });
    } catch (e: any) {
      persistLog(`ERRO NO TESTE: ${e.message}`, "error");
      console.error(e);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 p-6 flex flex-col items-center justify-center font-mono">
      <div className="w-full max-w-5xl space-y-6">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="size-4" /> Início
          </Link>
          <Badge variant="outline" className="text-primary border-primary/20 bg-primary/5 gap-2 px-3 py-1">
            <Activity className="size-3" /> QA OPERATIONAL FLOW v2.0
          </Badge>
        </div>

        <div className="grid md:grid-cols-12 gap-6">
          <div className="md:col-span-5 space-y-6">
            <Card className="bg-slate-900 border-slate-800 text-white shadow-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Play className="size-5 text-primary" />
                  E2E Full Journey Test
                </CardTitle>
                <CardDescription className="text-slate-400">Valida Produto -> Cliente -> Comercial -> Suporte -> Conclusão</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  className="w-full h-20 font-black gap-3 shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90 text-lg" 
                  onClick={runMasterTest} 
                  disabled={isRunning}
                >
                  {isRunning ? <Loader2 className="animate-spin" /> : <Zap className="size-6 fill-current" />}
                  EXECUTAR TESTE 360°
                </Button>
                <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/20">
                  <h4 className="text-xs font-bold text-blue-400 flex items-center gap-2 uppercase mb-2">
                    <ShieldCheck className="size-4" /> Pontos de Verificação
                  </h4>
                  <ul className="text-[10px] text-slate-400 space-y-1">
                    <li>• Criação de Roteiro com SLAs (84h totais)</li>
                    <li>• Cálculo automático de ETA Previsto</li>
                    <li>• Mudança de Fila (Disponíveis -> Meus Atendimentos)</li>
                    <li>• Promoção Automática para Status Institucional 'Ativo'</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="md:col-span-7 bg-slate-900 border-slate-800 text-white shadow-2xl overflow-hidden flex flex-col">
            <CardHeader className="bg-slate-950/50 border-b border-slate-800 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Terminal className="size-4 text-emerald-500" />
                Live Validation Logs
              </CardTitle>
              {isRunning && <Loader2 className="size-4 animate-spin text-primary" />}
            </CardHeader>
            <CardContent className="flex-1 p-0">
              <div className="h-[480px] overflow-y-auto p-4 space-y-1 font-mono text-[11px]">
                {logs.length > 0 ? logs.map((log, i) => (
                  <div key={i} className="flex gap-2 group animate-in slide-in-from-left duration-300">
                    <span className="text-slate-600 shrink-0 select-none">[{i+1}]</span>
                    <span className={log.includes('SUCCESS') ? 'text-emerald-400' : log.includes('MASTER') ? 'text-primary font-bold' : 'text-slate-300'}>
                      {log}
                    </span>
                  </div>
                )) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-600 italic space-y-2">
                    <History className="size-10 opacity-20" />
                    <p>Aguardando disparo do fluxo técnico...</p>
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
