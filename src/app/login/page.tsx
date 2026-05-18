
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
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Mail, Lock, Loader2, Building2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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
  const [institutionName, setInstitutionName] = useState('');
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
        institutionName: role === 'client' ? institutionName : 'RTM',
        cnpj: role === 'client' ? cnpj : '',
        createdAt: new Date().toISOString()
      }, { merge: true }).catch((err) => {
        console.warn("Erro ao salvar perfil no cadastro:", err);
      });

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
                  <div className="space-y-2">
                    <Label>Nome Completo (Colaborador)</Label>
                    <Input placeholder="Seu nome completo" required value={name} onChange={e => setName(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>E-mail Corporativo</Label>
                    <Input type="email" placeholder="seu@rtm.net.br" required value={email} onChange={e => setEmail(e.target.value)} />
                  </div>
                  
                  {!isAdminEmail(email) && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-top-1">
                      <div className="space-y-2">
                        <Label>Nome da Instituição / Razão Social</Label>
                        <div className="relative">
                          <Building2 className="absolute left-3 top-3 size-4 text-muted-foreground" />
                          <Input 
                            placeholder="Ex: Banco Investimento S.A." 
                            className="pl-10"
                            value={institutionName} 
                            onChange={e => setInstitutionName(e.target.value)} 
                            required 
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>CNPJ da Instituição</Label>
                        <Input placeholder="00.000.000/0000-00" value={cnpj} onChange={e => setCnpj(e.target.value)} required />
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>Senha de Acesso</Label>
                    <Input type="password" placeholder="Mínimo 6 caracteres" required value={password} onChange={e => setPassword(e.target.value)} />
                  </div>
                  <Button type="submit" className="w-full font-bold h-12" disabled={loading}>Criar Minha Conta</Button>
                </CardContent>
              </form>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}
