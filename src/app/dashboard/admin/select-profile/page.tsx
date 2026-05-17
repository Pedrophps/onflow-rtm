
'use client';

import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Headset, Briefcase, ArrowRight, LogOut, Loader2 } from 'lucide-react';
import { useAuth, useUser, useFirestore, useDoc } from '@/firebase';
import { signOut } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useState, useMemo, useEffect } from 'react';
import { UserProfile } from '@/lib/types';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export default function SelectProfilePage() {
  const router = useRouter();
  const auth = useAuth();
  const db = useFirestore();
  const { user } = useUser();
  const [isUpdating, setIsUpdating] = useState(false);

  const userRef = useMemo(() => (user ? doc(db, "users", user.uid) : null), [user, db]);
  const { data: profile, loading: profileLoading } = useDoc<UserProfile>(userRef);

  useEffect(() => {
    // Se o perfil já tem adminType no Firestore, redireciona imediatamente
    if (!profileLoading && profile?.adminType && !isUpdating) {
      router.replace(`/dashboard/admin?view=${profile.adminType}`);
    }
  }, [profile?.adminType, profileLoading, router, isUpdating]);

  const handleSelect = async (adminType: 'suporte' | 'comercial') => {
    if (!user) return;
    setIsUpdating(true);

    const userDocRef = doc(db, 'users', user.uid);
    const updateData = { 
      adminType,
      role: 'admin',
      status: 'approved',
      email: user.email,
      displayName: user.displayName || 'Administrador',
      updatedAt: serverTimestamp()
    };
    
    // Tentativa de gravação robusta
    try {
      await setDoc(userDocRef, updateData, { merge: true });
      // Redirecionamento após confirmação do Firestore
      router.push(`/dashboard/admin?view=${adminType}`);
    } catch (error: any) {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: userDocRef.path,
        operation: 'write',
        requestResourceData: updateData
      }));
      setIsUpdating(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/login');
  };

  if (profileLoading || (profile?.adminType && !isUpdating) || isUpdating) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
        <Loader2 className="size-10 animate-spin text-primary" />
        <p className="text-muted-foreground font-medium">Configurando seu ambiente RTM...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="max-w-4xl w-full space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="space-y-4 text-center">
          <h1 className="text-4xl font-bold font-headline text-slate-900">Seja bem-vindo, <span className="text-primary">{user?.displayName?.split(' ')[0] || 'Administrador'}</span>!</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Selecione sua equipe de atuação para configurar sua visão definitiva do Hub OnFlow.
          </p>
          <div className="bg-amber-50 border border-amber-200 text-amber-700 px-4 py-2 rounded-lg inline-block text-sm font-semibold">
            Esta escolha ficará salva no seu perfil institucional.
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <Card 
            className="group hover:border-primary transition-all cursor-pointer border-2 shadow-sm hover:shadow-xl bg-white"
            onClick={() => handleSelect('suporte')}
          >
            <CardHeader className="pt-10 text-center">
              <div className="size-24 rounded-2xl bg-primary/5 flex items-center justify-center text-primary mx-auto group-hover:scale-110 group-hover:bg-primary/10 transition-all mb-6">
                <Headset className="size-12" />
              </div>
              <CardTitle className="text-2xl font-headline">Equipe de Suporte</CardTitle>
              <CardDescription className="text-base px-6 mt-2">
                Valide documentos técnicos e gerencie a infraestrutura de rede.
              </CardDescription>
            </CardHeader>
            <CardContent className="pb-10 text-center">
              <Button className="rounded-full px-8 font-bold gap-2 group-hover:bg-primary/90 transition-all" disabled={isUpdating}>
                Acessar Suporte <ArrowRight className="size-4" />
              </Button>
            </CardContent>
          </Card>

          <Card 
            className="group hover:border-primary transition-all cursor-pointer border-2 shadow-sm hover:shadow-xl bg-white"
            onClick={() => handleSelect('comercial')}
          >
            <CardHeader className="pt-10 text-center">
              <div className="size-24 rounded-2xl bg-secondary/5 flex items-center justify-center text-secondary mx-auto group-hover:scale-110 group-hover:bg-secondary/10 transition-all mb-6">
                <Briefcase className="size-12" />
              </div>
              <CardTitle className="text-2xl font-headline">Equipe Comercial</CardTitle>
              <CardDescription className="text-base px-6 mt-2">
                Aprove instituições e configure produtos contratados.
              </CardDescription>
            </CardHeader>
            <CardContent className="pb-10 text-center">
              <Button variant="secondary" className="rounded-full px-8 font-bold gap-2 transition-all" disabled={isUpdating}>
                Acessar Comercial <ArrowRight className="size-4" />
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="text-center pt-8">
          <Button variant="ghost" className="text-muted-foreground gap-2" onClick={handleLogout}>
            <LogOut className="size-4" /> Sair da conta
          </Button>
        </div>
      </div>
    </div>
  );
}
