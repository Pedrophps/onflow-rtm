'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth, useFirestore, useUser } from '@/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Mail, Lock, Loader2, Headset, Briefcase, User, Wifi } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

export default function LoginPage() {
  const auth = useAuth();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const { user: currentUser, loading: authLoading } = useUser();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('login');
  
  // Form states
  const [cnpj, setCnpj] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const isAdminEmail = useCallback((emailStr: string | null | undefined) => {
    if (!emailStr) return false;
    const lowerEmail = emailStr.toLowerCase();
    return lowerEmail.endsWith('@rtm.net.br') || lowerEmail.includes('admin');
  }, []);

  const fastRedirect = useCallback((userEmail: string | null) => {
    if (isAdminEmail(userEmail)) {
      router.push('/dashboard/admin');
    } else {
      router.push('/dashboard/client');
    }
  }, [router, isAdminEmail]);

  useEffect(() => {
    if (currentUser && !authLoading) {
      fastRedirect(currentUser.email);
    }
  }, [currentUser, authLoading, fastRedirect]);

  const handleSignUp = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (loading) return;
    setLoading(true);

    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(result.user, { displayName: name || 'Usuário RTM' });

      const role = isAdminEmail(email) ? 'admin' : 'client';
      const userRef = doc(db, 'users', result.user.uid);

      setDoc(userRef, {
        email,
        role,
        status: role === 'admin' ? 'approved' : 'pending',
        displayName: name || 'Usuário RTM',
        cnpj: role === 'client' ? cnpj : '',
        createdAt: new Date().toISOString()
      }, { merge: true }).catch(() => {});

      fastRedirect(email);
    } catch (error: any) {
      setLoading(false);
      toast({
        variant: "destructive",
        title: "Erro no cadastro",
        description: error.message || "Falha ao criar conta."
      });
    }
  };

  const handleEmailLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (loading) return;
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      setLoading(false);
      toast({ 
        variant: "destructive", 
        title: "Falha no acesso", 
        description: "Verifique suas credenciais ou conexão." 
      });
    }
  };

  const fillQuickAccess = (type: 'suporte' | 'comercial' | 'client') => {
    const pass = '123456';
    if (type === 'suporte') {
      setEmail('suporte.rtm@rtm.net.br');
      setPassword(pass);
      setName('Analista de Suporte');
      setCnpj('');
    } else if (type === 'comercial') {
      setEmail('comercial.rtm@rtm.net.br');
      setPassword(pass);
      setName('Gerente Comercial');
      setCnpj('');
    } else {
      setEmail('cliente.teste@instituicao.com.br');
      setPassword(pass);
      setName('Instituição Financeira Beta');
      setCnpj('12.345.678/0001-99');
    }
    
    toast({
      title: "Campos Preenchidos",
      description: `Credenciais de ${type} carregadas nos formulários.`,
    });
  };

  if (authLoading && !currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="animate-spin text-primary size-8" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold font-headline text-primary">OnFlow</h1>
          <p className="text-muted-foreground font-medium uppercase tracking-widest text-xs">Hub Integrador RTM</p>
        </div>

        <Card className="border-2 shadow-xl bg-white overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
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
                    <div className="space-y-2">
                      <Label>CNPJ da Instituição</Label>
                      <Input placeholder="00.000.000/0000-00" value={cnpj} onChange={e => setCnpj(e.target.value)} required />
                    </div>
                  )}
                  <div className="space-y-2"><Label>Senha</Label><Input type="password" placeholder="Mínimo 6 caracteres" required value={password} onChange={e => setPassword(e.target.value)} /></div>
                  <Button type="submit" className="w-full font-bold h-12" disabled={loading}>Criar Conta</Button>
                </CardContent>
              </form>
            </TabsContent>
            <CardFooter className="flex flex-col gap-4 border-t pt-6 bg-muted/20">
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest text-center w-full">Auto-preencher para Teste</p>
              <div className="grid grid-cols-1 gap-2 w-full">
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" size="sm" className="gap-2 bg-white h-10" onClick={() => fillQuickAccess('suporte')} disabled={loading}>
                    <Headset className="size-3.5" /> Suporte
                  </Button>
                  <Button variant="outline" size="sm" className="gap-2 bg-white h-10" onClick={() => fillQuickAccess('comercial')} disabled={loading}>
                    <Briefcase className="size-3.5" /> Comercial
                  </Button>
                </div>
                <Button variant="outline" size="sm" className="gap-2 bg-white h-10" onClick={() => fillQuickAccess('client')} disabled={loading}>
                  <User className="size-3.5" /> Cliente de Teste
                </Button>
                <Link href="/debug" className="flex items-center justify-center gap-2 text-[10px] text-amber-600 hover:text-amber-700 font-bold uppercase tracking-tighter mt-2">
                  <Wifi className="size-3" /> Ver Diagnóstico de Conexão
                </Link>
              </div>
            </CardFooter>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}
