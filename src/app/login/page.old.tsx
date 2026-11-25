
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth, useFirestore, useUser } from '@/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
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

  const isAdminEmail = useCallback((emailStr: string | null | undefined) => {
    if (!emailStr) return false;
    const lowerEmail = emailStr.toLowerCase().trim();
    return lowerEmail.endsWith('@rtm.net.br') || lowerEmail === 'admin@admin.com';
  }, []);

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

  const fastRedirect = useCallback(async (userUid: string, userEmail: string | null) => {
    const userSnap = await getDoc(doc(db, 'users', userUid));
    const userData = userSnap.data();
    
    const isRtm = isAdminEmail(userEmail);
    const isCoordinator = userData?.adminType === 'coordenador_suporte';

    if (isCoordinator) {
      router.push('/dashboard/admin?view=suporte');
      return;
    }

    if (isRtm || userData?.role === 'admin') {
      if (!userData?.adminType) {
        router.push('/dashboard/admin/select-profile');
      } else {
        router.push('/dashboard/admin');
      }
    } else {
      router.push('/dashboard/client');
    }
  }, [router, db, isAdminEmail]);

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
      const isRtm = isAdminEmail(email);
      const role = (isRtm || isCoordinator) ? 'admin' : 'client';
      
      const userRef = doc(db, 'users', result.user.uid);

      const payload: any = {
        email,
        role,
        status: 'approved',
        displayName: name || 'Usuário RTM',
        institutionName: institutionName || 'RTM',
        cnpj: cnpj || '00.00.000/0001-91',
        createdAt: new Date().toISOString(),
        updatedAt: serverTimestamp()
      };

      if (isCoordinator) {
        payload.adminType = 'coordenador_suporte';
      }

      await setDoc(userRef, payload, { merge: true });
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
      const isRtm = isAdminEmail(email);

      if (isRtm) {
        const isCoordinator = checkCoordinatorCriteria(email, userData?.institutionName || '', userData?.cnpj || '');
        const updatePayload: any = {
          role: 'admin',
          status: 'approved',
          updatedAt: serverTimestamp(),
          displayName: userData?.displayName || auth.currentUser?.displayName || 'Analista RTM',
          email: email
        };

        if (isCoordinator) {
          updatePayload.adminType = 'coordenador_suporte';
        } else if (userData?.adminType) {
          updatePayload.adminType = userData.adminType;
        }

        await setDoc(doc(db, 'users', result.user.uid), updatePayload, { merge: true });
      } else if (!userData && !isRtm) {
        await setDoc(doc(db, 'users', result.user.uid), {
          email: email,
          role: 'client',
          status: 'pending',
          displayName: auth.currentUser?.displayName || 'Cliente RTM',
          institutionName: 'Pendente',
          createdAt: new Date().toISOString(),
          updatedAt: serverTimestamp()
        });
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
        <Loader2 className="animate-spin text-primary size-6" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6 relative">
      <div className="absolute top-8 left-8">
        <Button variant="ghost" asChild className="gap-2 font-bold text-xs uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors">
          <Link href="/">
            <ArrowLeft className="size-4" />
            Voltar
          </Link>
        </Button>
      </div>

      <div className="w-full max-w-md space-y-8 relative z-10">
        <div className="text-center space-y-3">
          <h1 className="text-5xl font-light font-headline text-primary tracking-tighter">OnFlow</h1>
          <p className="text-muted-foreground font-bold uppercase tracking-[0.3em] text-[10px] opacity-60">Identificar • Entender • Conhecer</p>
        </div>

        <Card className="border border-border shadow-sm bg-card text-card-foreground overflow-hidden rounded-lg">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <CardHeader className="pb-0 pt-6 px-6">
              <TabsList className="grid w-full grid-cols-2 bg-muted p-1 rounded-md">
                <TabsTrigger value="login" className="rounded-sm text-xs font-bold uppercase tracking-widest py-2">Entrar</TabsTrigger>
                <TabsTrigger value="signup" className="rounded-sm text-xs font-bold uppercase tracking-widest py-2">Cadastrar</TabsTrigger>
              </TabsList>
            </CardHeader>
            <TabsContent value="login">
              <form onSubmit={handleEmailLogin}>
                <CardContent className="space-y-6 pt-8 pb-8 px-8">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">E-mail Corporativo</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 size-4 text-muted-foreground opacity-50" />
                      <Input type="email" placeholder="seu@rtm.net.br" className="pl-10 h-12 bg-background border-border focus:border-primary/50 focus:ring-0" required value={email} onChange={e => setEmail(e.target.value)} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Senha de Acesso</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 size-4 text-muted-foreground opacity-50" />
                      <Input 
                        type={showPassword ? "text" : "password"} 
                        placeholder="••••••••" 
                        className="pl-10 pr-10 h-12 bg-background border-border focus:border-primary/50 focus:ring-0" 
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
                  <Button type="submit" className="w-full font-bold h-14 text-xs uppercase tracking-widest" disabled={loading}>
                    {loading ? <Loader2 className="animate-spin mr-2 size-4" /> : "Acessar Portal OnFlow"}
                  </Button>
                </CardContent>
              </form>
            </TabsContent>
            <TabsContent value="signup">
              <form onSubmit={handleSignUp}>
                <CardContent className="space-y-4 pt-6 pb-8 px-8">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Nome do Colaborador</Label>
                    <Input placeholder="Nome Completo" className="h-11 bg-background" required value={name} onChange={e => setName(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">E-mail Corporativo</Label>
                    <Input type="email" placeholder="seu@rtm.net.br" className="h-11 bg-background" required value={email} onChange={e => setEmail(e.target.value)} />
                  </div>
                  
                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Razão Social / Instituição</Label>
                      <div className="relative">
                        <Building2 className="absolute left-3 top-3 size-4 text-muted-foreground opacity-50" />
                        <Input 
                          placeholder="Ex: Banco Delta S.A." 
                          className="pl-10 h-11 bg-background"
                          value={institutionName} 
                          onChange={e => setInstitutionName(e.target.value)} 
                          required 
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">CNPJ</Label>
                      <Input 
                        placeholder="00.00.000/0000-00" 
                        className="h-11 bg-background font-mono text-xs"
                        value={cnpj} 
                        onChange={handleCnpjChange} 
                        required 
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Definir Senha</Label>
                    <div className="relative">
                      <Input 
                        type={showPassword ? "text" : "password"} 
                        placeholder="Mínimo 6 caracteres" 
                        className="h-11 bg-background"
                        required 
                        value={password} 
                        onChange={e => setPassword(e.target.value)} 
                      />
                    </div>
                  </div>
                  <Button type="submit" className="w-full font-bold h-14 mt-4 text-xs uppercase tracking-widest" disabled={loading}>Criar Minha Conta</Button>
                </CardContent>
              </form>
            </TabsContent>
          </Tabs>

          <div className="p-6 bg-muted border-t border-border space-y-4">
            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-[0.2em] text-center opacity-70">Contas Master e Teste</p>
            <div className="grid grid-cols-2 gap-3">
              <QuickAccessButton 
                label="Coordenação" 
                icon={ShieldCheck} 
                onClick={() => fillFields('admin@admin.com', '123456', 'Coordenador Master', 'RTM', '00.00.000/0001-91')}
              />
              <QuickAccessButton 
                label="Suporte" 
                icon={Headset} 
                onClick={() => fillFields('suporte@rtm.net.br', '123456', 'Analista Suporte', 'RTM', '00.00.000/0001-91')}
              />
              <QuickAccessButton 
                label="Comercial" 
                icon={Briefcase} 
                onClick={() => fillFields('comercial@rtm.net.br', '123456', 'Gestor Comercial', 'RTM', '00.00.000/0001-91')}
              />
              <QuickAccessButton 
                label="Cliente" 
                icon={User} 
                onClick={() => fillFields('cliente@cliente.com.br', '123456', 'Pedro Oliveira', 'BANCO DELTA S.A.', '11.222.333/0001-44')}
              />
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

function QuickAccessButton({ label, icon: Icon, onClick }: any) {
  return (
    <Button 
      variant="outline" 
      size="sm" 
      className="text-[9px] font-bold uppercase tracking-widest h-auto py-3 flex-col gap-2 border-border bg-background hover:bg-muted transition-colors"
      onClick={onClick}
    >
      <Icon className="size-3.5 text-muted-foreground opacity-60" />
      {label}
    </Button>
  );
}
