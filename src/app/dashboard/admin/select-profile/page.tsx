
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
  const { user } = useUser();
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);

  const userRef = useMemo(() => (user ? doc(db, "users", user.uid) : null), [user, db]);
  const { data: profile, loading: profileLoading } = useDoc<UserProfile>(userRef);

  // Redireciona se o perfil já estiver configurado para evitar loops
  useEffect(() => {
    if (!profileLoading && profile?.adminType && !isUpdating) {
      router.replace(`/dashboard/admin?view=${profile.adminType}`);
    }
  }, [profile, profileLoading, router, isUpdating]);

  const handleSelect = async (adminType: 'suporte' | 'comercial') => {
    if (!user || isUpdating) return;
    setIsUpdating(true);

    const userDocRef = doc(db, 'users', user.uid);
    const updateData = { 
      adminType,
      role: 'admin',
      status: 'approved',
      email: user.email,
      displayName: user.displayName || 'Administrador RTM',
      updatedAt: serverTimestamp()
    };
    
    // Escrevemos no Firestore e aguardamos a conclusão antes do redirecionamento
    setDoc(userDocRef, updateData, { merge: true })
      .then(() => {
        toast({
          title: "Ambiente Ativado",
          description: `Perfil de ${adminType} configurado com sucesso.`,
        });
        // Usamos replace para garantir que o histórico não volte para esta tela
        router.replace(`/dashboard/admin?view=${adminType}`);
      })
      .catch(async (error) => {
        setIsUpdating(false);
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: userDocRef.path,
          operation: 'write',
          requestResourceData: updateData
        }));
      });
  };

  if (profileLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
        <Loader2 className="size-10 animate-spin text-primary" />
        <p className="text-muted-foreground font-medium">Validando credenciais RTM...</p>
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
            className="group hover:border-primary transition-all cursor-pointer border-2 shadow-sm hover:shadow-xl bg-white"
            onClick={() => handleSelect('suporte')}
          >
            <CardHeader className="pt-10 text-center">
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
            className="group hover:border-secondary transition-all cursor-pointer border-2 shadow-sm hover:shadow-xl bg-white"
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
