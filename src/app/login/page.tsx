
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
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
  User,
  ChevronRight,
  Terminal,
  Cpu
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { HeroBackground } from '@/components/hero-background';
import { cn } from '@/lib/utils';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

export default function LoginPage() {
  const auth = useAuth();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const { user: currentUser, loading: authLoading } = useUser();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('login');
  const [showPassword, setShowPassword] = useState(false);
  const [isConsoleOpen, setIsConsoleOpen] = useState(false);
  
  const [cnpj, setCnpj] = useState('');
  const [institutionName, setInstitutionName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const normalizeCnpj = (val: string) => (val || "").replace(/\D/g, "");
  const normalizeEmail = (val: string) => (val || "").trim().toLowerCase();
  const normalizeInstitution = (val: string) => (val || "").trim().toUpperCase();

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
    const email = (userEmail || "").toLowerCase().trim();
    const isMaster = email === 'admin@admin.com';

    // Master ou RTM Admin vai para o Dashboard (que cuidará do resto)
    if (isMaster || email.endsWith('@rtm.net.br')) {
      router.push('/dashboard/admin');
      return;
    }

    // Outros usuários
    const userSnap = await getDoc(doc(db, 'users', userUid));
    const userData = userSnap.data();

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

      const emailNorm = normalizeEmail(email);
      const isMaster = emailNorm === 'admin@admin.com';
      const isRtm = isAdminEmail(email);
      const role = (isRtm || isMaster) ? 'admin' : 'client';
      
      const userRef = doc(db, 'users', result.user.uid);

      const payload: any = {
        email: emailNorm,
        role,
        status: 'approved',
        displayName: name || 'Usuário RTM',
        institutionName: institutionName || 'RTM',
        cnpj: cnpj || '00.00.000/0001-91',
        createdAt: new Date().toISOString(),
        updatedAt: serverTimestamp()
      };

      if (isMaster) {
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
      const emailNorm = normalizeEmail(email);
      const isMaster = emailNorm === 'admin@admin.com';
      
      if (isMaster) {
        await setDoc(doc(db, 'users', result.user.uid), {
          role: 'admin',
          adminType: 'coordenador_suporte',
          status: 'approved',
          email: emailNorm,
          displayName: 'COORDENADOR MASTER',
          updatedAt: serverTimestamp()
        }, { merge: true });
        router.push('/dashboard/admin');
        return;
      }

      const userSnap = await getDoc(doc(db, 'users', result.user.uid));
      const userData = userSnap.data();
      const isRtm = isAdminEmail(emailNorm);

      if (isRtm) {
        await setDoc(doc(db, 'users', result.user.uid), {
          role: 'admin',
          status: 'approved',
          updatedAt: serverTimestamp(),
          email: emailNorm
        }, { merge: true });
        router.push('/dashboard/admin');
      } else if (!userData && !isRtm) {
        await setDoc(doc(db, 'users', result.user.uid), {
          email: emailNorm,
          role: 'client',
          status: 'pending',
          displayName: auth.currentUser?.displayName || 'Cliente RTM',
          institutionName: 'Pendente',
          createdAt: new Date().toISOString(),
          updatedAt: serverTimestamp()
        });
        router.push('/dashboard/client');
      } else {
        fastRedirect(result.user.uid, emailNorm);
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
    <div className="min-h-screen flex flex-col lg:flex-row bg-background overflow-hidden font-body">
      <div className="hidden lg:flex relative w-1/2 bg-slate-900 items-center justify-center p-12 overflow-hidden border-r border-white/5">
        <HeroBackground />
        <div className="relative z-10 space-y-8 max-w-lg">
          <div className="space-y-4">
            <h1 className="text-6xl font-light font-headline text-white tracking-tighter leading-none">
              OnFlow <span className="text-primary font-normal">RTM.</span>
            </h1>
            <p className="text-xl text-slate-300 font-light leading-relaxed italic">
              "Orquestrando a infraestrutura e ativação técnica dos serviços críticos do mercado financeiro."
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-6 pt-12 border-t border-white/10">
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-primary">Inteligência</p>
              <p className="text-sm text-slate-300 font-medium">Processos guiados por IA e fluxos determinísticos.</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-primary">Certeza</p>
              <p className="text-sm text-slate-300 font-medium">Segurança absoluta e conformidade regulatória.</p>
            </div>
          </div>
        </div>
        
        <div className="absolute bottom-12 left-12">
          <Link href="/" className="flex items-center gap-2 text-slate-400 hover:text-primary transition-colors text-xs font-bold uppercase tracking-widest">
            <ArrowLeft className="size-4" /> Voltar ao Portal Público
          </Link>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8 bg-white dark:bg-slate-900 relative">
        <div className="lg:hidden absolute top-8 left-8">
           <Link href="/" className="text-primary"><ArrowLeft className="size-6" /></Link>
        </div>

        <div className="w-full max-w-md space-y-10 animate-in fade-in slide-in-from-right-4 duration-700">
          <div className="text-center lg:text-left space-y-3">
             <div className="lg:hidden">
               <h1 className="text-4xl font-light font-headline text-primary tracking-tighter">OnFlow</h1>
               <p className="text-muted-foreground font-bold uppercase tracking-[0.3em] text-[10px] opacity-60">HUB INTEGRADOR RTM</p>
             </div>
             <h2 className="text-2xl font-bold text-foreground">Acesse sua conta</h2>
             <p className="text-sm text-muted-foreground font-medium">Selecione o modo de acesso para continuar.</p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
            <TabsList className="grid w-full grid-cols-2 bg-muted p-1 h-12 rounded-xl">
              <TabsTrigger value="login" className="rounded-lg text-xs font-black uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:shadow-sm">Acesso</TabsTrigger>
              <TabsTrigger value="signup" className="rounded-lg text-xs font-black uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:shadow-sm">Novo Cliente</TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="space-y-6 animate-in fade-in duration-300">
              <form onSubmit={handleEmailLogin} className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">E-mail Corporativo</Label>
                    <div className="relative group">
                      <Mail className="absolute left-3 top-3.5 size-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                      <Input 
                        type="email" 
                        placeholder="nome@rtm.net.br" 
                        className="pl-10 h-12 bg-muted/30 border-border focus:border-primary/50 focus:ring-4 focus:ring-primary/5 rounded-xl font-medium transition-all" 
                        required 
                        value={email} 
                        onChange={e => setEmail(e.target.value)} 
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Chave de Segurança</Label>
                    <div className="relative group">
                      <Lock className="absolute left-3 top-3.5 size-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                      <Input 
                        type={showPassword ? "text" : "password"} 
                        placeholder="••••••••" 
                        className="pl-10 pr-10 h-12 bg-muted/30 border-border focus:border-primary/50 focus:ring-4 focus:ring-primary/5 rounded-xl font-medium transition-all" 
                        required 
                        value={password} 
                        onChange={e => setPassword(e.target.value)} 
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3.5 text-muted-foreground hover:text-primary transition-colors"
                      >
                        {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      </button>
                    </div>
                  </div>
                </div>
                <Button type="submit" className="w-full h-14 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all" disabled={loading}>
                  {loading ? <Loader2 className="animate-spin mr-2 size-4" /> : <>Entrar no Ecossistema <ChevronRight className="size-4 ml-2" /></>}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup" className="space-y-5 animate-in fade-in duration-300">
              <form onSubmit={handleSignUp} className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5 col-span-2">
                    <Label className="text-[10px] font-black uppercase">Responsável Técnico</Label>
                    <Input placeholder="Nome Completo" className="h-11 bg-muted/30 rounded-xl" required value={name} onChange={e => setName(e.target.value)} />
                  </div>
                  <div className="space-y-1.5 col-span-2">
                    <Label className="text-[10px] font-black uppercase">E-mail Institucional</Label>
                    <Input type="email" placeholder="usuario@empresa.com.br" className="h-11 bg-muted/30 rounded-xl" required value={email} onChange={e => setEmail(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black uppercase">Razão Social</Label>
                    <Input placeholder="Banco X S.A." className="h-11 bg-muted/30 rounded-xl" value={institutionName} onChange={e => setInstitutionName(e.target.value)} required />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black uppercase text-primary">CNPJ</Label>
                    <Input placeholder="00.00.000/0000-00" className="h-11 bg-muted/30 rounded-xl font-mono text-xs tracking-tight" value={cnpj} onChange={handleCnpjChange} required />
                  </div>
                  <div className="space-y-1.5 col-span-2">
                    <Label className="text-[10px] font-black uppercase">Definir Senha</Label>
                    <Input type="password" placeholder="Mínimo 6 caracteres" className="h-11 bg-muted/30 rounded-xl" required value={password} onChange={e => setPassword(e.target.value)} />
                  </div>
                </div>
                <Button type="submit" className="w-full h-14 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg" disabled={loading}>Solicitar Credenciamento</Button>
              </form>
            </TabsContent>
          </Tabs>

          <Collapsible open={isConsoleOpen} onOpenChange={setIsConsoleOpen} className="pt-6 border-t border-border">
            <div className="flex items-center justify-between">
               <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-50">Ambientes de Homologação</p>
               <CollapsibleTrigger asChild>
                 <Button variant="ghost" size="sm" className="h-8 rounded-lg gap-2 text-[10px] font-black uppercase">
                   <Terminal className="size-3" /> {isConsoleOpen ? 'Fechar Console' : 'Abrir Console'}
                 </Button>
               </CollapsibleTrigger>
            </div>
            
            <CollapsibleContent className="space-y-4 pt-4 animate-in slide-in-from-top-2 duration-300">
               <div className="grid grid-cols-2 gap-3">
                 <QuickAccessButton 
                    label="Coordenação" 
                    desc="Master Admin"
                    icon={ShieldCheck} 
                    onClick={() => fillFields('admin@admin.com', '123456', 'COORDENADOR MASTER', 'RTM', '00.00.000/0001-91')}
                  />
                  <QuickAccessButton 
                    label="Suporte" 
                    desc="Analista N2"
                    icon={Headset} 
                    onClick={() => fillFields('suporte@rtm.net.br', '123456', 'Analista Suporte', 'RTM', '00.00.000/0001-91')}
                  />
                  <QuickAccessButton 
                    label="Comercial" 
                    desc="Gestão OnFlow"
                    icon={Briefcase} 
                    onClick={() => fillFields('comercial@rtm.net.br', '123456', 'Gestor Comercial', 'RTM', '00.00.000/0001-91')}
                  />
                  <QuickAccessButton 
                    label="Cliente" 
                    desc="Instituição Financeira"
                    icon={User} 
                    onClick={() => fillFields('cliente@cliente.com.br', '123456', 'Pedro Oliveira', 'BANCO DELTA S.A.', '11.222.333/0001-44')}
                  />
               </div>
               <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-xl border border-dashed text-[9px] text-muted-foreground">
                  <Cpu className="size-3 text-primary" />
                  <span>SISTEMA EM MODO TESTE: Credenciais pré-carregadas para auditoria visual.</span>
               </div>
            </CollapsibleContent>
          </Collapsible>
        </div>
      </div>
    </div>
  );
}

function QuickAccessButton({ label, desc, icon: Icon, onClick }: any) {
  return (
    <Button 
      variant="outline" 
      size="sm" 
      className="text-left justify-start h-auto py-3 px-4 flex items-center gap-3 border-border bg-background hover:bg-primary/5 hover:border-primary/30 transition-all rounded-xl group"
      onClick={onClick}
    >
      <div className="size-8 rounded-lg bg-muted flex items-center justify-center group-hover:bg-primary/10 transition-colors">
        <Icon className="size-4 text-muted-foreground group-hover:text-primary opacity-60 group-hover:opacity-100" />
      </div>
      <div className="flex flex-col overflow-hidden">
        <span className="text-[10px] font-black uppercase tracking-tight text-foreground">{label}</span>
        <span className="text-[8px] text-muted-foreground truncate">{desc}</span>
      </div>
    </Button>
  );
}
