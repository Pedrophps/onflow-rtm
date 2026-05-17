
'use client';

import { useState } from 'react';
import { useAuth, useFirestore } from '@/firebase';
import { 
  signInWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Chrome, Mail, Lock, ArrowRight, Loader2, User, Building2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function LoginPage() {
  const auth = useAuth();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [cnpj, setCnpj] = useState('');

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
      case 'auth/email-already-in-use':
        return 'Este e-mail já está sendo utilizado por outra conta.';
      case 'auth/invalid-credential':
        return 'E-mail ou senha incorretos. Por favor, verifique suas credenciais.';
      case 'auth/weak-password':
        return 'A senha deve ter pelo menos 6 caracteres.';
      case 'auth/user-not-found':
        return 'Usuário não encontrado. Verifique o e-mail digitado.';
      case 'auth/wrong-password':
        return 'Senha incorreta.';
      case 'auth/popup-closed-by-user':
        return 'A janela de login foi fechada antes de completar a autenticação.';
      default:
        return 'Ocorreu um erro inesperado. Tente novamente em instantes.';
    }
  };

  async function handleSocialLogin() {
    setLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      await checkUserAndRedirect(result.user.uid, result.user.email!);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao entrar",
        description: getFriendlyErrorMessage(error.code)
      });
      setLoading(false);
    }
  }

  async function handleEmailLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      await checkUserAndRedirect(result.user.uid, email);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Falha no acesso",
        description: getFriendlyErrorMessage(error.code)
      });
      setLoading(false);
    }
  }

  async function handleSignUp(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const name = formData.get('name') as string;
    const role = formData.get('role') as 'admin' | 'client';
    const cnpjValue = formData.get('cnpj') as string;

    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      
      await updateProfile(result.user, {
        displayName: name
      });

      await setDoc(doc(db, 'users', result.user.uid), {
        email,
        role,
        displayName: name,
        cnpj: cnpjValue,
        createdAt: new Date().toISOString()
      });

      if (role === 'admin') {
        router.push('/dashboard/admin/select-profile');
      } else {
        router.push('/dashboard/client');
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro no cadastro",
        description: getFriendlyErrorMessage(error.code)
      });
      setLoading(false);
    }
  }

  async function checkUserAndRedirect(uid: string, email: string) {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (userDoc.exists()) {
      const role = userDoc.data().role;
      if (role === 'admin') {
        router.push('/dashboard/admin/select-profile');
      } else {
        router.push(`/dashboard/${role}`);
      }
    } else {
      await setDoc(doc(db, 'users', uid), { 
        email, 
        role: 'client',
        displayName: auth.currentUser?.displayName || email.split('@')[0],
        createdAt: new Date().toISOString()
      });
      router.push('/dashboard/client');
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="w-full max-w-md space-y-8 animate-in fade-in zoom-in duration-500">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold font-headline text-primary">OnFlow</h1>
          <p className="text-muted-foreground">O Hub Integrador do Mercado Financeiro</p>
        </div>

        <Card className="border-2 shadow-xl">
          <Tabs defaultValue="login" className="w-full">
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
                    <Label htmlFor="email">E-mail Corporativo</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 size-4 text-muted-foreground" />
                      <Input id="email" name="email" type="email" placeholder="seu@email.com" className="pl-10" required />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Senha</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 size-4 text-muted-foreground" />
                      <Input id="password" name="password" type="password" placeholder="••••••••" className="pl-10" required />
                    </div>
                  </div>
                  <Button type="submit" className="w-full font-bold h-12" disabled={loading}>
                    {loading ? <Loader2 className="animate-spin" /> : "Acessar Portal"}
                  </Button>
                </CardContent>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignUp}>
                <CardContent className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">Nome Completo do Colaborador</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 size-4 text-muted-foreground" />
                      <Input id="signup-name" name="name" placeholder="Como devemos te chamar?" className="pl-10" required />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="signup-cnpj">CNPJ da Instituição</Label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-3 size-4 text-muted-foreground" />
                      <Input 
                        id="signup-cnpj" 
                        name="cnpj" 
                        placeholder="00.000.000/0000-00" 
                        className="pl-10" 
                        value={cnpj}
                        onChange={handleCnpjChange}
                        required 
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-email">E-mail</Label>
                    <Input id="signup-email" name="email" type="email" placeholder="seu@email.com" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Senha</Label>
                    <Input id="signup-password" name="password" type="password" placeholder="Mínimo 6 caracteres" required />
                  </div>
                  <div className="space-y-2">
                    <Label>Perfil de Acesso</Label>
                    <div className="grid grid-cols-2 gap-4">
                      <label className="flex items-center gap-2 p-3 border rounded-xl cursor-pointer hover:bg-muted/50 transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                        <input type="radio" name="role" value="client" defaultChecked className="hidden" />
                        <span className="text-sm font-medium">Instituição</span>
                      </label>
                      <label className="flex items-center gap-2 p-3 border rounded-xl cursor-pointer hover:bg-muted/50 transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                        <input type="radio" name="role" value="admin" className="hidden" />
                        <span className="text-sm font-medium">Administrador</span>
                      </label>
                    </div>
                  </div>
                  <Button type="submit" className="w-full font-bold h-12" disabled={loading}>
                    {loading ? <Loader2 className="animate-spin" /> : "Criar Conta"}
                  </Button>
                </CardContent>
              </form>
            </TabsContent>

            <CardFooter className="flex flex-col gap-4">
              <div className="relative w-full">
                <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">Ou</span>
                </div>
              </div>
              <Button variant="outline" className="w-full gap-2 h-11" onClick={handleSocialLogin} disabled={loading}>
                <Chrome className="size-4" /> Entrar com Google
              </Button>
            </CardFooter>
          </Tabs>
        </Card>

        <div className="text-center">
          <Button variant="link" className="text-muted-foreground" onClick={() => router.push('/')}>
            Voltar para o site institucional
          </Button>
        </div>
      </div>
    </div>
  );
}
