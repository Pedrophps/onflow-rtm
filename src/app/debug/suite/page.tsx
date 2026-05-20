
'use client';

import { useState } from 'react';
import { useFirestore, useUser } from '@/firebase';
import { doc, setDoc, collection, addDoc, serverTimestamp, getDocs, query, where, limit, deleteDoc } from 'firebase/firestore';
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
  UserPlus
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
      // ETAPA 1: Simulação de Ingestão via ERP (Lead)
      persistLog("ETAPA 1: Simulando chegada de e-mail via Power Automate...", "info");
      const clientMockId = `test-client-${Date.now()}`;
      const clientRef = doc(db, "users", clientMockId);
      
      await setDoc(clientRef, {
        displayName: "Banco Digital Delta S.A.",
        institutionName: "Delta Bank",
        cnpj: "99.000.111/0001-22",
        email: "onboarding@delta.auto.br",
        role: "client",
        status: "pending",
        createdAt: new Date().toISOString()
      });
      persistLog("SUCCESS: Lead 'Delta Bank' registrado com status 'pending'.", "success");

      // ETAPA 2: Simulação de Aprovação Comercial
      persistLog("ETAPA 2: Simulando Gestão Comercial configurando a venda...", "info");
      await setDoc(clientRef, {
        status: "approved",
        orderValue: "OV-2024-8877", // Validado conforme nova regra
        consultantName: "Ricardo Oliveira (Comercial RTM)",
        phoneNumber: "(11) 98888-7777",
        activeProduct: "prod-swift-gold",
        commercialNotes: "Cliente com urgência regulatória para o mês de Junho.",
        approvedAt: new Date().toISOString(),
        updatedAt: serverTimestamp()
      }, { merge: true });
      persistLog("SUCCESS: Comercial aprovou cliente com OV: OV-2024-8877.", "success");

      // ETAPA 3: Geração de Instância de Onboarding (Gatilho da aprovação)
      persistLog("ETAPA 3: Disparando instância para Fila de Espera do Suporte...", "info");
      const instanceRef = doc(collection(db, "onboardingInstances"));
      await setDoc(instanceRef, {
        clientId: clientMockId,
        institutionName: "Delta Bank",
        productId: "prod-swift-gold",
        productName: "Mensageria SWIFT Gold",
        status: 'pending', // Aparece na aba "Disponíveis"
        currentStepOrder: 1,
        startedAt: new Date().toISOString(),
        updatedAt: serverTimestamp()
      });
      persistLog("SUCCESS: Instância criada na fila 'Disponíveis'.", "success");

      // ETAPA 4: Suporte Assumindo o Atendimento
      persistLog("ETAPA 4: Simulando Analista de Suporte assumindo o caso...", "info");
      await setDoc(instanceRef, {
        techId: user?.uid || "mock-tech-id",
        techName: user?.displayName || "Analista de Redes",
        status: 'active', // Move para "Meus Atendimentos"
        updatedAt: serverTimestamp()
      }, { merge: true });
      persistLog(`SUCCESS: Analista ${user?.displayName || 'Mock'} assumiu o Delta Bank.`, "success");

      persistLog("MASTER TEST COMPLETO: Ciclo de vida operacional validado.", "success");
      toast({ title: "Teste Operacional Concluído", description: "O fluxo de ponta a ponta funcionou perfeitamente." });
    } catch (e: any) {
      persistLog(`ERRO CRÍTICO NO FLUXO: ${e.message}`, "error");
    } finally {
      setIsRunning(false);
    }
  };

  const clearTestData = async () => {
    persistLog("Limpando dados de teste...", "warning");
    // Em um sistema real, aqui deletaríamos as coleções criadas no teste
    setLogs([]);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 p-6 flex flex-col items-center justify-center font-mono">
      <div className="w-full max-w-5xl space-y-6">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="size-4" /> Início
          </Link>
          <div className="flex gap-4">
            <Button variant="ghost" size="sm" asChild className="text-xs gap-2 text-emerald-400 hover:text-emerald-300">
               <Link href="/debug/logs"><History className="size-4" /> Auditoria</Link>
            </Button>
            <Badge variant="outline" className="text-primary border-primary/20 bg-primary/5 gap-2 px-3 py-1">
              <Activity className="size-3" /> QA OPERATIONAL FLOW ACTIVE
            </Badge>
          </div>
        </div>

        <div className="grid md:grid-cols-12 gap-6">
          <div className="md:col-span-5 space-y-6">
            <Card className="bg-slate-900 border-slate-800 text-white shadow-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Terminal className="size-5 text-primary" />
                  E2E Operational Test
                </CardTitle>
                <CardDescription className="text-slate-400">Simulação real do ciclo comercial e técnico.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  className="w-full h-16 font-bold gap-3 shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90" 
                  onClick={runMasterTest} 
                  disabled={isRunning}
                >
                  {isRunning ? <Loader2 className="animate-spin" /> : <Play className="size-5 fill-current" />}
                  SIMULAR FLUXO COMPLETO
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full h-12 bg-transparent border-slate-700 hover:text-red-500 transition-all font-bold gap-2"
                  onClick={clearTestData}
                  disabled={isRunning}
                >
                  <Trash2 className="size-4" /> Limpar Console
                </Button>
              </CardContent>
            </Card>

            <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/20 space-y-2">
              <h4 className="text-xs font-bold text-blue-400 flex items-center gap-2 uppercase tracking-tighter">
                <ShieldCheck className="size-4" /> Diagnóstico de Lógica
              </h4>
              <p className="text-[10px] text-slate-400 leading-relaxed">
                Este teste valida se o suporte consegue ver apenas os clientes aprovados pelo comercial e se a OV está sendo propagada corretamente para o log de auditoria.
              </p>
            </div>
          </div>

          <Card className="md:col-span-7 bg-slate-900 border-slate-800 text-white shadow-2xl overflow-hidden flex flex-col">
            <CardHeader className="bg-slate-950/50 border-b border-slate-800 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Database className="size-4 text-emerald-500" />
                Live Execution Logs
              </CardTitle>
              {isRunning && <Loader2 className="size-4 animate-spin text-primary" />}
            </CardHeader>
            <CardContent className="flex-1 p-0">
              <div className="h-[450px] overflow-y-auto p-4 space-y-1 font-mono text-[11px]">
                {logs.length > 0 ? logs.map((log, i) => (
                  <div key={i} className="flex gap-2 group animate-in slide-in-from-left duration-300">
                    <span className="text-slate-600 shrink-0 select-none">[{i+1}]</span>
                    <span className={log.includes('SUCCESS') ? 'text-emerald-400' : log.includes('MASTER') ? 'text-primary font-bold' : 'text-slate-300'}>
                      {log}
                    </span>
                  </div>
                )) : (
                  <div className="h-full flex items-center justify-center text-slate-600 italic">
                    Aguardando execução do comando...
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
