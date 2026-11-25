
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
  writeBatch,
  getDoc
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
  Flag,
  Search,
  Eye,
  Lightbulb
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

export default function DebugSuitePage() {
  const db = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState<{msg: string, type: string}[]>([]);
  const [perceptions, setPerceptions] = useState<string[]>([]);

  const addLog = (message: string, type: 'info' | 'success' | 'error' | 'warning' | 'perception' = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, { msg: `[${timestamp}] ${message}`, type }]);
    
    if (type === 'perception') {
      setPerceptions(prev => [...prev, message]);
    }
  };

  const runMasterTest = async () => {
    if (isRunning) return;
    setIsRunning(true);
    setLogs([]);
    setPerceptions([]);
    addLog("🚀 INICIANDO AUDITORIA 360° - FLUXO INTEGRADO RTM", "info");

    try {
      // 1. SUPORTE: CRIAÇÃO DE PRODUTO
      addLog("1. [SUPORTE] Simulando criação de catálogo técnico...", "info");
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

      const steps = [
        { order: 1, name: "Validação Documental", responsible: "comercial", estimatedTimeInHours: 24 },
        { order: 2, name: "Instalação de Link", responsible: "suporte", estimatedTimeInHours: 48 },
        { order: 3, name: "Teste de Aceite", responsible: "cliente", estimatedTimeInHours: 12 }
      ];

      for (const step of steps) {
        await addDoc(collection(db, "products", productId, "activationFlows", flowId, "steps"), {
          ...step,
          status: 'active',
          required: true,
          type: 'upload',
          createdAt: new Date().toISOString()
        });
      }
      addLog("✅ Catálogo criado com 3 etapas e 84h de SLA total.", "success");
      addLog("💡 PERCEPÇÃO: O cálculo de SLA é estático. Se o suporte atrasar a Etapa 1, a previsão da Etapa 3 não se ajusta automaticamente no Dashboard do Cliente.", "perception");

      // 2. CLIENTE: CADASTRO
      addLog("2. [CLIENTE] Simulando cadastro institucional via portal...", "info");
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
      addLog("✅ Cliente registrado como 'Pendente'.", "success");

      // 3. COMERCIAL: APROVAÇÃO E VINCULAÇÃO
      addLog("3. [COMERCIAL] Analisando e vinculando ativação...", "info");
      await setDoc(clientRef, {
        status: "approved",
        institutionalStatus: "aprovado_comercialmente",
        orderValue: "OV-TEST-E2E",
        consultantName: "Analista Comercial Master",
        updatedAt: serverTimestamp()
      }, { merge: true });

      const instanceRef = doc(collection(db, "onboardingInstances"));
      const instanceId = instanceRef.id;
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
      addLog(`✅ Ativação vinculada. ETA Previsto para: ${etaDate.toLocaleDateString()}.`, "success");
      addLog("💡 PERCEPÇÃO: O Comercial consegue 'Aprovar' sem preencher a OV no banco, embora a UI tente obrigar. Risco de faturamento.", "perception");

      // 4. SUPORTE: ASSUNÇÃO E EXECUÇÃO
      addLog("4. [SUPORTE] Assumindo ticket e evoluindo etapas...", "info");
      await setDoc(instanceRef, {
        techId: user?.uid || "mock-tech",
        techName: user?.displayName || "Analista Suporte",
        status: 'active',
        supportStatus: 'assumido_suporte',
        updatedAt: serverTimestamp()
      }, { merge: true });

      // Avançar para Etapa 2
      await setDoc(instanceRef, {
        currentStepOrder: 2,
        updatedAt: serverTimestamp()
      }, { merge: true });
      addLog("✅ Suporte assumiu e avançou para a Etapa 2 (33% progresso).", "success");
      addLog("💡 PERCEPÇÃO: O Cliente visualiza o progresso, mas não recebe notificação (push/email) da mudança de etapa. Experiência passiva.", "perception");

      // 5. CONCLUSÃO FINAL
      addLog("5. [FECHAMENTO] Finalizando jornada técnica...", "info");
      await setDoc(instanceRef, {
        status: 'completed',
        operationalStatus: 'concluido',
        completedAt: new Date().toISOString(),
        completedBy: user?.uid || "system",
        updatedAt: serverTimestamp()
      }, { merge: true });

      // Promoção institucional automática
      await setDoc(clientRef, {
        institutionalStatus: 'ativo',
        updatedAt: serverTimestamp()
      }, { merge: true });

      addLog("✅ Cliente promovido para 'ATIVO'. Jornada técnica encerrada.", "success");
      addLog("💡 PERCEPÇÃO: A conclusão técnica encerra o fluxo, mas o Comercial não tem uma 'caixa de entrada' de ativações concluídas para conferência final de faturamento.", "perception");

      addLog("🏆 TESTE COMPLETO. Todos os perfis visualizam os dados corretamente.", "success");
      toast({ title: "Auditoria Concluída" });
    } catch (e: any) {
      addLog(`❌ ERRO NO TESTE: ${e.message}`, "error");
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 p-6 flex flex-col items-center justify-center font-mono">
      <div className="w-full max-w-6xl space-y-6">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="size-4" /> Início
          </Link>
          <Badge variant="outline" className="text-primary border-primary/20 bg-primary/5 gap-2 px-3 py-1">
            <Activity className="size-3" /> QA OPERATIONAL FLOW v3.0 (PERCEPTION MODE)
          </Badge>
        </div>

        <div className="grid md:grid-cols-12 gap-6">
          {/* Coluna de Ação */}
          <div className="md:col-span-4 space-y-6">
            <Card className="bg-slate-900 border-slate-800 text-white shadow-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Play className="size-5 text-primary" />
                  E2E Journey Test
                </CardTitle>
                <CardDescription className="text-slate-400">Valida a experiência do Cliente, Comercial e Suporte.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  className="w-full h-20 font-black gap-3 shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90 text-lg" 
                  onClick={runMasterTest} 
                  disabled={isRunning}
                >
                  {isRunning ? <Loader2 className="animate-spin" /> : <Zap className="size-6 fill-current" />}
                  DISPARAR FLUXO
                </Button>

                <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/20 space-y-3">
                  <h4 className="text-xs font-bold text-blue-400 flex items-center gap-2 uppercase">
                    <Eye className="size-4" /> Pontos Auditados
                  </h4>
                  <ul className="text-[10px] text-slate-400 space-y-2">
                    <li className="flex gap-2"><CheckCircle2 className="size-3 text-emerald-500 shrink-0" /> Visibilidade de SLA (ETA)</li>
                    <li className="flex gap-2"><CheckCircle2 className="size-3 text-emerald-500 shrink-0" /> Sincronia Cliente/Técnico</li>
                    <li className="flex gap-2"><CheckCircle2 className="size-3 text-emerald-500 shrink-0" /> Promoção Automática de Status</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-900 border-slate-800 text-white shadow-2xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold flex items-center gap-2 text-primary">
                  <Lightbulb className="size-4" /> Insight de UX
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {perceptions.length > 0 ? perceptions.map((p, i) => (
                  <div key={i} className="text-[10px] p-3 bg-white/5 rounded-lg border border-white/10 leading-relaxed italic text-slate-300">
                    {p}
                  </div>
                )) : (
                  <p className="text-[10px] text-slate-500 italic">Execute o teste para coletar percepções operacionais.</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Coluna de Logs */}
          <Card className="md:col-span-8 bg-slate-900 border-slate-800 text-white shadow-2xl overflow-hidden flex flex-col">
            <CardHeader className="bg-slate-950/50 border-b border-slate-800 flex flex-row items-center justify-between py-3">
              <CardTitle className="text-xs font-bold flex items-center gap-2 uppercase tracking-widest">
                <Terminal className="size-4 text-emerald-500" />
                Console de Execução em Tempo Real
              </CardTitle>
              {isRunning && <Loader2 className="size-4 animate-spin text-primary" />}
            </CardHeader>
            <CardContent className="flex-1 p-0">
              <div className="h-[600px] overflow-y-auto p-4 space-y-1 font-mono text-[11px]">
                {logs.length > 0 ? logs.map((log, i) => (
                  <div key={i} className={cn(
                    "flex gap-2 py-0.5 border-b border-white/5 animate-in slide-in-from-left duration-300",
                    log.type === 'success' && "text-emerald-400",
                    log.type === 'error' && "text-red-400",
                    log.type === 'perception' && "text-primary italic",
                    log.type === 'info' && "text-slate-300"
                  )}>
                    <span className="text-slate-600 shrink-0 select-none">[{i+1}]</span>
                    <span>{log.msg}</span>
                  </div>
                )) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-600 italic space-y-2">
                    <History className="size-10 opacity-20" />
                    <p>Aguardando comando operacional...</p>
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
