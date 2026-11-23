'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth, useFirestore, useUser } from '@/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Mail, 
  Lock, 
  Loader2, 
  Building2, 
  UserCircle, 
  ShieldCheck, 
  Headset, 
  Eye, 
  EyeOff, 
  ArrowLeft,
  Briefcase,
  User
} from 'lucide-react';
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
  const [showPassword, setShowPassword] = useState(false);
  
  const [cnpj, setCnpj] = useState('');
  const [institutionName, setInstitutionName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const normalizeCnpj = (val: string) => (val || "").replace(/\D/g, "");
  const normalizeEmail = (val: string) => (val || "").trim().toLowerCase();
  const normalizeInstitution = (val: string) => (val || "").trim().toUpperCase();

  const checkCoordinatorCriteria = (emailVal: string, instVal: string, cnpjVal: string) => {
    return (
      normalizeEmail(emailVal) === 'admin@admin.com' &&
      normalizeInstitution(instVal) === 'RTM' &&
      normalizeCnpj(cnpjVal) === '00000000000191'
    );
  };

  const formatCnpj = (value: string) => {
    let v = value.replace(/\D/g, "");
    if (v.length > 14) v = v.slice(0, 14);
    v = v.replace(/^(\d{2})(\d)/, "$1.$2");
    v = v.replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3");
    v = v.replace(/\.(\d{3})(\d)/, ".$1/$2");
    v = v.replace(/(\d{4})(\d)/, "$1-$2");
    return v;
  };

  const handleCnpjChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCnpj(formatCnpj(e.target.value));
  };

  const isAdminEmail = useCallback((emailStr: string | null | undefined) => {
    if (!emailStr) return false;
    const lowerEmail = emailStr.toLowerCase();
    return lowerEmail.endsWith('@rtm.net.br') || lowerEmail.includes('admin');
  }, []);

  const fastRedirect = useCallback(async (userUid: string, userEmail: string | null) => {
    const userSnap = await getDoc(doc(db, 'users', userUid));
    const userData = userSnap.data();
    
    if (userData?.adminType === 'coordenador_suporte') {
      router.push('/dashboard/admin?view=suporte');
      return;
    }

    if (userData?.role === 'admin') {
      router.push('/dashboard/admin');
    } else {
      router.push('/dashboard/client');
    }
  }, [router, db]);

  useEffect(() => {
    if (currentUser && !authLoading) {
      fastRedirect(currentUser.uid, currentUser.email);
    }
  }, [currentUser, authLoading, fastRedirect]);

  const handleSignUp = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (loading) return;
    setLoading(true);

    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(result.user, { displayName: name || 'Usuário RTM' });

      const isCoordinator = checkCoordinatorCriteria(email, institutionName, cnpj);
      const role = (isAdminEmail(email) || isCoordinator) ? 'admin' : 'client';
      const adminType = isCoordinator ? 'coordenador_suporte' : (isAdminEmail(email) ? 'suporte' : undefined);
      
      const userRef = doc(db, 'users', result.user.uid);

      await setDoc(userRef, {
        email,
        role,
        adminType,
        status: role === 'admin' ? 'approved' : 'pending',
        displayName: name || 'Usuário RTM',
        institutionName: institutionName,
        cnpj: cnpj,
        createdAt: new Date().toISOString()
      }, { merge: true });

      fastRedirect(result.user.uid, email);
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
      const result = await signInWithEmailAndPassword(auth, email, password);
      
      const userSnap = await getDoc(doc(db, 'users', result.user.uid));
      const userData = userSnap.data();
      
      if (userData) {
        const isCoordinator = checkCoordinatorCriteria(
          email, 
          userData.institutionName || '', 
          userData.cnpj || ''
        );

        if (isCoordinator && userData.adminType !== 'coordenador_suporte') {
          await setDoc(doc(db, 'users', result.user.uid), {
            adminType: 'coordenador_suporte',
            role: 'admin',
            status: 'approved'
          }, { merge: true });
        }
      }
    } catch (error: any) {
      setLoading(false);
      toast({ 
        variant: "destructive", 
        title: "Falha no acesso", 
        description: "Verifique suas credenciais ou conexão." 
      });
    }
  };

  const fillFields = (e: string, p: string, n: string = '', i: string = '', c: string = '') => {
    setEmail(e);
    setPassword(p);
    setName(n);
    setInstitutionName(i);
    setCnpj(c);
  };

  if (authLoading && !currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="animate-spin text-primary size-8" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6 relative">
      <div className="absolute top-8 left-8">
        <Button variant="ghost" asChild className="gap-2 font-bold text-muted-foreground hover:text-primary transition-colors">
          <Link href="/">
            <ArrowLeft className="size-4" />
            Voltar
          </Link>
        </Button>
      </div>

      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold font-headline text-primary">OnFlow</h1>
          <p className="text-muted-foreground font-medium uppercase tracking-widest text-xs">Hub Integrador RTM</p>
        </div>

        <Card className="border-2 shadow-xl bg-card text-card-foreground overflow-hidden">
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
                      <Input 
                        type={showPassword ? "text" : "password"} 
                        placeholder="••••••••" 
                        className="pl-10 pr-10" 
                        required 
                        value={password} 
                        onChange={e => setPassword(e.target.value)} 
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3 text-muted-foreground hover:text-primary transition-colors"
                      >
                        {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      </button>
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
                  
                  <div className="space-y-4">
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
                      <Input 
                        placeholder="00.000.000/0000-00" 
                        value={cnpj} 
                        onChange={handleCnpjChange} 
                        required 
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Senha de Acesso</Label>
                    <div className="relative">
                      <Input 
                        type={showPassword ? "text" : "password"} 
                        placeholder="Mínimo 6 caracteres" 
                        className="pr-10"
                        required 
                        value={password} 
                        onChange={e => setPassword(e.target.value)} 
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3 text-muted-foreground hover:text-primary transition-colors"
                      >
                        {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      </button>
                    </div>
                  </div>
                  <Button type="submit" className="w-full font-bold h-12" disabled={loading}>Criar Minha Conta</Button>
                </CardContent>
              </form>
            </TabsContent>
          </Tabs>

          <div className="p-4 bg-muted/20 border-t space-y-3">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest text-center">Contas Master e Teste</p>
            <div className="grid grid-cols-2 gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="text-[10px] h-auto py-2 flex-col gap-1 border-primary/20 bg-primary/5 hover:bg-background hover:border-primary transition-all dark:hover:bg-slate-800"
                onClick={() => fillFields('admin@admin.com', '123456', 'Coordenador Master', 'RTM', '00.000.000/0001-91')}
              >
                <ShieldCheck className="size-3 text-primary" />
                Coordenação (Master)
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="text-[10px] h-auto py-2 flex-col gap-1 hover:bg-background hover:border-primary transition-all dark:hover:bg-slate-800"
                onClick={() => fillFields('suporte@rtm.net.br', '123456', 'Analista Suporte', 'RTM', '00.000.000/0001-91')}
              >
                <Headset className="size-3" />
                Suporte Operacional
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="text-[10px] h-auto py-2 flex-col gap-1 hover:bg-background hover:border-secondary transition-all dark:hover:bg-slate-800"
                onClick={() => fillFields('comercial@rtm.net.br', '123456', 'Gestor Comercial', 'RTM', '00.000.000/0001-91')}
              >
                <Briefcase className="size-3 text-secondary" />
                Gestão Comercial
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="text-[10px] h-auto py-2 flex-col gap-1 hover:bg-background hover:border-slate-400 transition-all dark:hover:bg-slate-800"
                onClick={() => fillFields('cliente@cliente.com.br', '123456', 'Pedro Oliveira', 'BANCO DELTA S.A.', '11.222.333/0001-44')}
              >
                <User className="size-3 text-slate-500" />
                Cliente Teste
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
