
'use client';

import { useState, useMemo } from 'react';
import { useFirestore, useUser, useCollection } from '@/firebase';
import { 
  collection, 
  query, 
  getDocs, 
  doc, 
  setDoc, 
  addDoc, 
  serverTimestamp, 
  deleteDoc,
  writeBatch
} from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Database, 
  Search, 
  AlertTriangle, 
  CheckCircle2, 
  Zap, 
  Loader2, 
  ArrowLeft, 
  RefreshCw,
  FileWarning,
  LayoutGrid,
  ShieldCheck
} from 'lucide-react';
import Link from 'next/link';
import { UserProfile, OnboardingInstance, Product } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

export default function DatabaseAuditPage() {
  const db = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  
  const [isAuditing, setIsAuditing] = useState(false);
  const [isHealing, setIsHealing] = useState(false);
  const [auditResults, setAuditResults] = useState<{
    orphanedInstances: string[];
    clientsMissingOV: string[];
    emptyProducts: string[];
    totalRecords: number;
  } | null>(null);

  const runAudit = async () => {
    setIsAuditing(true);
    setAuditResults(null);

    try {
      const usersSnap = await getDocs(collection(db, "users"));
      const instancesSnap = await getDocs(collection(db, "onboardingInstances"));
      const productsSnap = await getDocs(collection(db, "products"));

      const clients = usersSnap.docs.map(d => ({ id: d.id, ...d.data() } as UserProfile));
      const instances = instancesSnap.docs.map(d => ({ id: d.id, ...d.data() } as OnboardingInstance));
      
      // 1. Clientes Aprovados sem OV (Ordem de Venda)
      const missingOV = clients
        .filter(c => c.role === 'client' && c.status === 'approved' && !c.orderValue)
        .map(c => `${c.institutionName || c.displayName} (${c.id?.substring(0,5)})`);

      // 2. Instâncias Órfãs (sem cliente correspondente)
      const orphaned = instances
        .filter(inst => !clients.find(c => c.id === inst.clientId))
        .map(inst => `Instância ${inst.id?.substring(0,5)} (Cliente ID: ${inst.clientId})`);

      // 3. Produtos sem Fluxo/Roteiro
      const emptyProds: string[] = [];
      for (const pDoc of productsSnap.docs) {
        const flowsSnap = await getDocs(collection(db, "products", pDoc.id, "activationFlows"));
        if (flowsSnap.empty) emptyProds.push(pDoc.data().name || pDoc.id);
      }

      setAuditResults({
        orphanedInstances: orphaned,
        clientsMissingOV: missingOV,
        emptyProducts: emptyProds,
        totalRecords: usersSnap.size + instancesSnap.size + productsSnap.size
      });

      toast({ title: "Auditoria Concluída", description: "Verifique os pontos de atenção identificados." });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Erro na Auditoria", description: e.message });
    } finally {
      setIsAuditing(false);
    }
  };

  const healDatabase = async () => {
    if (!user) return;
    setIsHealing(true);

    try {
      const batch = writeBatch(db);

      // A: CRIAR PRODUTO PADRÃO ORQUESTRADO
      const productRef = doc(collection(db, "products"));
      batch.set(productRef, {
        name: "MENSAGERIA SWIFT",
        description: "Serviço crítico de mensageria financeira internacional.",
        status: 'active',
        published: true,
        createdAt: new Date().toISOString(),
        updatedAt: serverTimestamp(),
        createdBy: user.uid
      });

      // B: CRIAR FLUXO TÉCNICO
      const flowRef = doc(collection(db, "products", productRef.id, "activationFlows"));
      batch.set(flowRef, {
        name: "Onboarding Standard SWIFT",
        description: "Roteiro técnico homologado pela RTM.",
        version: 1,
        status: 'active',
        published: true,
        createdAt: new Date().toISOString(),
        updatedAt: serverTimestamp()
      });

      // C: INSERIR ETAPAS (O coração do sistema)
      const steps = [
        { order: 1, name: "Formalização e OV", description: "Validação da Ordem de Venda e contratos.", responsible: "comercial", estimatedTimeInHours: 24, required: true },
        { order: 2, name: "Túnel VPN RTM", description: "Configuração de rede e segurança de borda.", responsible: "suporte", estimatedTimeInHours: 48, required: true },
        { order: 3, name: "Teste de Conectividade", description: "Homologação final no ambiente do cliente.", responsible: "cliente", estimatedTimeInHours: 12, required: true }
      ];

      for (const step of steps) {
        const stepRef = doc(collection(db, "products", productRef.id, "activationFlows", flowRef.id, "steps"));
        batch.set(stepRef, { ...step, createdAt: new Date().toISOString(), updatedAt: serverTimestamp() });
      }

      await batch.commit();
      
      toast({ 
        title: "Banco Saneado!", 
        description: "Produto 'Mensageria SWIFT' e roteiros técnicos inseridos com sucesso." 
      });
      runAudit();
    } catch (e: any) {
      toast({ variant: "destructive", title: "Erro ao Curar", description: e.message });
    } finally {
      setIsHealing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8 font-body">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Link href="/dashboard/admin" className="text-xs font-bold text-muted-foreground hover:text-primary flex items-center gap-1">
              <ArrowLeft className="size-3" /> VOLTAR AO PAINEL
            </Link>
            <h1 className="text-3xl font-bold font-headline text-slate-900 flex items-center gap-3">
              <Database className="size-8 text-primary" /> Auditor do Ecossistema
            </h1>
            <p className="text-muted-foreground">Análise de conformidade e integridade das coleções do OnFlow.</p>
          </div>
          <Button 
            onClick={runAudit} 
            disabled={isAuditing}
            className="rounded-xl font-bold gap-2 shadow-lg"
          >
            {isAuditing ? <Loader2 className="animate-spin size-4" /> : <Search className="size-4" />}
            Iniciar Auditoria
          </Button>
        </div>

        {auditResults ? (
          <div className="grid gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-3 gap-4">
              <StatCard label="Registros Totais" value={auditResults.totalRecords} color="blue" />
              <StatCard label="Órfãos/Inconsistentes" value={auditResults.orphanedInstances.length + auditResults.clientsMissingOV.length} color="red" />
              <StatCard label="Produtos Saneados" value={auditResults.emptyProducts.length === 0 ? "OK" : auditResults.emptyProducts.length} color="emerald" />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <Card className="border-none shadow-sm">
                <CardHeader>
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <FileWarning className="size-4 text-amber-500" /> Falhas de Validação (Comercial)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {auditResults.clientsMissingOV.length > 0 ? auditResults.clientsMissingOV.map((msg, i) => (
                    <div key={i} className="text-xs p-3 bg-amber-50 border border-amber-100 rounded-lg text-amber-700 font-medium">
                      Cliente aprovado sem OV: <strong>{msg}</strong>
                    </div>
                  )) : (
                    <div className="text-xs text-muted-foreground italic py-4">Nenhuma falha de OV encontrada.</div>
                  )}
                </CardContent>
              </Card>

              <Card className="border-none shadow-sm">
                <CardHeader>
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <LayoutGrid className="size-4 text-primary" /> Produtos sem Roteiro Técnico
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {auditResults.emptyProducts.length > 0 ? auditResults.emptyProducts.map((name, i) => (
                    <div key={i} className="text-xs p-3 bg-red-50 border border-red-100 rounded-lg text-red-700 font-medium">
                      Produto sem etapas: <strong>{name}</strong>
                    </div>
                  )) : (
                    <div className="text-xs text-muted-foreground italic py-4">Todos os produtos possuem fluxos vinculados.</div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="bg-slate-900 rounded-3xl p-8 text-white relative overflow-hidden">
              <div className="relative z-10 space-y-6">
                <div className="space-y-2">
                  <Badge className="bg-primary/20 text-primary border-primary/30">Ação de Saneamento</Badge>
                  <h3 className="text-2xl font-bold font-headline">Re-orquestrar Estrutura Mestra?</h3>
                  <p className="text-slate-400 text-sm max-w-xl leading-relaxed">
                    Esta ação não deleta seus dados atuais, mas insere um **Produto Padrão Homologado (SWIFT)** com todas as 3 etapas essenciais e SLAs corretos. É a melhor maneira de garantir que o Suporte tenha um "molde" perfeito para trabalhar.
                  </p>
                </div>
                <Button 
                  onClick={healDatabase} 
                  disabled={isHealing}
                  className="bg-white text-slate-900 hover:bg-slate-200 font-black px-10 h-14 rounded-2xl gap-3 shadow-2xl"
                >
                  {isHealing ? <Loader2 className="animate-spin" /> : <Zap className="size-5 fill-current" />}
                  EXECUTAR CURA E INSERÇÃO MESTRA
                </Button>
              </div>
              <div className="absolute top-0 right-0 size-64 bg-primary/20 blur-3xl rounded-full -mr-32 -mt-32"></div>
            </div>
          </div>
        ) : (
          <div className="py-24 text-center border-2 border-dashed rounded-[3rem] bg-white space-y-4">
            <div className="size-20 rounded-full bg-slate-50 flex items-center justify-center mx-auto">
              <Database className="size-10 text-slate-200" />
            </div>
            <div className="space-y-1">
              <p className="text-xl font-bold text-slate-400">Banco de Dados em Standby</p>
              <p className="text-sm text-muted-foreground">Inicie a auditoria para escanear a integridade operacional.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, color }: any) {
  const colors: any = {
    blue: "bg-blue-50 border-blue-100 text-blue-700",
    red: "bg-red-50 border-red-100 text-red-700",
    emerald: "bg-emerald-50 border-emerald-100 text-emerald-700",
  };
  return (
    <div className={`p-6 rounded-3xl border-2 ${colors[color]} space-y-1 shadow-sm`}>
      <p className="text-[10px] font-black uppercase tracking-widest opacity-70">{label}</p>
      <p className="text-3xl font-black">{value}</p>
    </div>
  );
}
