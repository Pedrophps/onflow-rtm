
'use client';

import { useState, useEffect } from 'react';
import { useAuth, useFirestore, useUser } from '@/firebase';
import { 
  signInWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  updateProfile,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Chrome, Mail, Lock, Loader2, User, Building2, AlertCircle, TestTube2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function LoginPage() {
  const auth = useAuth();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const { user: currentUser, loading: authLoading } = useUser();
  const [loading, setLoading] = useState(false);
  const [cnpj, setCnpj] = useState('');
  const [connectionError, setConnectionError] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  useEffect(() => {
    if (currentUser && !loading) {
      checkUserAndRedirect(currentUser);
    }
  }, [currentUser]);

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
      case 'unavailable':
      case 'offline':
        return 'O serviço está temporariamente indisponível. Verifique sua conexão com a internet.';
      default:
        return 'Ocorreu um erro inesperado. Tente novamente em instantes.';
    }
  };

  async function handleSocialLogin() {
    if (loading) return;
    setLoading(true);
    setConnectionError(false);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      await checkUserAndRedirect(result.user);
    } catch (error: any) {
      setLoading(false);
      toast({
        variant: "destructive",
        title: "Erro ao entrar",
        description: getFriendlyErrorMessage(error.code)
      });
    }
  }

  async function handleEmailLogin(e?: React.FormEvent) {
    e?.preventDefault();
    if (loading) return;
    setLoading(true);
    setConnectionError(false);

    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      await checkUserAndRedirect(result.user);
    } catch (error: any) {
      setLoading(false);
      toast({
        variant: "destructive",
        title: "Falha no acesso",
        description: getFriendlyErrorMessage(error.code)
      });
    }
  }

  async function handleSignUp(e?: React.FormEvent) {
    e?.preventDefault();
    if (loading) return;
    setLoading(true);
    setConnectionError(false);

    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      
      await updateProfile(result.user, {
        displayName: name
      });

      const userRef = doc(db, 'users', result.user.uid);
      const isTestAdmin = email.toLowerCase().includes('admin');
      const role = isTestAdmin ? 'admin' : 'client';

      const userData = {
        email,
        role,
        displayName: name,
        cnpj: cnpj,
        createdAt: new Date().toISOString()
      };

      setDoc(userRef, userData, { merge: true })
        .catch(async (error) => {
          errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: userRef.path,
            operation: 'create',
            requestResourceData: userData
          }));
        });

      toast({
        title: "Conta criada com sucesso!",
        description: "Seja bem-vindo ao OnFlow."
      });

      if (role === 'admin') {
        router.push('/dashboard/admin/select-profile');
      } else {
        router.push('/dashboard/client');
      }
    } catch (error: any) {
      setLoading(false);
      toast({
        variant: "destructive",
        title: "Erro no cadastro",
        description: getFriendlyErrorMessage(error.code)
      });
    }
  }

  async function checkUserAndRedirect(user: FirebaseUser) {
    setLoading(true);
    try {
      setConnectionError(false);
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        const role = userDoc.data().role;
        if (role === 'admin') {
          router.push('/dashboard/admin/select-profile');
        } else {
          router.push('/dashboard/client');
        }
      } else {
        const isTestAdmin = user.email?.toLowerCase().includes('admin');
        const role = isTestAdmin ? 'admin' : 'client';

        const userData = { 
          email: user.email, 
          role,
          displayName: user.displayName || user.email?.split('@')[0],
          createdAt: new Date().toISOString()
        };

        setDoc(userDocRef, userData)
          .catch(async () => {
            errorEmitter.emit('permission-error', new FirestorePermissionError({
              path: userDocRef.path,
              operation: 'create',
              requestResourceData: userData
            }));
          });
          
        if (role === 'admin') {
          router.push('/dashboard/admin/select-profile');
        } else {
          router.push('/dashboard/client');
        }
      }
    } catch (error: any) {
      setLoading(false);
      if (error.code === 'unavailable' || error.message?.includes('offline')) {
        setConnectionError(true);
        toast({
          variant: "destructive",
          title: "Sem conexão",
          description: "Não conseguimos validar seu perfil agora. Verifique sua internet."
        });
      } else {
        toast({
          variant: "destructive",
          title: "Erro interno",
          description: "Ocorreu um problema ao carregar seu perfil."
        });
      }
    } finally {
      // Pequeno atraso para garantir que o router processe o redirecionamento
      setTimeout(() => setLoading(false), 3000);
    }
  }

  const fillTestAccount = (type: 'admin' | 'client') => {
    if (type === 'admin') {
      setEmail('admin.teste@rtm.net.br');
      setPassword('123456');
      setName('Administrador Teste');
      setCnpj('12.345.678/0001-90');
    } else {
      setEmail('cliente.teste@rtm.net.br');
      setPassword('123456');
      setName('Cliente Teste');
      setCnpj('98.765.432/0001-10');
    }
    toast({
      title: "Campos Preenchidos",
      description: `Dados de ${type} carregados. Clique em "Acessar Portal" ou "Criar Conta".`
    });
  };

  if (authLoading && !currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="w-full max-w-md space-y-6 animate-in fade-in zoom-in duration-500">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold font-headline text-primary">OnFlow</h1>
          <p className="text-muted-foreground">O Hub Integrador do Mercado Financeiro</p>
        </div>

        {connectionError && (
          <Alert variant="destructive" className="bg-destructive/10 text-destructive border-destructive/20">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Você está offline</AlertTitle>
            <AlertDescription>
              O Firebase reportou que o cliente está offline. Verifique se há algum firewall ou VPN bloqueando a conexão.
            </AlertDescription>
          </Alert>
        )}

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
                      <Input 
                        id="email" 
                        type="email" 
                        placeholder="seu@email.com" 
                        className="pl-10" 
                        required 
                        disabled={loading} 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Senha</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 size-4 text-muted-foreground" />
                      <Input 
                        id="password" 
                        type="password" 
                        placeholder="••••••••" 
                        className="pl-10" 
                        required 
                        disabled={loading} 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                    </div>
                  </div>
                  <Button type="submit" className="w-full font-bold h-12" disabled={loading}>
                    {loading ? <Loader2 className="animate-spin mr-2 size-4" /> : null}
                    {loading ? "Processando..." : "Acessar Portal"}
                  </Button>
                </CardContent>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignUp}>
                <CardContent className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">Nome Completo</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 size-4 text-muted-foreground" />
                      <Input 
                        id="signup-name" 
                        placeholder="Seu nome" 
                        className="pl-10" 
                        required 
                        disabled={loading} 
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="signup-cnpj">CNPJ da Instituição</Label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-3 size-4 text-muted-foreground" />
                      <Input 
                        id="signup-cnpj" 
                        placeholder="00.000.000/0000-00" 
                        className="pl-10" 
                        value={cnpj}
                        onChange={handleCnpjChange}
                        required 
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-email">E-mail</Label>
                    <Input 
                      id="signup-email" 
                      type="email" 
                      placeholder="seu@email.com" 
                      required 
                      disabled={loading} 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Senha</Label>
                    <Input 
                      id="signup-password" 
                      type="password" 
                      placeholder="Mínimo 6 caracteres" 
                      required 
                      disabled={loading} 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                  <Button type="submit" className="w-full font-bold h-12" disabled={loading}>
                    {loading ? <Loader2 className="animate-spin mr-2 size-4" /> : null}
                    {loading ? "Criando Conta..." : "Criar Conta"}
                  </Button>
                </CardContent>
              </form>
            </TabsContent>

            <CardFooter className="flex flex-col gap-4">
              <div className="relative w-full">
                <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">Acesso Rápido para Teste</span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3 w-full">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="gap-2" 
                  onClick={() => fillTestAccount('admin')}
                  disabled={loading}
                >
                  <TestTube2 className="size-3" /> Admin Teste
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="gap-2" 
                  onClick={() => fillTestAccount('client')}
                  disabled={loading}
                >
                  <TestTube2 className="size-3" /> Cliente Teste
                </Button>
              </div>

              <Button variant="outline" className="w-full gap-2 h-11" onClick={handleSocialLogin} disabled={loading}>
                <Chrome className="size-4" /> {loading ? "Entrando..." : "Entrar com Google"}
              </Button>
            </CardFooter>
          </Tabs>
        </Card>

        <div className="text-center">
          <Button variant="link" className="text-muted-foreground" onClick={() => router.push('/')} disabled={loading}>
            Voltar para o site institucional
          </Button>
        </div>
      </div>
    </div>
  );
}
