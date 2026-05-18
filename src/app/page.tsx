import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { 
  LayoutDashboard, 
  Users, 
  ArrowRight, 
  ShieldCheck, 
  Cloud, 
  Globe, 
  Cpu, 
  TrendingUp, 
  Building2,
  Network,
  Database,
  BarChart3,
  FileCheck,
  Lock,
  PhoneCall,
  CreditCard,
  ExternalLink,
  Menu,
  Wifi,
  ShieldAlert,
  Terminal
} from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
  SheetDescription,
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
            <nav className="hidden lg:flex items-center gap-6">
              <Link href="#sobre" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Sobre</Link>
              <Link href="#servicos" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Serviços</Link>
              <Link href="#solucoes" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Soluções</Link>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-3">
              <Button variant="ghost" size="sm" className="font-bold text-xs uppercase tracking-wider" asChild>
                <Link href="/login">Entrar</Link>
              </Button>
              <Button size="sm" className="rounded-full px-6 font-bold text-xs uppercase tracking-wider" asChild>
                <Link href="/login">Cadastre-se</Link>
              </Button>
            </div>

            {/* Mobile Menu */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden">
                  <Menu className="size-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                <SheetHeader className="text-left">
                  <SheetTitle className="font-headline text-primary">Navegação</SheetTitle>
                  <SheetDescription>
                    Acesse as principais seções do portal RTM OnFlow.
                  </SheetDescription>
                </SheetHeader>
                <nav className="flex flex-col gap-6 mt-10">
                  <Link href="#sobre" className="text-lg font-bold font-headline hover:text-primary transition-colors">Sobre a RTM</Link>
                  <Link href="#servicos" className="text-lg font-bold font-headline hover:text-primary transition-colors">Serviços Críticos</Link>
                  <Link href="#solucoes" className="text-lg font-bold font-headline hover:text-primary transition-colors">Soluções Especializadas</Link>
                  <hr className="my-4" />
                  <Link href="/login" className="text-lg font-bold font-headline text-muted-foreground hover:text-primary transition-colors">Entrar</Link>
                  <Link href="/login" className="text-lg font-bold font-headline text-primary">Cadastre-se</Link>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center overflow-hidden bg-background pt-20">
        <div className="container mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
          <div className="space-y-8 animate-in fade-in slide-in-from-left duration-700">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-bold tracking-tight uppercase">
              Hub Integrador do Mercado Financeiro
            </div>
            <h1 className="text-5xl lg:text-7xl font-bold tracking-tighter text-foreground font-headline leading-tight">
              Somos a <span className="text-primary">RTM.</span>
            </h1>
            <p className="text-xl lg:text-2xl text-muted-foreground leading-relaxed max-w-xl">
              Integramos o mercado financeiro brasileiro. Nossas soluções e ferramentas potencializam os resultados dos nossos clientes.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button size="lg" className="rounded-full px-8 h-14 text-base font-bold gap-2 shadow-xl shadow-primary/20" asChild>
                <Link href="/login">
                  Cadastre-se <ArrowRight className="size-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="rounded-full px-8 h-14 text-base font-bold border-2" asChild>
                <Link href="/login">Entrar</Link>
              </Button>
            </div>
          </div>
          <div className="hidden lg:block relative h-[600px] animate-in fade-in zoom-in duration-1000">
            <div className="absolute inset-0 bg-primary/5 rounded-3xl -rotate-2 -translate-x-4"></div>
            <div className="absolute inset-0 bg-secondary/5 rounded-3xl rotate-1 translate-x-4"></div>
            <Image 
              src={heroImage?.imageUrl || "https://picsum.photos/seed/rtm-buildings/1200/800"} 
              alt={heroImage?.description || "RTM Hub"} 
              fill 
              className="object-cover rounded-3xl shadow-2xl relative z-10"
              data-ai-hint="modern buildings"
            />
          </div>
        </div>
        <div className="absolute bottom-0 right-0 w-1/3 h-1/2 bg-primary/5 blur-3xl rounded-full -mb-32 -mr-32 pointer-events-none"></div>
      </section>

      {/* Positioning Section */}
      <section className="py-24 bg-primary text-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-3xl font-bold font-headline uppercase tracking-tighter">Nosso Posicionamento</h2>
            <p className="text-xl opacity-90 max-w-2xl mx-auto">Identificar para integrar. Entender para atender. Conhecer para evoluir.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              { title: "Identificar para integrar", desc: "Mapeamos necessidades para conexões precisas.", icon: Network },
              { title: "Entender para atender", desc: "Ouvimos o mercado com propósito de viabilizar o dia a dia.", icon: Users },
              { title: "Conhecer para evoluir", desc: "Desenvolvemos soluções que acompanham a transformação.", icon: TrendingUp },
            ].map((item, i) => (
              <div key={i} className="space-y-4 text-center md:text-left">
                <div className="size-12 rounded-xl bg-white/10 flex items-center justify-center mx-auto md:mx-0">
                  <item.icon className="size-6" />
                </div>
                <h3 className="text-xl font-bold font-headline">{item.title}</h3>
                <p className="text-white/80 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="sobre" className="py-24">
        <div className="container mx-auto px-6 max-w-5xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
            <div className="lg:col-span-7 space-y-6">
              <h2 className="text-3xl font-bold font-headline">Sobre a RTM</h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Empresa da <span className="font-bold text-foreground">ANBIMA</span> e da <span className="font-bold text-foreground">B3</span>, a RTM é o principal hub integrador do setor financeiro. Atuando como agente neutro de tecnologia, ouve o mercado com propósito de viabilizar o desenvolvimento de soluções que facilitem o dia a dia operacional das instituições.
              </p>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Fundada em 1997, como rede de comunicação crítica para o segmento financeiro, a RTM evoluiu de provedora de infraestrutura de telecomunicações para o principal hub integrador do setor no país e hoje conecta mais de <span className="text-primary font-bold">850 instituições</span>, com presença em 21 estados brasileiros.
              </p>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Com a evolução tecnológica e a transformação digital, a oferta de soluções especializadas foi se ampliando e hoje inclui serviços de Data Center, nuvem, cibersegurança, plataforma para indústria de fundos de investimentos, conexão ao Pix, Drex e Open Finance, além de Blockchain as a Service para operações com ativos tokenizados.
              </p>
            </div>
            <div className="lg:col-span-5 space-y-8">
              <Card className="border-none bg-muted/50">
                <CardHeader>
                  <CardTitle className="text-primary font-headline">Nosso Propósito</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-lg font-medium">Promover a evolução do Mercado Financeiro pela Tecnologia</p>
                </CardContent>
              </Card>
              <div className="space-y-4">
                <h4 className="font-bold uppercase tracking-wider text-xs text-muted-foreground">Valores</h4>
                <div className="flex flex-wrap gap-2">
                  {["Foco no cliente", "Desenvolvimento de Pessoas", "Equipe", "Confiança", "Inovação"].map((val) => (
                    <span key={val} className="px-3 py-1 rounded-full bg-white border font-medium text-sm text-slate-700">{val}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Serviços Críticos Section */}
      <section id="servicos" className="py-24 bg-background">
        <div className="container mx-auto px-6">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-4xl font-bold font-headline">Serviços Críticos</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">Conectividade e sistemas essenciais para o funcionamento do mercado.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { 
                title: "RSFN", 
                icon: Network, 
                desc: "Rede do Sistema Financeiro Nacional do SPB em consórcio com a Embratel." 
              },
              { 
                title: "NÚCLEA", 
                icon: Database, 
                desc: "Sistema de Cessão de Crédito, plataforma de nova cobrança, sistema de liquidação centralizado e cadastro positivo." 
              },
              { 
                title: "B3", 
                icon: BarChart3, 
                desc: "Sistema de negociação, compensação, liquidação, depósito e registro para títulos privados." 
              },
              { 
                title: "COMPE ABBC", 
                icon: FileCheck, 
                desc: "Compensação de cheques por imagem digital." 
              },
              { 
                title: "SELIC", 
                icon: Lock, 
                desc: "Sistema Especial de Liquidação e Custódia para títulos públicos." 
              },
              { 
                title: "Hotline / Mesa", 
                icon: PhoneCall, 
                desc: "Serviços de comunicação e negociação para traders. Atualmente com mais de 2 mil linhas privadas conectando o mercado." 
              },
              { 
                title: "SWIFT", 
                icon: Globe, 
                desc: "Acesso aos serviços SWIFT para remessas e pagamentos internacionais." 
              },
              { 
                title: "TECBAN", 
                icon: CreditCard, 
                desc: "Movimentação bancária das transações de rede de atendimento 24 horas." 
              },
            ].map((serv, i) => (
              <Card key={i} className="hover:shadow-md transition-all border-muted">
                <CardHeader>
                  <div className="size-10 rounded-lg bg-primary/5 flex items-center justify-center text-primary mb-2">
                    <serv.icon className="size-5" />
                  </div>
                  <CardTitle className="text-lg font-bold">{serv.title}</CardTitle>
                  <CardDescription className="text-sm leading-relaxed">{serv.desc}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Solutions Section */}
      <section id="solucoes" className="py-24 bg-muted/30">
        <div className="container mx-auto px-6">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-4xl font-bold font-headline">Soluções Especializadas</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">Tecnologia de ponta para atender as demandas críticas do setor financeiro.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { title: "Data Center & Cloud", icon: Cloud, desc: "Infraestrutura robusta e segura para aplicações críticas." },
              { title: "Cibersegurança", icon: ShieldCheck, desc: "Proteção avançada contra ameaças digitais complexas." },
              { title: "Indústria de Fundos", icon: Building2, desc: "Plataforma integrada para gestão de ativos e investimentos." },
              { title: "Pix, Drex & Open Finance", icon: ExternalLink, desc: "Conexão direta com os novos ecossistemas de inovação." },
              { title: "Blockchain as a Service", icon: Cpu, desc: "Tokenização de ativos com segurança e conformidade." },
              { title: "Rede Crítica", icon: Network, desc: "Conectividade de altíssima disponibilidade e baixa latência." },
            ].map((sol, i) => (
              <Card key={i} className="hover:border-primary transition-all group border-muted shadow-sm">
                <CardHeader>
                  <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-2 group-hover:scale-110 transition-transform">
                    <sol.icon className="size-5" />
                  </div>
                  <CardTitle className="text-lg">{sol.title}</CardTitle>
                  <CardDescription>{sol.desc}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Access Section */}
      <section className="py-24">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
            <Link href="/login">
              <Card className="hover:border-primary transition-all cursor-pointer group h-full border-2 border-dashed">
                <CardHeader>
                  <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-2">
                    <LayoutDashboard className="size-6" />
                  </div>
                  <CardTitle>Entrar</CardTitle>
                  <CardDescription>Gerencie fluxos, etapas e visualize métricas de progresso.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full justify-between" variant="ghost">
                    Acessar como Admin <ArrowRight className="size-4" />
                  </Button>
                </CardContent>
              </Card>
            </Link>

            <Link href="/login">
              <Card className="hover:border-primary transition-all cursor-pointer group h-full border-2 border-dashed">
                <CardHeader>
                  <div className="size-12 rounded-full bg-secondary/10 flex items-center justify-center text-secondary mb-2">
                    <Users className="size-6" />
                  </div>
                  <CardTitle>Cadastre-se</CardTitle>
                  <CardDescription>Acompanhe seu progresso e envie as evidências solicitadas.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full justify-between" variant="ghost">
                    Jornada do Cliente <ArrowRight className="size-4" />
                  </Button>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      </section>

      <footer className="py-12 border-t bg-white">
        <div className="container mx-auto px-6 text-center space-y-8">
          <div className="space-y-2">
            <p className="font-bold text-primary text-xl">OnFlow by RTM</p>
            <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} RTM - Hub Integrador do Mercado Financeiro. Todos os direitos reservados.</p>
          </div>

          <div className="pt-8 border-t flex flex-wrap justify-center gap-8">
            <Link 
              href="/debug" 
              className="group flex flex-col items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-amber-600 transition-colors"
            >
              <div className="size-8 rounded-full bg-slate-50 group-hover:bg-amber-50 flex items-center justify-center transition-colors">
                <Wifi className="size-4" />
              </div>
              <span>Diagnóstico de Rede</span>
            </Link>
            
            <Link 
              href="/debug/suite" 
              className="group flex flex-col items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-primary transition-colors"
            >
              <div className="size-8 rounded-full bg-slate-50 group-hover:bg-primary/5 flex items-center justify-center transition-colors">
                <Terminal className="size-4" />
              </div>
              <span>Test Suite & Seeding</span>
            </Link>

            <Link 
              href="/debug/integration-test" 
              className="group flex flex-col items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-emerald-600 transition-colors"
            >
              <div className="size-8 rounded-full bg-slate-50 group-hover:bg-emerald-50 flex items-center justify-center transition-colors">
                <Database className="size-4" />
              </div>
              <span>Testes de Escrita</span>
            </Link>

            <Link 
              href="/debug/integration-test" 
              className="group flex flex-col items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-primary transition-colors"
            >
              <div className="size-8 rounded-full bg-slate-50 group-hover:bg-primary/5 flex items-center justify-center transition-colors">
                <ShieldAlert className="size-4" />
              </div>
              <span>Validação de Segurança</span>
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
