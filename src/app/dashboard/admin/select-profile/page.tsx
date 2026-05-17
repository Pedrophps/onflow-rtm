
'use client';

import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Headset, Briefcase, ArrowRight, LogOut } from 'lucide-react';
import { useAuth, useUser } from '@/firebase';
import { signOut } from 'firebase/auth';

export default function SelectProfilePage() {
  const router = useRouter();
  const auth = useAuth();
  const { user } = useUser();

  const handleSelect = (profile: 'suporte' | 'comercial') => {
    // Redireciona para o dashboard com o parâmetro do perfil selecionado
    router.push(`/dashboard/admin?view=${profile}`);
  };

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/login');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="max-w-4xl w-full space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="space-y-4 text-center">
          <h1 className="text-4xl font-bold font-headline">Seja bem-vindo, <span className="text-primary">{user?.displayName?.split(' ')[0] || 'Administrador'}</span>!</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Seu cadastro foi concluído. Para começar, selecione para qual equipe você deseja visualizar os dados hoje.
          </p>
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
                Gerencie o atendimento técnico, valide documentos e acompanhe etapas de implantação dos clientes.
              </CardDescription>
            </CardHeader>
            <CardContent className="pb-10 text-center">
              <Button className="rounded-full px-8 font-bold gap-2 group-hover:bg-primary/90 transition-all">
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
                Visualize métricas de vendas, novos leads em onboarding e o funil de conversão de negócios.
              </CardDescription>
            </CardHeader>
            <CardContent className="pb-10 text-center">
              <Button variant="secondary" className="rounded-full px-8 font-bold gap-2 transition-all">
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
