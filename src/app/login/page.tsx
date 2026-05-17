
'use client';

import { useState } from 'react';
import { useAuth, useFirestore } from '@/firebase';
import { 
  signInWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider,
  createUserWithEmailAndPassword 
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Chrome, Mail, Lock, ArrowRight, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function LoginPage() {
  const auth = useAuth();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

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
        description: error.message
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
        title: "Erro ao entrar",
        description: "Verifique suas credenciais e tente novamente."
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
    const role = formData.get('role') as 'admin' | 'client';

    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      // Criar perfil no Firestore
      await setDoc(doc(db, 'users', result.user.uid), {
        email,
        role,
        createdAt: new Date().toISOString()
      });
      router.push(`/dashboard/${role}`);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao cadastrar",
        description: error.message
      });
      setLoading(false);
    }
  }

  async function checkUserAndRedirect(uid: string, email: string) {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (userDoc.exists()) {
      const role = userDoc.data().role;
      router.push(`/dashboard/${role}`);
    } else {
      // Caso o usuário não tenha perfil, definimos como client por padrão ou pedimos para escolher
      toast({
        title: "Perfil não encontrado",
        description: "Redirecionando para completar seu cadastro."
      });
      // Para o MVP, se não existir, criamos como client
      await setDoc(doc(db, 'users', uid), { email, role: 'client' });
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

        <Card className="border-2">
          <Tabs defaultValue="login" className="w-full">
            <CardHeader>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Entrar</TabsTrigger>
                <TabsTrigger value="signup">Cadastrar</TabsTrigger>
              </TabsList>
            </CardHeader>

            <TabsContent value="login">
              <form onSubmit={handleEmailLogin}>
                <CardContent className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">E-mail</Label>
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
                  <Button type="submit" className="w-full font-bold" disabled={loading}>
                    {loading ? <Loader2 className="animate-spin" /> : "Acessar Portal"}
                  </Button>
                </CardContent>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignUp}>
                <CardContent className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">E-mail</Label>
                    <Input id="signup-email" name="email" type="email" placeholder="seu@email.com" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Senha</Label>
                    <Input id="signup-password" name="password" type="password" placeholder="Mínimo 6 caracteres" required />
                  </div>
                  <div className="space-y-2">
                    <Label>Tipo de Acesso</Label>
                    <div className="grid grid-cols-2 gap-4">
                      <label className="flex items-center gap-2 p-3 border rounded-xl cursor-pointer hover:bg-muted/50 transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                        <input type="radio" name="role" value="client" defaultChecked className="hidden" />
                        <span className="text-sm font-medium">Cliente</span>
                      </label>
                      <label className="flex items-center gap-2 p-3 border rounded-xl cursor-pointer hover:bg-muted/50 transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                        <input type="radio" name="role" value="admin" className="hidden" />
                        <span className="text-sm font-medium">Administrador</span>
                      </label>
                    </div>
                  </div>
                  <Button type="submit" className="w-full font-bold" disabled={loading}>
                    {loading ? <Loader2 className="animate-spin" /> : "Criar Conta"}
                  </Button>
                </CardContent>
              </form>
            </TabsContent>

            <CardFooter className="flex flex-col gap-4">
              <div className="relative w-full">
                <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">Ou continue com</span>
                </div>
              </div>
              <Button variant="outline" className="w-full gap-2" onClick={handleSocialLogin} disabled={loading}>
                <Chrome className="size-4" /> Google
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
