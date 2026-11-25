
'use client';

import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Headset, Briefcase, ArrowRight, Loader2 } from 'lucide-react';
import { useUser, useFirestore, useDoc } from '@/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useState, useMemo, useEffect } from 'react';
import { UserProfile } from '@/lib/types';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useToast } from '@/hooks/use-toast';

export default function SelectProfilePage() {
  const router = useRouter();
  const db = useFirestore();
  const { user, loading: userLoading } = useUser();
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);

  const userRef = useMemo(() => (user ? doc(db, "users", user.uid) : null), [user, db]);
  const { data: profile, loading: profileLoading } = useDoc<UserProfile>(userRef);

  const normalizeEmail = (val: string) => (val || "").trim().toLowerCase();
  const isMaster = useMemo(() => user && normalizeEmail(user.email || "") === 'admin@admin.com', [user]);

  // Redirecionamento Reativo Blindado contra loops
  useEffect(() => {
    if (userLoading || profileLoading) return;

    if (!user) {
      router.replace('/login');
      return;
    }

    // Se já é Master ou já tem perfil definido, redireciona para o Dashboard incluindo redundância view=...
    if (isMaster || profile?.adminType) {
      const targetView = profile?.adminType || (isMaster ? 'coordenador_suporte' : '');
      router.replace(`/dashboard/admin${targetView ? `?view=${targetView}` : ''}`);
      return;
    }
  }, [profile, profileLoading, userLoading, user, isMaster, router]);

  const handleSelect = async (adminType: 'suporte' | 'comercial') => {
    if (!user || isUpdating) return;
    setIsUpdating(true);

    const userDocRef = doc(db, 'users', user.uid);
    const updateData = { 
      adminType: adminType,
      role: 'admin' as const,
      status: 'approved' as const,
      email: normalizeEmail(user.email || ""),
      updatedAt: serverTimestamp()
    };
    
    try {
      await setDoc(userDocRef, updateData, { merge: true });
      // O useEffect reativo cuidará do redirecionamento com o novo snapshot
    } catch (error: any) {
      setIsUpdating(false);
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: userDocRef.path,
        operation: 'write',
        requestResourceData: updateData
      }));
    }
  };

  // Loader full screen durante transições críticas
  if (userLoading || profileLoading || isMaster || isUpdating || profile?.adminType) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
        <div className="relative">
           <Loader2 className="size-12 animate-spin text-primary" />
           <div className="absolute inset-0 flex items-center justify-center">
             <div className="size-2 bg-primary rounded-full animate-pulse" />
           </div>
        </div>
        <p className="text-muted-foreground font-bold text-xs uppercase tracking-[0.2em] animate-pulse">Sincronizando Identidade RTM...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="max-w-4xl w-full space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="space-y-4 text-center">
          <h1 className="text-4xl font-bold font-headline text-primary tracking-tight">OnFlow RTM</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Selecione seu ambiente de trabalho para continuar o atendimento.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <Card 
            className="group hover:border-primary transition-all cursor-pointer border-2 shadow-sm hover:shadow-xl bg-card overflow-hidden"
            onClick={() => handleSelect('suporte')}
          >
            <CardHeader className="pt-10 text-center relative">
              <div className="size-20 rounded-2xl bg-primary/5 group-hover:bg-primary group-hover:text-white transition-colors flex items-center justify-center text-primary mx-auto mb-6">
                <Headset className="size-10" />
              </div>
              <CardTitle>Suporte Técnico</CardTitle>
              <CardDescription>Infraestrutura, redes críticas e monitoramento.</CardDescription>
            </CardHeader>
            <CardContent className="pb-10 text-center">
              <Button className="rounded-full font-bold gap-2 px-8" disabled={isUpdating}>
                {isUpdating ? <Loader2 className="size-4 animate-spin" /> : "Acessar"} <ArrowRight className="size-4" />
              </Button>
            </CardContent>
          </Card>

          <Card 
            className="group hover:border-secondary transition-all cursor-pointer border-2 shadow-sm hover:shadow-xl bg-card overflow-hidden"
            onClick={() => handleSelect('comercial')}
          >
            <CardHeader className="pt-10 text-center">
              <div className="size-20 rounded-2xl bg-secondary/5 group-hover:bg-secondary group-hover:text-white transition-colors flex items-center justify-center text-secondary mx-auto mb-6">
                <Briefcase className="size-10" />
              </div>
              <CardTitle>Gestão Comercial</CardTitle>
              <CardDescription>Onboarding, contratos e ativação de clientes.</CardDescription>
            </CardHeader>
            <CardContent className="pb-10 text-center">
              <Button variant="secondary" className="rounded-full font-bold gap-2 px-8" disabled={isUpdating}>
                {isUpdating ? <Loader2 className="size-4 animate-spin" /> : "Acessar"} <ArrowRight className="size-4" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
