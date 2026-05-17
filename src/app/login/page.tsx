
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth, useFirestore, useUser } from '@/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  updateProfile,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Mail, Lock, Loader2, Headset, Briefcase, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { UserProfile } from '@/lib/types';

export default function LoginPage() {
  const auth = useAuth();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const { user: currentUser, loading: authLoading } = useUser();
  const [loading, setLoading] = useState(false);
  const [cnpj, setCnpj] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const isAdminEmail = useCallback((emailStr: string | null | undefined) => {
    if (!emailStr) return false;
    return emailStr.toLowerCase().endsWith('@rtm.net.br');
  }, []);

  const redirectBasedOnRole = useCallback((role: string, adminType?: string) => {
    if (role === 'admin') {
      if (adminType) {
        router.push(`/dashboard/admin?view=${adminType}`);
      } else {
        router.push('/dashboard/admin/select-profile');
      }
    } else {
      router.push('/dashboard/client');
    }
  }, [router]);

  // Redirecionamento automático se já estiver logado
  useEffect(() => {
    if (currentUser && !authLoading) {
      const role = isAdminEmail(currentUser.email) ? 'admin' : 'client';
      redirectBasedOnRole(role);
    }
  }, [currentUser, authLoading, isAdminEmail, redirectBasedOnRole]);

  const formatCNPJ = (value: string) => {
    return value
      .replace(/\D/g, '') 
      .replace(/^(\d{2})(\d)/, '$1.$2') 
      .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3') 
      .replace(/\.(\d{3})(\d)/, '.$1/$2') 
      .replace(/(\d{4})(\d)/, '$1-$2') 
      .substring(0, 18); 
  };

  const handleCnpjChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCNPJ(e.target.value);
    setCnpj(formatted);
  };

  const getFriendlyErrorMessage = (errorCode: string) => {
    switch (errorCode) {
      case 'auth/email-already-in-use': return 'Este e-mail já está em uso.';
      case 'auth/invalid-credential': return 'E-mail ou senha incorretos.';
      case 'auth/network-request-failed': return 'Falha na conexão. Verifique sua internet.';
      default: return 'Erro ao tentar acessar. Tente novamente.';
    }
  };

  async function handleSignUp(e?: React.FormEvent) {
    e?.preventDefault();
    if (loading) return;
    setLoading(true);

    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(result.user, { displayName: name });

      const role = isAdminEmail(email) ? 'admin' : 'client';
      const status = role === 'admin' ? 'approved' : 'pending';
      const userRef = doc(db, 'users', result.user.uid);

      const userData = {
        email,
        role,
        status,
        displayName: name,
        cnpj: role === 'client' ? cnpj : '',
        createdAt: new Date().toISOString()
      };

      // Gravação em background sem await para não travar a navegação
      setDoc(userRef, userData, { merge: true }).catch(err => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: userRef.path,
          operation: 'create',
          requestResourceData: userData
        }));
      });

      redirectBasedOnRole(role);
    } catch (error: any) {
      setLoading(false);
      toast({
        variant: "destructive",
        title: "Erro no cadastro",
        description: getFriendlyErrorMessage(error.code)
      });
    }
  }

  async function handleEmailLogin(e?: React.FormEvent, customEmail?: string, customPassword?: string) {
    e?.preventDefault();
    if (loading) return;
    setLoading(true);

    const targetEmail = customEmail || email;
    const targetPassword = customPassword || password;

    try {
      const result = await signInWithEmailAndPassword(auth, targetEmail, targetPassword);
      
      // Redirecionamento instantâneo baseado no e-mail (Fallback rápido)
      const role = isAdminEmail(result.user.email) ? 'admin' : 'client';
      
      // Tenta buscar o perfil para ver se tem adminType, mas não trava o loading se demorar
      const userDocRef = doc(db, 'users', result.user.uid);
      getDoc(userDocRef).then((userDoc) => {
        if (userDoc.exists()) {
          const profile = userDoc.data() as UserProfile;
          redirectBasedOnRole(profile.role, profile.adminType);
        } else {
          redirectBasedOnRole(role);
        }
      }).catch(() => {
        redirectBasedOnRole(role);
      });

    } catch (error: any) {
      setLoading(false);
      toast({ variant: "destructive", title: "Falha no acesso", description: getFriendlyErrorMessage(error.code) });
    }
  }

  const quickAccess = (type: 'suporte' | 'comercial' | 'client') => {
    let qEmail = '';
    let qPass = '123456';
    
    if (type === 'suporte') qEmail = 'suporte.rtm@rtm.net.br';
    else if (type === 'comercial') qEmail = 'comercial.rtm@rtm.net.br';
    else qEmail = 'cliente.teste@instituicao.com.br';

    handleEmailLogin(undefined, qEmail, qPass);
  };

  if (authLoading && !currentUser) return <div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="animate-spin text-primary size-8" /></div>;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold font-headline text-primary">OnFlow</h1>
          <p className="text-muted-foreground">Hub Integrador RTM</p>
        </div>

        <Card className="border-2 shadow-xl">
          <Tabs defaultValue="login">
            <CardHeader className="pb-0">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Entrar</TabsTrigger>
                <TabsTrigger value="signup">Cadastrar</TabsTrigger>
              </TabsList>
            </CardHeader>
            <TabsContent value="login">
              <form onSubmit={handleEmailLogin}>
                <CardContent className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label>E-mail Corporativo</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 size-4 text-muted-foreground" />
                      <Input type="email" placeholder="seu@rtm.net.br" className="pl-10" required value={email} onChange={e => setEmail(e.target.value)} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Senha</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 size-4 text-muted-foreground" />
                      <Input type="password" placeholder="••••••••" className="pl-10" required value={password} onChange={e => setPassword(e.target.value)} />
                    </div>
                  </div>
                  <Button type="submit" className="w-full font-bold h-12" disabled={loading}>
                    {loading ? <Loader2 className="animate-spin mr-2 size-4" /> : "Acessar Portal"}
                  </Button>
                </CardContent>
              </form>
            </TabsContent>
            <TabsContent value="signup">
              <form onSubmit={handleSignUp}>
                <CardContent className="space-y-4 pt-4">
                  <div className="space-y-2"><Label>Nome Completo</Label><Input placeholder="Seu nome" required value={name} onChange={e => setName(e.target.value)} /></div>
                  <div className="space-y-2">
                    <Label>E-mail Corporativo</Label>
                    <Input type="email" placeholder="seu@rtm.net.br" required value={email} onChange={e => setEmail(e.target.value)} />
                  </div>
                  {!isAdminEmail(email) && email.length > 5 && (
                    <div className="space-y-2 animate-in fade-in slide-in-from-top-1">
                      <Label>CNPJ da Instituição</Label>
                      <Input placeholder="00.000.000/0000-00" value={cnpj} onChange={handleCnpjChange} required />
                    </div>
                  )}
                  <div className="space-y-2"><Label>Senha</Label><Input type="password" placeholder="Mínimo 6 caracteres" required value={password} onChange={e => setPassword(e.target.value)} /></div>
                  <Button type="submit" className="w-full font-bold h-12" disabled={loading}>Criar Conta</Button>
                </CardContent>
              </form>
            </TabsContent>
            <CardFooter className="flex flex-col gap-4 border-t pt-6">
              <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider text-center w-full">Acesso Rápido para Teste</p>
              <div className="grid grid-cols-1 gap-2 w-full">
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" size="sm" className="gap-2" onClick={() => quickAccess('suporte')} disabled={loading}>
                    <Headset className="size-3.5" /> Suporte RTM
                  </Button>
                  <Button variant="outline" size="sm" className="gap-2" onClick={() => quickAccess('comercial')} disabled={loading}>
                    <Briefcase className="size-3.5" /> Comercial RTM
                  </Button>
                </div>
                <Button variant="outline" size="sm" className="gap-2" onClick={() => quickAccess('client')} disabled={loading}>
                  <User className="size-3.5" /> Cliente Teste
                </Button>
              </div>
            </CardFooter>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}
