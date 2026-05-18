
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { 
  ArrowRight, 
  ShieldCheck, 
  Globe, 
  Building2,
  Network,
  Database,
  FileCheck,
  Lock,
  PhoneCall,
  Menu,
  Zap,
  Server,
  TrendingUp,
  MapPin,
  PieChart,
  CalendarDays,
  CheckCircle2
} from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

export default function Home() {
  const heroImage = PlaceHolderImages.find(img => img.id === 'hero-rtm');

  return (
    <main className="min-h-screen bg-white selection:bg-primary/10">
      {/* Header Section */}
      <header className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-border/50">
        <div className="container mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2 font-headline font-bold text-2xl text-primary">
              RTM
              <span className="text-foreground text-sm font-medium tracking-widest uppercase ml-1 opacity-60">OnFlow</span>
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <nav className="hidden lg:flex items-center gap-6 mr-6">
              <Link href="#sobre" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Sobre</Link>
              <Link href="#servicos" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Serviços</Link>
              <Link href="#trajetoria" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Trajetória</Link>
            </nav>
            <Button size="sm" className="rounded-full px-6 font-bold text-xs uppercase tracking-wider" asChild>
              <Link href="/login">Acessar Portal</Link>
            </Button>

            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden">
                  <Menu className="size-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right">
                <SheetHeader className="text-left">
                  <SheetTitle className="font-headline text-primary">Menu</SheetTitle>
                </SheetHeader>
                <nav className="flex flex-col gap-6 mt-10">
                  <Link href="#sobre" className="text-lg font-bold font-headline">Sobre</Link>
                  <Link href="#servicos" className="text-lg font-bold font-headline">Serviços</Link>
                  <Link href="#trajetoria" className="text-lg font-bold font-headline">Trajetória</Link>
                  <hr />
                  <Link href="/login" className="text-lg font-bold font-headline text-primary">Login</Link>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center bg-slate-50 pt-20">
        <div className="container mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <h1 className="text-5xl lg:text-7xl font-bold tracking-tighter text-foreground font-headline leading-tight">
              Somos a <span className="text-primary">RTM.</span><br />
              <span className="text-3xl lg:text-5xl opacity-80">O Hub integrador do mercado financeiro.</span>
            </h1>
            <p className="text-xl lg:text-2xl text-muted-foreground leading-relaxed max-w-xl">
              Integramos o mercado financeiro brasileiro. Nossas soluções e ferramentas potencializam os resultados dos nossos clientes.
            </p>
            <div className="flex gap-4">
              <Button size="lg" className="rounded-full px-8 h-14 font-bold gap-2" asChild>
                <Link href="/login">Começar Agora <ArrowRight className="size-5" /></Link>
              </Button>
            </div>
          </div>
          <div className="relative h-[500px] hidden lg:block">
            <Image 
              src={heroImage?.imageUrl || "https://picsum.photos/seed/rtm-main/1200/800"} 
              alt="RTM Hub" 
              fill 
              className="object-cover rounded-[2rem] shadow-2xl"
              data-ai-hint="modern architecture"
            />
          </div>
        </div>
      </section>

      {/* Posicionamento & Sobre */}
      <section id="sobre" className="py-24 bg-white">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center space-y-8 mb-20">
            <h2 className="text-3xl lg:text-4xl font-bold font-headline text-primary">
              Identificar para integrar. Entender para atender. Conhecer para evoluir.
            </h2>
            <p className="text-lg text-slate-600 leading-relaxed">
              Empresa da ANBIMA e da B3, a RTM é o principal hub integrador do setor financeiro. Atuando como agente neutro de tecnologia, ouve o mercado com propósito de viabilizar o desenvolvimento de soluções que facilitem o dia a dia operacional das instituições.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-6">
              <p className="text-slate-600 leading-relaxed">
                Fundada em 1997, como rede de comunicação crítica para o segmento financeiro, a RTM evoluiu de provedora de infraestrutura de telecomunicações para o principal hub integrador do setor no país e hoje conecta mais de 850 instituições, com presença em 21 estados brasileiros.
              </p>
              <p className="text-slate-600 leading-relaxed">
                Com a evolução tecnológica e a transformação digital, a oferta de soluções especializadas foi se ampliando e hoje inclui serviços de Data Center, nuvem, cibersegurança, plataforma para indústria de fundos de investimentos, conexão ao Pix, Drex e Open Finance, além de Blockchain as a Service para operações com ativos tokenizados.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6">
                <div className="p-6 bg-slate-50 rounded-2xl">
                  <h4 className="font-bold text-primary mb-2">Propósito</h4>
                  <p className="text-sm text-slate-600">Promover a evolução do Mercado Financeiro pela Tecnologia</p>
                </div>
                <div className="p-6 bg-slate-50 rounded-2xl">
                  <h4 className="font-bold text-primary mb-2">Valores</h4>
                  <p className="text-sm text-slate-600">Foco no cliente, Desenvolvimento de Pessoas e Equipe, Confiança e Inovação</p>
                </div>
              </div>
            </div>
            <div className="bg-primary/5 p-12 rounded-[3rem] space-y-8">
              <h3 className="text-2xl font-bold font-headline text-slate-900">Nossa Presença</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <MapPin className="text-primary size-6" />
                  <div>
                    <p className="font-bold">21 Estados + Distrito Federal</p>
                    <p className="text-sm text-slate-500">Cobertura em todas as 5 regiões do país.</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Building2 className="text-primary size-6" />
                  <div>
                    <p className="font-bold">850+ Instituições</p>
                    <p className="text-sm text-slate-500">Conectadas com estabilidade e segurança.</p>
                  </div>
                </div>
              </div>
              <Image 
                src="https://picsum.photos/seed/rtm-map/600/400" 
                alt="Mapa RTM" 
                width={600} 
                height={400} 
                className="rounded-xl opacity-80"
                data-ai-hint="brazil map"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Serviços Críticos */}
      <section id="servicos" className="py-24 bg-slate-50">
        <div className="container mx-auto px-6">
          <div className="mb-16">
            <h2 className="text-4xl font-bold font-headline tracking-tighter text-slate-900">Serviços Críticos</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <ServiceCard 
              icon={Network} 
              title="RSFN" 
              desc="Rede do Sistema Financeiro Nacional do SPB em consórcio com a Embratel." 
            />
            <ServiceCard 
              icon={Database} 
              title="NÚCLEA" 
              desc="Sistema de Cessão de Crédito, nova cobrança e liquidação centralizada." 
            />
            <ServiceCard 
              icon={TrendingUp} 
              title="B3" 
              desc="Negociação, compensação, liquidação e registro para títulos privados." 
            />
            <ServiceCard 
              icon={FileCheck} 
              title="COMPE ABBC" 
              desc="Compensação de cheques por imagem digital." 
            />
            <ServiceCard 
              icon={Lock} 
              title="SELIC" 
              desc="Sistema Especial de Liquidação e Custódia para títulos públicos." 
            />
            <ServiceCard 
              icon={PhoneCall} 
              title="Hotline/Mesa" 
              desc="Comunicação para traders com mais de 2 mil linhas privadas." 
            />
            <ServiceCard 
              icon={Zap} 
              title="SWIFT" 
              desc="Acesso aos serviços SWIFT para remessas internacionais." 
            />
            <ServiceCard 
              icon={Server} 
              title="TECBAN" 
              desc="Movimentação bancária das transações de rede 24 horas." 
            />
          </div>
        </div>
      </section>

      {/* Trajetória Timeline */}
      <section id="trajetoria" className="py-24 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-20 space-y-4">
            <h2 className="text-4xl font-bold font-headline tracking-tighter">Confira os destaques da nossa trajetória</h2>
            <p className="text-slate-500">Temos uma história que reflete a construção de nosso profundo conhecimento técnico.</p>
          </div>
          
          <div className="relative space-y-8 before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
            <TimelineItem year="1997" text="Nasce a RTM - Rede de Telecomunicações para o Mercado." />
            <TimelineItem year="2001" text="Implantação da rede do SPB." />
            <TimelineItem year="2002" text="Oferta de Site de Contingência." />
            <TimelineItem year="2003" text="Estrutura para conexão à SWIFT." />
            <TimelineItem year="2011" text="Data Center para o mercado financeiro." />
            <TimelineItem year="2014" text="Solução de Cloud." />
            <TimelineItem year="2016" text="Mesa de operações financeiras." />
            <TimelineItem year="2017" text="1ª solução de SaaS para o mercado de pagamentos." />
            <TimelineItem year="2018" text="Conexão segura com nuvens públicas." />
            <TimelineItem year="2020" text="Soluções de segurança e infraestrutura para o Pix." />
            <TimelineItem year="2022" text="Lançamento da Plataforma Hub Fundos." />
            <TimelineItem year="2023" text="Infraestrutura de Blockchain para Drex/Tokenização." />
            <TimelineItem year="2024" text="Nova funcionalidade do Hub Pagamentos para conciliação." />
            <TimelineItem year="2025" text="Aquisição da Galgo S.A. e expansão para fundos." />
          </div>
        </div>
      </section>

      {/* Footer Section */}
      <footer className="py-12 border-t bg-slate-50">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="space-y-2">
              <p className="font-bold text-primary text-xl">OnFlow by RTM</p>
              <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} RTM - Hub Integrador do Mercado Financeiro.</p>
            </div>
            <div className="flex gap-6">
              <Link href="/debug/erp-simulator" className="text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-primary">Simulador ERP</Link>
              <Link href="/debug/suite" className="text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-primary">Test Suite</Link>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}

function ServiceCard({ icon: Icon, title, desc }: { icon: any, title: string, desc: string }) {
  return (
    <Card className="border-none shadow-sm hover:shadow-md transition-all group bg-white">
      <CardHeader className="pb-2">
        <div className="size-10 rounded-xl bg-primary/5 text-primary flex items-center justify-center mb-2 group-hover:bg-primary group-hover:text-white transition-colors">
          <Icon className="size-5" />
        </div>
        <CardTitle className="text-lg font-bold font-headline">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-slate-600 text-xs leading-relaxed">{desc}</p>
      </CardContent>
    </Card>
  );
}

function TimelineItem({ year, text }: { year: string, text: string }) {
  return (
    <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
      <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-slate-100 text-primary shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
        <CalendarDays className="size-4" />
      </div>
      <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl bg-white border border-slate-100 shadow-sm">
        <div className="flex items-center justify-between space-x-2 mb-1">
          <div className="font-bold text-primary">{year}</div>
        </div>
        <div className="text-slate-600 text-sm">{text}</div>
      </div>
    </div>
  );
}
