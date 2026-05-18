import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
  CheckCircle2,
  LayoutGrid
} from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import Image from 'next/image';

export default function Home() {
  return (
    <main className="min-h-screen bg-white selection:bg-primary/10 font-body">
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
              <a href="#sobre" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Sobre</a>
              <a href="#servicos" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Serviços Críticos</a>
              <a href="#presenca" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Presença</a>
              <a href="#trajetoria" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Trajetória</a>
            </nav>
            <Button size="sm" className="rounded-full px-6 font-bold text-xs uppercase tracking-wider shadow-lg shadow-primary/20" asChild>
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
                  <SheetTitle className="font-headline text-primary">Menu RTM</SheetTitle>
                </SheetHeader>
                <nav className="flex flex-col gap-6 mt-10">
                  <a href="#sobre" className="text-lg font-bold font-headline">Sobre</a>
                  <a href="#servicos" className="text-lg font-bold font-headline">Serviços Críticos</a>
                  <a href="#presenca" className="text-lg font-bold font-headline">Presença</a>
                  <a href="#trajetoria" className="text-lg font-bold font-headline">Trajetória</a>
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
          <div className="space-y-8 animate-in fade-in slide-in-from-left duration-700">
            <h1 className="text-5xl lg:text-7xl font-bold tracking-tighter text-foreground font-headline leading-tight">
              Somos a <span className="text-primary border-b-4 border-primary/20">RTM.</span><br />
              <span className="text-3xl lg:text-5xl opacity-80 block mt-2 font-medium">O Hub integrador do mercado financeiro.</span>
            </h1>
            <p className="text-xl lg:text-2xl text-muted-foreground leading-relaxed max-w-xl font-light">
              Integramos o mercado financeiro brasileiro. Nossas soluções e ferramentas potencializam os resultados dos nossos clientes.
            </p>
            <div className="flex gap-4">
              <Button size="lg" className="rounded-full px-10 h-14 font-bold gap-2 text-lg shadow-xl shadow-primary/30" asChild>
                <Link href="/login">Começar Agora <ArrowRight className="size-6" /></Link>
              </Button>
            </div>
          </div>
          <div className="relative h-[550px] hidden lg:block animate-in fade-in slide-in-from-right duration-1000">
             <div className="absolute inset-0 bg-primary/10 rounded-[3rem] -rotate-3 transform translate-x-4 translate-y-4"></div>
             <Image 
              src="https://picsum.photos/seed/rtm-hub/1200/800" 
              alt="RTM Hub" 
              fill 
              className="object-cover rounded-[3rem] shadow-2xl relative z-10"
              priority
              data-ai-hint="financial building"
            />
          </div>
        </div>
      </section>

      {/* Posicionamento & Sobre */}
      <section id="sobre" className="py-32 bg-white">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center space-y-8 mb-24">
            <h2 className="text-4xl lg:text-5xl font-bold font-headline text-primary tracking-tight">
              Identificar para integrar. Entender para atender. Conhecer para evoluir.
            </h2>
            <p className="text-xl text-slate-600 leading-relaxed font-medium italic">
              Empresa da ANBIMA e da B3, a RTM é o principal hub integrador do setor financeiro. Atuando como agente neutro de tecnologia, ouve o mercado com propósito de viabilizar o desenvolvimento de soluções que facilitem o dia a dia operacional das instituições.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-20 items-start">
            <div className="space-y-8 text-lg text-slate-600 leading-relaxed">
              <p>
                Fundada em 1997, como rede de comunicação crítica para o segmento financeiro, a RTM evoluiu de provedora de infraestrutura de telecomunicações para o principal hub integrador do setor no país e hoje conecta mais de 850 instituições, com presença em 21 estados brasileiros.
              </p>
              <p>
                Com a evolução tecnológica e a transformação digital, a oferta de soluções especializadas foi se ampliando e hoje inclui serviços de Data Center, nuvem, cibersegurança, plataforma para indústria de fundos de investimentos, conexão ao Pix, Drex e Open Finance, além de Blockchain as a Service para operações com ativos tokenizados.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-10">
                <div className="p-8 bg-slate-50 rounded-3xl border border-slate-100 hover:border-primary/20 transition-all text-center group">
                  <h4 className="font-black text-primary mb-3 uppercase tracking-tighter text-sm">Propósito</h4>
                  <p className="text-sm font-bold text-slate-900 group-hover:text-primary transition-colors leading-snug">Promover a evolução do Mercado Financeiro pela Tecnologia</p>
                </div>
                <div className="p-8 bg-slate-50 rounded-3xl border border-slate-100 hover:border-primary/20 transition-all text-center group">
                  <h4 className="font-black text-primary mb-3 uppercase tracking-tighter text-sm">Valores</h4>
                  <p className="text-sm font-bold text-slate-900 group-hover:text-primary transition-colors leading-snug">Foco no cliente, Pessoas, Confiança e Inovação</p>
                </div>
                <div className="p-8 bg-slate-50 rounded-3xl border border-slate-100 hover:border-primary/20 transition-all text-center group">
                  <h4 className="font-black text-primary mb-3 uppercase tracking-tighter text-sm">Posicionamento</h4>
                  <p className="text-sm font-bold text-slate-900 group-hover:text-primary transition-colors leading-snug">Identificar, Entender, Conhecer</p>
                </div>
              </div>
            </div>

            <div className="bg-slate-900 p-12 rounded-[4rem] text-white shadow-2xl space-y-12 relative overflow-hidden">
               <div className="absolute top-0 right-0 size-64 bg-primary/20 blur-[100px] -mr-32 -mt-32"></div>
               <h3 className="text-3xl font-bold font-headline relative z-10">Nossa Presença</h3>
               <div className="space-y-8 relative z-10">
                <div className="flex items-center gap-6">
                  <div className="size-14 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/40"><MapPin className="text-white size-8" /></div>
                  <div>
                    <p className="text-2xl font-black">20 Estados + DF</p>
                    <p className="text-slate-400 font-medium">Cobertura em todas as 5 regiões do país.</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="size-14 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/40"><Building2 className="text-white size-8" /></div>
                  <div>
                    <p className="text-2xl font-black">750+ Instituições</p>
                    <p className="text-slate-400 font-medium">Conectadas com estabilidade absoluta.</p>
                  </div>
                </div>
              </div>
              <div className="pt-8 border-t border-white/10 space-y-4">
                <p className="text-sm font-bold text-primary uppercase tracking-widest">Infraestrutura Crítica</p>
                <p className="text-slate-300 leading-relaxed italic">"Marcamos presença em quase todo o território brasileiro, garantindo segurança e rapidez para quem move a economia."</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Serviços Críticos */}
      <section id="servicos" className="py-32 bg-slate-50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-20 space-y-4">
            <h2 className="text-5xl font-bold font-headline tracking-tighter text-slate-900 uppercase">Serviços Críticos</h2>
            <div className="h-2 w-24 bg-primary mx-auto rounded-full"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <ServiceCard 
              icon={Network} 
              title="RSFN" 
              desc="Rede do Sistema Financeiro Nacional do SPB em consórcio com a Embratel." 
            />
            <ServiceCard 
              icon={Database} 
              title="NÚCLEA" 
              desc="Sistema de Cessão de Crédito, plataforma de nova cobrança, sistema de liquidação centralizado e cadastro positivo." 
            />
            <ServiceCard 
              icon={TrendingUp} 
              title="B3" 
              desc="Negociação, compensação, liquidação, depósito e registro para títulos privados." 
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
              desc="Comunicação para traders com mais de 2 mil linhas privadas conectando o mercado." 
            />
            <ServiceCard 
              icon={Zap} 
              title="SWIFT" 
              desc="Acesso aos serviços SWIFT para remessas e pagamentos internacionais." 
            />
            <ServiceCard 
              icon={Server} 
              title="TECBAN" 
              desc="Movimentação bancária das transações de rede de atendimento 24 horas." 
            />
          </div>
        </div>
      </section>

      {/* Soluções e Topologia Section */}
      <section className="py-32 bg-white">
        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-12 gap-16 items-center">
            <div className="lg:col-span-7 relative h-[600px]">
              <Image 
                src="https://picsum.photos/seed/rtm-topo/1200/900" 
                alt="Topologia RTM" 
                fill 
                className="object-contain rounded-3xl"
                data-ai-hint="network topology"
              />
            </div>
            <div className="lg:col-span-5 space-y-8">
              <Badge className="bg-primary/10 text-primary border-none px-4 py-1 uppercase font-black tracking-widest text-[10px]">Arquitetura de Excelência</Badge>
              <h2 className="text-4xl font-bold font-headline text-slate-900 leading-tight">Atendemos todos os segmentos do setor financeiro</h2>
              <p className="text-lg text-slate-600 leading-relaxed">
                Nossa topologia contempla todas as soluções RTM integradas de ponta a ponta. Oferecemos um ecossistema completo para Bancos, Fintechs, Corretoras e Adquirentes.
              </p>
              <div className="p-8 bg-primary/5 rounded-[2rem] border border-primary/10">
                 <div className="flex items-center gap-4 mb-4">
                    <PieChart className="text-primary size-8" />
                    <h4 className="font-bold text-slate-900">Distribuição de Clientes</h4>
                 </div>
                 <p className="text-sm text-slate-600 font-medium leading-relaxed italic">"Gráfico em pizza que mostra a distribuição dos clientes RTM de acordo com os segmentos do mercado em que se enquadram."</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trajetória Timeline */}
      <section id="trajetoria" className="py-32 bg-slate-900 text-white overflow-hidden relative">
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
        <div className="container mx-auto px-6 relative z-10">
          <div className="text-center mb-24 space-y-4">
            <h2 className="text-5xl font-bold font-headline tracking-tighter">Confira os destaques da nossa trajetória</h2>
            <p className="text-slate-400 text-xl font-light">Temos uma história que reflete a construção de nosso profundo conhecimento técnico e entregas de excelência.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-12 gap-y-16">
            <TimelineItem year="1997" title="Fundação" text="Nasce a RTM - Rede de Telecomunicações para o Mercado." />
            <TimelineItem year="2001" title="SPB" text="Implantação da rede do SPB." />
            <TimelineItem year="2002" title="Contingência" text="Oferta de Site de Contingência." />
            <TimelineItem year="2003" title="SWIFT" text="Estrutura para conexão à SWIFT." />
            <TimelineItem year="2011" title="Data Center" text="Data Center para o mercado financeiro." />
            <TimelineItem year="2014" title="Cloud" text="Solução de Cloud." />
            <TimelineItem year="2016" title="Traders" text="Mesa de operações financeiras." />
            <TimelineItem year="2017" title="SaaS" text="1ª solução de SaaS para o mercado de pagamentos." />
            <TimelineItem year="2018" title="Hybrid Cloud" text="Conexão segura com nuvens públicas." />
            <TimelineItem year="2020" title="PIX" text="Soluções de segurança e infraestrutura para o Pix." />
            <TimelineItem year="2022" title="Hub Fundos" text="Lançamento da Plataforma Hub Fundos." />
            <TimelineItem year="2023" title="Blockchain" text="Infraestrutura de Blockchain para Drex/Tokenização." />
            <TimelineItem year="2024" title="Conciliação" text="Nova funcionalidade do Hub Pagamentos para conciliação de vendas." />
            <TimelineItem year="2025" title="Expansão" text="Aquisição da Galgo S.A. e expansão dos serviços para a indústria de fundos." />
          </div>
        </div>
      </section>

      {/* Footer Section */}
      <footer className="py-20 border-t bg-white">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-12">
            <div className="space-y-4 text-center md:text-left">
              <p className="font-headline font-black text-primary text-3xl tracking-tighter">OnFlow <span className="text-slate-300">by RTM</span></p>
              <p className="text-sm text-muted-foreground font-medium uppercase tracking-widest italic">© {new Date().getFullYear()} RTM - Hub Integrador do Mercado Financeiro.</p>
            </div>
            <div className="flex flex-wrap justify-center gap-8">
              <Link href="/debug/erp-simulator" className="group flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-primary transition-all">
                <LayoutGrid className="size-4 opacity-40 group-hover:opacity-100" /> Simulador ERP
              </Link>
              <Link href="/debug/suite" className="group flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-primary transition-all">
                <ShieldCheck className="size-4 opacity-40 group-hover:opacity-100" /> Test Suite
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}

