'use client';

import { useState } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { doc, setDoc, getDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle2, XCircle, ShieldCheck, Database, FileText, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

export default function IntegrationTestPage() {
  const { user, loading: userLoading } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<{
    profileWrite: 'pending' | 'success' | 'error';
    profileRead: 'pending' | 'success' | 'error';
    flowWrite: 'pending' | 'success' | 'error' | 'forbidden';
    submissionWrite: 'pending' | 'success' | 'error';
  }>({
    profileWrite: 'pending',
    profileRead: 'pending',
    flowWrite: 'pending',
    submissionWrite: 'pending',
  });

  const runTests = async () => {
    if (!user) {
      toast({ 
        variant: "destructive", 
        title: "Autenticação Necessária", 
        description: "Você precisa estar logado para testar as regras de segurança." 
      });
      return;
    }

    setIsRunning(true);
    setResults({
      profileWrite: 'pending',
      profileRead: 'pending',
      flowWrite: 'pending',
      submissionWrite: 'pending',
    });

    // 1. Test Profile Write (Deve funcionar para o próprio usuário)
    try {
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, {
        lastIntegrationTestAt: serverTimestamp(),
        testStatus: "online"
      }, { merge: true });
      setResults(prev => ({ ...prev, profileWrite: 'success' }));
    } catch (e) {
      console.error("Profile Write Error:", e);
      setResults(prev => ({ ...prev, profileWrite: 'error' }));
    }

    // 2. Test Profile Read
    try {
      const userRef = doc(db, 'users', user.uid);
      const snap = await getDoc(userRef);
      if (snap.exists()) {
        setResults(prev => ({ ...prev, profileRead: 'success' }));
      } else {
        setResults(prev => ({ ...prev, profileRead: 'error' }));
      }
    } catch (e) {
      console.error("Profile Read Error:", e);
      setResults(prev => ({ ...prev, profileRead: 'error' }));
    }

    // 3. Test Flow Write (Requer role='admin')
    try {
      const flowRef = doc(collection(db, 'onboardingFlows'), 'test-validation');
      await setDoc(flowRef, {
        name: "Validação de Regras",
        updatedAt: serverTimestamp()
      }, { merge: true });
      setResults(prev => ({ ...prev, flowWrite: 'success' }));
    } catch (e: any) {
      console.error("Flow Write Error:", e);
      if (e.code === 'permission-denied') {
        setResults(prev => ({ ...prev, flowWrite: 'forbidden' }));
      } else {
        setResults(prev => ({ ...prev, flowWrite: 'error' }));
      }
    }

    // 4. Test Submission Write (Deve funcionar para qualquer logado)
    try {
      await addDoc(collection(db, 'submissions'), {
        userId: user.uid,
        stageId: "test-stage",
        submittedAt: serverTimestamp(),
        status: "pending",
        testType: "integration-validation"
      });
      setResults(prev => ({ ...prev, submissionWrite: 'success' }));
    } catch (e) {
      console.error("Submission Write Error:", e);
      setResults(prev => ({ ...prev, submissionWrite: 'error' }));
    }

    setIsRunning(false);
    toast({ title: "Bateria de testes concluída" });
  };

  const StatusIcon = ({ status }: { status: string }) => {
    if (status === 'success') return <CheckCircle2 className="size-5 text-emerald-500 animate-in zoom-in duration-300" />;
    if (status === 'error') return <XCircle className="size-5 text-destructive animate-in zoom-in duration-300" />;
    if (status === 'forbidden') return <ShieldCheck className="size-5 text-amber-500 animate-in zoom-in duration-300" />;
    return <Loader2 className="size-5 animate-spin text-muted-foreground opacity-20" />;
  };

  if (userLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="size-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 font-body">
      <div className="w-full max-w-2xl mb-4">
        <Button variant="ghost" size="sm" asChild className="gap-2">
          <Link href="/debug"><ArrowLeft className="size-4" /> Voltar ao Debug</Link>
        </Button>
      </div>
      
      <Card className="w-full max-w-2xl shadow-xl border-t-4 border-t-primary bg-white">
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="text-2xl font-headline font-bold">Validação de Segurança</CardTitle>
              <CardDescription>Testando a comunicação real com o Firestore (Security Rules v2)</CardDescription>
            </div>
            <Database className="size-8 text-primary/10" />
          </div>
        </CardHeader>
        <CardContent className="pt-8 space-y-6">
          <div className="grid gap-4">
            <TestRow 
              title="Escrita de Perfil" 
              subtitle={`Coleção: /users/${user?.uid || '...'}`}
              status={results.profileWrite}
              icon={<CheckCircle2 className="size-5" />}
              color="blue"
            />

            <TestRow 
              title="Leitura de Perfil" 
              subtitle="Verificando acesso aos próprios dados"
              status={results.profileRead}
              icon={<Database className="size-5" />}
              color="emerald"
            />

            <TestRow 
              title="Escrita de Fluxo" 
              subtitle="Coleção: /onboardingFlows (Requer Admin)"
              status={results.flowWrite}
              icon={<ShieldCheck className="size-5" />}
              color="amber"
              badge={results.flowWrite === 'forbidden' ? "Requer role=admin" : undefined}
            />

            <TestRow 
              title="Submissão de Evidência" 
              subtitle="Coleção: /submissions"
              status={results.submissionWrite}
              icon={<FileText className="size-5" />}
              color="purple"
            />
          </div>

          {!user ? (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm font-medium flex items-center gap-3">
              <ShieldCheck className="size-5" />
              Usuário deslogado. Faça login para testar as permissões de usuário.
            </div>
          ) : (
            <Button 
              className="w-full h-12 font-bold text-base shadow-lg shadow-primary/20" 
              onClick={runTests} 
              disabled={isRunning}
            >
              {isRunning ? <Loader2 className="animate-spin mr-2" /> : "Iniciar Bateria de Testes"}
            </Button>
          )}

          <div className="flex gap-3">
             <Button variant="outline" className="flex-1 font-bold" asChild>
                <Link href="/login">Ir para Login</Link>
             </Button>
             <Button variant="outline" className="flex-1 font-bold" asChild>
                <Link href="/dashboard/admin/select-profile">Ativar Perfil Admin</Link>
             </Button>
          </div>
        </CardContent>
      </Card>
      
      <p className="mt-8 text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-bold">
        OnFlow RTM • Diagnóstico de Permissões
      </p>
    </div>
  );

  function TestRow({ title, subtitle, status, icon, color, badge }: any) {
    const colorClasses: any = {
      blue: "bg-blue-50 text-blue-600",
      emerald: "bg-emerald-50 text-emerald-600",
      amber: "bg-amber-50 text-amber-600",
      purple: "bg-purple-50 text-purple-600",
    };

    return (
      <div className="flex items-center justify-between p-4 rounded-xl border bg-slate-50/50 hover:bg-white hover:shadow-sm transition-all group">
        <div className="flex items-center gap-4">
          <div className={`size-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 ${colorClasses[color]}`}>
            {icon}
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900">{title}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{subtitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {badge && <Badge variant="outline" className="text-[9px] font-bold uppercase py-0">{badge}</Badge>}
          <StatusIcon status={status} />
        </div>
      </div>
    );
  }
}
