
'use client';

import { useState, useMemo } from 'react';
import { useUser, useFirestore, useDoc } from '@/firebase';
import { doc, setDoc, getDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle2, XCircle, ShieldCheck, Database, FileText, ArrowLeft, ShieldAlert, Zap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { UserProfile } from '@/lib/types';

export default function IntegrationTestPage() {
  const { user, loading: userLoading } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  
  const userRef = useMemo(() => (user ? doc(db, "users", user.uid) : null), [user, db]);
  const { data: profile } = useDoc<UserProfile>(userRef);

  const [isRunning, setIsRunning] = useState(false);
  const [isElevating, setIsElevating] = useState(false);
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

  const elevateToAdmin = async () => {
    if (!user) return;
    setIsElevating(true);
    try {
      const userDocRef = doc(db, 'users', user.uid);
      await setDoc(userDocRef, {
        role: 'admin',
        adminType: 'comercial',
        status: 'approved',
        updatedAt: serverTimestamp()
      }, { merge: true });
      
      toast({ 
        title: "Privilégios Atualizados", 
        description: "Você agora é um Administrador. Tente rodar os testes novamente." 
      });
      // Pequeno delay para o Firestore propagar as regras antes de re-testar
      setTimeout(() => runTests(), 1000);
    } catch (e: any) {
      toast({ 
        variant: "destructive", 
        title: "Erro na Elevação", 
        description: "As regras do Firestore podem estar bloqueando a escrita. Verifique o console." 
      });
    } finally {
      setIsElevating(false);
    }
  };

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

    // 1. Test Profile Write
    try {
      const uRef = doc(db, 'users', user.uid);
      await setDoc(uRef, {
        lastIntegrationTestAt: serverTimestamp(),
        testStatus: "online"
      }, { merge: true });
      setResults(prev => ({ ...prev, profileWrite: 'success' }));
    } catch (e) {
      setResults(prev => ({ ...prev, profileWrite: 'error' }));
    }

    // 2. Test Profile Read
    try {
      const uRef = doc(db, 'users', user.uid);
      const snap = await getDoc(uRef);
      if (snap.exists()) {
        setResults(prev => ({ ...prev, profileRead: 'success' }));
      } else {
        setResults(prev => ({ ...prev, profileRead: 'error' }));
      }
    } catch (e) {
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
      if (e.code === 'permission-denied') {
        setResults(prev => ({ ...prev, flowWrite: 'forbidden' }));
      } else {
        setResults(prev => ({ ...prev, flowWrite: 'error' }));
      }
    }

    // 4. Test Submission Write
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
      setResults(prev => ({ ...prev, submissionWrite: 'error' }));
    }

    setIsRunning(false);
  };

  const StatusIcon = ({ status }: { status: string }) => {
    if (status === 'success') return <CheckCircle2 className="size-5 text-emerald-500 animate-in zoom-in" />;
    if (status === 'error') return <XCircle className="size-5 text-destructive animate-in zoom-in" />;
    if (status === 'forbidden') return <ShieldAlert className="size-5 text-amber-500 animate-in zoom-in" />;
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
      <div className="w-full max-w-2xl mb-4 flex justify-between items-center">
        <Button variant="ghost" size="sm" asChild className="gap-2">
          <Link href="/login"><ArrowLeft className="size-4" /> Voltar ao Login</Link>
        </Button>
        <Badge variant={profile?.role === 'admin' ? "default" : "secondary"} className="gap-1 px-3 py-1">
          {profile?.role === 'admin' ? <ShieldCheck className="size-3" /> : <ShieldAlert className="size-3" />}
          Role Atual: <span className="font-bold uppercase ml-1">{profile?.role || 'null'}</span>
        </Badge>
      </div>
      
      <Card className="w-full max-w-2xl shadow-xl border-t-4 border-t-primary bg-white">
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="text-2xl font-headline font-bold">Validação de Segurança</CardTitle>
              <CardDescription>Testando regras reais no Firestore</CardDescription>
            </div>
            <Database className="size-8 text-primary/10" />
          </div>
        </CardHeader>
        <CardContent className="pt-8 space-y-6">
          <div className="grid gap-4">
            <TestRow title="Escrita de Perfil" status={results.profileWrite} icon={<CheckCircle2 />} color="blue" subtitle="Acesso aos próprios dados" />
            <TestRow title="Leitura de Perfil" status={results.profileRead} icon={<Database />} color="emerald" subtitle="Verificação de persistência" />
            <TestRow title="Escrita de Fluxo" status={results.flowWrite} icon={<ShieldCheck />} color="amber" subtitle="Requer role='admin'" badge={results.flowWrite === 'forbidden' ? "Negado pelas regras" : undefined} />
            <TestRow title="Submissão" status={results.submissionWrite} icon={<FileText />} color="purple" subtitle="Acesso livre para autenticados" />
          </div>

          {(results.flowWrite === 'forbidden' || profile?.role !== 'admin') && (
            <div className="p-6 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm font-medium space-y-4">
              <div className="flex items-start gap-3">
                <ShieldAlert className="size-6 text-amber-600 shrink-0 mt-1" />
                <div className="space-y-1">
                  <p className="font-bold text-lg">Você não é Administrador</p>
                  <p className="text-amber-700/80 leading-relaxed">
                    O teste de "Escrita de Fluxo" requer permissões de nível 1. Como você está em ambiente de desenvolvimento, você pode elevar sua conta agora.
                  </p>
                </div>
              </div>
              <Button 
                onClick={elevateToAdmin} 
                disabled={isElevating} 
                variant="default" 
                className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold h-12 gap-2 shadow-md"
              >
                {isElevating ? <Loader2 className="animate-spin" /> : <Zap className="size-5 fill-current" />}
                Tornar meu usuário Admin agora
              </Button>
            </div>
          )}

          <Button className="w-full h-12 font-bold text-base shadow-lg" onClick={runTests} disabled={isRunning || isElevating}>
            {isRunning ? <Loader2 className="animate-spin mr-2" /> : "Iniciar Bateria de Testes"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );

  function TestRow({ title, status, icon, color, subtitle, badge }: any) {
    const colorClasses: any = {
      blue: "bg-blue-50 text-blue-600",
      emerald: "bg-emerald-50 text-emerald-600",
      amber: "bg-amber-50 text-amber-600",
      purple: "bg-purple-50 text-purple-600",
    };
    return (
      <div className="flex items-center justify-between p-4 rounded-xl border bg-slate-50/50 hover:bg-white transition-all group">
        <div className="flex items-center gap-4">
          <div className={`size-10 rounded-xl flex items-center justify-center ${colorClasses[color]}`}>{icon}</div>
          <div>
            <p className="text-sm font-bold text-slate-900">{title}</p>
            <p className="text-[10px] text-muted-foreground uppercase">{subtitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {badge && <Badge variant="outline" className="text-[9px] font-bold uppercase border-amber-200 bg-amber-50 text-amber-700">{badge}</Badge>}
          <StatusIcon status={status} />
        </div>
      </div>
    );
  }
}
