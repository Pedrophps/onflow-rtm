
'use client';

import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Headset, Briefcase, ArrowRight } from 'lucide-react';

export default function SelectProfilePage() {
  const router = useRouter();

  const handleSelect = (profile: 'suporte' | 'comercial') => {
    // Redireciona para o dashboard com o parâmetro do perfil selecionado
    router.push(`/dashboard/admin?view=${profile}`);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="max-w-4xl w-full space-y-12 text-center">
        <div className="space-y-4">
          <h1 className="text-4xl font-bold font-headline">Selecione seu Perfil de Atuação</h1>
          <p className="text-xl text-muted-foreground">Para qual equipe você deseja visualizar os dados hoje?</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <Card 
            className="group hover:border-primary transition-all cursor-pointer border-2"
            onClick={() => handleSelect('suporte')}
          >
            <CardHeader className="pt-10">
              <div className="size-20 rounded-2xl bg-primary/5 flex items-center justify-center text-primary mx-auto group-hover:scale-110 transition-transform mb-4">
                <Headset className="size-10" />
              </div>
              <CardTitle className="text-2xl">Equipe de Suporte</CardTitle>
              <CardDescription className="text-base px-4">
                Foco em atendimento técnico, chamados e acompanhamento de etapas de implantação.
              </CardDescription>
            </CardHeader>
            <CardContent className="pb-10">
              <Button variant="outline" className="group-hover:bg-primary group-hover:text-white transition-colors gap-2">
                Acessar Suporte <ArrowRight className="size-4" />
              </Button>
            </CardContent>
          </Card>

          <Card 
            className="group hover:border-primary transition-all cursor-pointer border-2"
            onClick={() => handleSelect('comercial')}
          >
            <CardHeader className="pt-10">
              <div className="size-20 rounded-2xl bg-primary/5 flex items-center justify-center text-primary mx-auto group-hover:scale-110 transition-transform mb-4">
                <Briefcase className="size-10" />
              </div>
              <CardTitle className="text-2xl">Equipe Comercial</CardTitle>
              <CardDescription className="text-base px-4">
                Visão de negócios, metas de novos clientes e conversão de funil de onboarding.
              </CardDescription>
            </CardHeader>
            <CardContent className="pb-10">
              <Button variant="outline" className="group-hover:bg-primary group-hover:text-white transition-colors gap-2">
                Acessar Comercial <ArrowRight className="size-4" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
