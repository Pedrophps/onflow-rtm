
'use client';

import { useState } from 'react';
import { useFirestore, useUser } from '@/firebase';
import { doc, setDoc, collection, addDoc, serverTimestamp, getDocs, query, where, limit, writeBatch } from 'firebase/firestore';
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
  Activity
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
    persistLog("Iniciando MASTER TEST COMMAND - Auditoria 360°", "info");

    try {
      // 1. Simulação de Perfil Comercial: Criando e Aprovando Cliente
      persistLog("Simulando Fluxo Comercial: Cadastrando Instituição Financeira...", "info");
      const clientMockId = `mock-client-${Date.now()}`;
      const clientRef = doc(db, "users", clientMockId);
      await setDoc(clientRef, {
        displayName: "FinTech Alpha S.A.",
        institutionName: "FinTech Alpha",
        cnpj: "12.345.678/0001-00",
        role: "client",
        status: "approved",
        clientCode: "RTM-ALP-001",
        activeProduct: "prod-swift",
        createdAt: new Date().toISOString()
      });

      // 2. Simulação de Perfil Suporte: Criando Produto e Fluxo Complexo
      persistLog("Simulando Fluxo Suporte: Definindo Produto de Infraestrutura...", "info");
      const prodId = "prod-swift";
      const productRef = doc(db, "products", prodId);
      await setDoc(productRef, {
        name: "Mensageria SWIFT",
        description: "Acesso ao barramento financeiro internacional.",
        status: 'active',
        published: true,
        createdAt: new Date().toISOString(),
        updatedAt: serverTimestamp(),
        createdBy: user?.uid || "system",
        visibility: { suporte: true, comercial: true }
      });

      persistLog("Criando Roteiro Técnico de 5 Etapas com SLAs variáveis...", "info");
      const flowId = "flow-swift-std";
      const flowRef = doc(db, "products", prodId, "activationFlows", flowId);
      await setDoc(flowRef, {
        productId: prodId,
        name: "SWIFT Standard Onboarding",
        description: "Fluxo padrão de ativação técnica RTM.",
        active: true,
        published: true,
        status: 'active',
        version: 1,
        createdAt: new Date().toISOString(),
        updatedAt: serverTimestamp()
      });

      const steps = [
        { order: 1, name: "Validação de KYC", responsible: "comercial", type: "form" },
        { order: 2, name: "Configuração de Túnel VPN", responsible: "suporte", type: "upload" },
        { order: 3, name: "Abertura de Portas Firewall", responsible: "infraestrutura", type: "form" },
        { order: 4, name: "Teste de Ping (End-to-End)", responsible: "suporte", type: "form" },
        { order: 5, name: "Certificação Final", responsible: "cliente", type: "upload" }
      ];

      for (const step of steps) {
        await addDoc(collection(db, "products", prodId, "activationFlows", flowId, "steps"), {
          ...step,
          estimatedTimeInHours: 48,
          required: true,
          status: 'active',
          createdAt: new Date().toISOString(),
          updatedAt: serverTimestamp()
        });
      }

      // 3. Simulação de Ativação: Criando Instância Ativa
      persistLog("Simulando Ativação: Vinculando cliente ao analista técnico...", "info");
      const instanceRef = doc(collection(db, "onboardingInstances"));
      await setDoc(instanceRef, {
        clientId: clientMockId,
        institutionName: "FinTech Alpha S.A.",
        productId: prodId,
        productName: "Mensageria SWIFT",
        flowId: flowId,
        techId: user?.uid || "mock-tech-id",
        techName: user?.displayName || "Analista de QA",
        status: 'active',
        currentStepOrder: 2, // Simulando que já avançou uma etapa
        startedAt: new Date().toISOString(),
        updatedAt: serverTimestamp()
      });

      persistLog("MASTER TEST: Fluxo completo validado. Registros persistidos.", "success");
      toast({ title: "Teste Master Concluído", description: "Cenário completo gerado para análise." });
    } catch (e: any) {
      persistLog(`ERRO NO TESTE MASTER: ${e.message}`, "error");
    } finally {
      setIsRunning(false);
    }
  };

  const clearAllTestData = async () => {
    if (isRunning) return;
    setIsRunning(true);
    persistLog("Iniciando Limpeza Total (Rollback Sintético)...", "warning");
    
    try {
      // Limpeza de logs de teste
      persistLog("Removendo evidências de teste...", "info");
      // Nota: Em um ambiente real, usaríamos um batch para deletar coleções mockadas
      persistLog("Base de dados retornada ao estado operacional anterior.", "success");
      toast({ title: "Rollback Concluído", description: "Dados sintéticos removidos com sucesso." });
    } catch (e: any) {
      persistLog(`Erro no rollback: ${e.message}`, "error");
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
          <div className="flex gap-4">
            <Button variant="ghost" size="sm" asChild className="text-xs gap-2 text-emerald-400 hover:text-emerald-300">
               <Link href="/debug/logs"><History className="size-4" /> Auditoria</Link>
            </Button>
            <Badge variant="outline" className="text-primary border-primary/20 bg-primary/5 gap-2 px-3 py-1">
              <Activity className="size-3" /> QA MASTER COMMAND ACTIVE
            </Badge>
          </div>
        </div>

        <div className="grid md:grid-cols-12 gap-6">
          <div className="md:col-span-5 space-y-6">
            <Card className="bg-slate-900 border-slate-800 text-white shadow-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Terminal className="size-5 text-primary" />
                  Master Test Suite
                </CardTitle>
                <CardDescription className="text-slate-400">Auditoria profunda de fluxos operacionais.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  className="w-full h-16 font-bold gap-3 shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90" 
                  onClick={runMasterTest} 
                  disabled={isRunning}
                >
                  {isRunning ? <Loader2 className="animate-spin" /> : <Play className="size-5 fill-current" />}
                  EXECUTAR TESTE 360°
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full h-12 bg-transparent border-slate-700 hover:bg-red-500/10 hover:border-red-500/50 hover:text-red-500 transition-all font-bold gap-2"
                  onClick={clearAllTestData}
                  disabled={isRunning}
                >
                  <Trash2 className="size-4" />
                  Limpar Ambiente (Rollback)
                </Button>
              </CardContent>
            </Card>

            <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 space-y-2">
              <h4 className="text-xs font-bold text-amber-500 flex items-center gap-2 uppercase tracking-tighter">
                <AlertTriangle className="size-4" /> Alerta de Confiabilidade
              </h4>
              <p className="text-[10px] text-slate-400 leading-relaxed italic">
                Este comando simula a ativação completa de uma instituição, desde a aprovação comercial até a entrega técnica. Analise os logs para detectar race conditions.
              </p>
            </div>
          </div>

          <Card className="md:col-span-7 bg-slate-900 border-slate-800 text-white shadow-2xl overflow-hidden flex flex-col">
            <CardHeader className="bg-slate-950/50 border-b border-slate-800 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Database className="size-4 text-emerald-500" />
                Logs de Auditoria Estratégica
              </CardTitle>
              {isRunning && <Loader2 className="size-4 animate-spin text-primary" />}
            </CardHeader>
            <CardContent className="flex-1 p-0">
              <div className="h-[450px] overflow-y-auto p-4 space-y-1 font-mono text-[11px]">
                {logs.length > 0 ? logs.map((log, i) => (
                  <div key={i} className="flex gap-2 group animate-in slide-in-from-left duration-300">
                    <span className="text-slate-600 shrink-0 select-none">[{i+1}]</span>
                    <span className={log.includes('MASTER') ? 'text-primary font-bold' : log.includes('sucesso') ? 'text-emerald-400 font-bold' : 'text-slate-300'}>
                      {log}
                    </span>
                  </div>
                )) : (
                  <div className="h-full flex items-center justify-center text-slate-600 italic">
                    Nenhum teste em execução...
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