function ServiceCard({ icon: Icon, title, desc }: { icon: any, title: string, desc: string }) {
  return (
    <Card className="border-none shadow-sm hover:shadow-2xl transition-all group bg-white p-2 rounded-[2rem] hover:-translate-y-2 duration-300">
      <CardHeader className="pb-4">
        <div className="size-14 rounded-2xl bg-slate-50 text-primary flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-white transition-all duration-300 shadow-inner">
          <Icon className="size-7" />
        </div>
        <CardTitle className="text-xl font-bold font-headline text-slate-900 group-hover:text-primary transition-colors tracking-tight">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-slate-600 text-sm leading-relaxed font-medium">{desc}</p>
      </CardContent>
    </Card>
  );
}

function TimelineItem({ year, title, text }: { year: string, title: string, text: string }) {
  return (
    <div className="relative space-y-3 group border-l-2 border-white/10 pl-6 pb-2 hover:border-primary transition-colors">
      <div className="absolute -left-[9px] top-0 size-4 rounded-full bg-slate-800 border-2 border-white/20 group-hover:bg-primary group-hover:border-white group-hover:scale-125 transition-all"></div>
      <div className="font-black text-primary text-2xl tracking-tighter">{year}</div>
      <div className="font-bold text-white text-lg">{title}</div>
      <div className="text-slate-400 text-sm leading-relaxed font-medium">{text}</div>
    </div>
  );
}
