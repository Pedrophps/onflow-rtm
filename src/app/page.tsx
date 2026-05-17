
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LayoutDashboard, Users, ArrowRight } from 'lucide-react';

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="flex flex-col justify-center space-y-6">
          <h1 className="text-5xl font-bold tracking-tight text-primary">OnFlow</h1>
          <p className="text-xl text-muted-foreground leading-relaxed">
            Gestão inteligente de onboarding. Acompanhe processos, valide documentos e garanta o sucesso do seu cliente.
          </p>
        </div>

        <div className="grid gap-4">
          <Link href="/dashboard/admin">
            <Card className="hover:border-primary transition-all cursor-pointer group h-full">
              <CardHeader>
                <div className="size-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-2 group-hover:scale-110 transition-transform">
                  <LayoutDashboard className="size-6" />
                </div>
                <CardTitle>Painel Administrativo</CardTitle>
                <CardDescription>Gerencie fluxos, etapas e visualize métricas de progresso.</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full justify-between" variant="ghost">
                  Acessar como Admin <ArrowRight className="size-4" />
                </Button>
              </CardContent>
            </Card>
          </Link>

          <Link href="/dashboard/client">
            <Card className="hover:border-primary transition-all cursor-pointer group h-full">
              <CardHeader>
                <div className="size-12 rounded-lg bg-secondary/10 flex items-center justify-center text-secondary mb-2 group-hover:scale-110 transition-transform">
                  <Users className="size-6" />
                </div>
                <CardTitle>Jornada do Cliente</CardTitle>
                <CardDescription>Acompanhe seu progresso e envie as evidências solicitadas.</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full justify-between" variant="ghost">
                  Acessar como Cliente <ArrowRight className="size-4" />
                </Button>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </main>
  );
}
