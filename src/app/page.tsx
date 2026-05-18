
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
  Terminal,
  Mail,
  Zap,
  Server,
  Shield
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
  const serviceImage = PlaceHolderImages.find(img => img.id === 'rtm-integration');

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

            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden">
                  <Menu className="size-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                <SheetHeader className="text-left">
                  <SheetTitle className="font-headline text-primary">Navegação</SheetTitle>
                  <SheetDescription>Acesse as principais seções do portal RTM OnFlow.</SheetDescription>
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
              src={heroImage?.imageUrl || "https://picsum.photos/seed/city-skyscrapers/1200/800"} 
              alt={heroImage?.description || "RTM Hub"} 
              fill 
              className="object-cover rounded-3xl shadow-2xl relative z-10"
              data-ai-hint="modern buildings"
            />
          </div>
        </div>
      </section>

      {/* Sobre Section */}
      <section id="sobre" className="py-24 bg-white">
        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="relative h-[400px] rounded-3xl overflow-hidden shadow-2xl">
              <Image 
                src={serviceImage?.imageUrl || "https://picsum.photos/seed/rtm-conn/800/600"}
                alt="RTM Conectividade"
                fill
                className="object-cover"
                data-ai-hint="network connection"
              />
            </div>
            <div className="space-y-6">
              <h2 className="text-4xl font-bold font-headline text-slate-900 tracking-tighter">Uma trajetória de excelência e inovação.</h2>
              <p className="text-slate-600 leading-relaxed text-lg">
                Fundada para ser a espinha dorsal do setor financeiro, a RTM evoluiu de uma provedora de conectividade para um Hub Integrador completo. Hoje, suportamos as maiores instituições do país com segurança, resiliência e baixa latência.
              </p>
              <div className="grid grid-cols-2 gap-6 pt-4">
                <div className="space-y-2">
                  <p className="text-3xl font-black text-primary">500+</p>
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Instituições Conectadas</p>
                </div>
                <div className="space-y-2">
                  <p className="text-3xl font-black text-primary">99.99%</p>
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Uptime Garantido</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Serviços Section */}
      <section id="servicos" className="py-24 bg-slate-50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-4xl font-bold font-headline tracking-tighter text-slate-900">Serviços Críticos</h2>
            <p className="text-slate-600 max-w-2xl mx-auto">Infraestrutura robusta para operações que não podem parar.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <ServiceCard 
              icon={Network} 
              title="Rede RTM" 
              desc="Conectividade privada e segura entre as principais praças financeiras do Brasil." 
            />
            <ServiceCard 
              icon={Zap} 
              title="Mensageria SWIFT" 
              desc="Integração completa com o barramento internacional de pagamentos e câmbio." 
            />
            <ServiceCard 
              icon={Server} 
              title="Cloud RTM" 
              desc="Nuvem híbrida desenhada especificamente para os requisitos de compliance do Bacen." 
            />
          </div>
        </div>
      </section>

      {/* Soluções Section */}
      <section id="solucoes" className="py-24 bg-white">
        <div className="container mx-auto px-6">
          <div className="bg-slate-900 rounded-[3rem] p-12 lg:p-20 text-white relative overflow-hidden">
            <div className="relative z-10 grid lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-8">
                <h2 className="text-5xl font-bold font-headline leading-tight tracking-tighter">Soluções que simplificam o Onboarding.</h2>
                <p className="text-slate-400 text-lg">
                  Com o **OnFlow**, eliminamos a burocracia técnica. Nossa IA processa solicitações de ERP e gera jornadas de ativação automáticas para o seu time de suporte.
                </p>
                <div className="space-y-4">
                  <SolutionItem icon={Shield} text="Segurança e Criptografia de Ponta a Ponta" />
                  <SolutionItem icon={BarChart3} text="Analytics em Tempo Real de Ativações" />
                  <SolutionItem icon={Mail} text="Ingestão Inteligente via E-mail ERP" />
                </div>
                <Button size="lg" className="rounded-full px-10 h-14 bg-white text-slate-900 hover:bg-slate-100 font-bold" asChild>
                  <Link href="/login">Conheça o OnFlow</Link>
                </Button>
              </div>
              <div className="hidden lg:flex justify-center">
                <div className="size-80 rounded-full bg-primary/20 blur-3xl absolute"></div>
                <LayoutDashboard className="size-64 text-primary/40 relative animate-pulse" />
              </div>
            </div>
          </div>
        </div>
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

      {/* Footer Section */}
      <footer className="py-12 border-t bg-white">
        <div className="container mx-auto px-6 text-center space-y-8">
          <div className="space-y-2">
            <p className="font-bold text-primary text-xl">OnFlow by RTM</p>
            <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} RTM - Hub Integrador do Mercado Financeiro.</p>
          </div>

          <div className="pt-8 border-t flex flex-wrap justify-center gap-8">
            <Link href="/debug" className="group flex flex-col items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-amber-600 transition-colors">
              <div className="size-8 rounded-full bg-slate-50 group-hover:bg-amber-50 flex items-center justify-center transition-colors"><Wifi className="size-4" /></div>
              <span>Diagnóstico</span>
            </Link>
            <Link href="/debug/erp-simulator" className="group flex flex-col items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-primary transition-colors">
              <div className="size-8 rounded-full bg-slate-50 group-hover:bg-primary/5 flex items-center justify-center transition-colors"><Mail className="size-4" /></div>
              <span>Simulador ERP</span>
            </Link>
            <Link href="/debug/suite" className="group flex flex-col items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-primary transition-colors">
              <div className="size-8 rounded-full bg-slate-50 group-hover:bg-primary/5 flex items-center justify-center transition-colors"><Terminal className="size-4" /></div>
              <span>Test Suite</span>
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}

function ServiceCard({ icon: Icon, title, desc }: { icon: any, title: string, desc: string }) {
  return (
    <Card className="border-none shadow-sm hover:shadow-xl transition-all group bg-white p-4">
      <CardHeader>
        <div className="size-12 rounded-2xl bg-primary/5 text-primary flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-white transition-colors">
          <Icon className="size-6" />
        </div>
        <CardTitle className="text-xl font-bold font-headline">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-slate-600 text-sm leading-relaxed">{desc}</p>
      </CardContent>
    </Card>
  );
}

function SolutionItem({ icon: Icon, text }: { icon: any, text: string }) {
  return (
    <div className="flex items-center gap-3 text-slate-300">
      <div className="size-6 rounded-full bg-primary/20 flex items-center justify-center text-primary">
        <Icon className="size-3" />
      </div>
      <span className="text-sm font-medium">{text}</span>
    </div>
  );
}
