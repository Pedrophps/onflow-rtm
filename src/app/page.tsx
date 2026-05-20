'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
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
  LayoutGrid, 
  History, 
  Cloud, 
  Layers, 
  Link as LinkIcon, 
  Rocket, 
  Activity, 
  Sun, 
  Moon 
} from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import { HeroBackground } from '@/components/hero-background';

export default function Home() {
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Plugin de Autoplay configurado para 2400ms (20% mais rápido que 3000ms)
  const autoplayPlugin = React.useMemo(
    () => Autoplay({ delay: 2400, stopOnInteraction: false, stopOnMouseEnter: true }),
    []
  );

  const toggleTheme = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    if (newMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  return (
    <main className="min-h-screen bg-white dark:bg-slate-950 selection:bg-primary/10 font-body text-foreground transition-colors duration-500">
      {/* Header Section */}
      <header className="fixed top-0 w-full z-50 bg-white dark:bg-slate-950 border-b border-border/50 shadow-sm">
        <div className="container mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2 font-headline font-bold text-2xl text-primary">
              RTM
              <span className="text-foreground dark:text-white text-sm font-medium tracking-widest uppercase ml-1 opacity-60">OnFlow</span>
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <nav className="hidden lg:flex items-center gap-6 mr-6">
              <a href="#sobre" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Sobre</a>
              <a href="#servicos" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Serviços Críticos</a>
              <a href="#trajetoria" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Trajetória</a>
            </nav>
            
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={toggleTheme} 
                className="rounded-full text-muted-foreground hover:text-primary"
                title={isDarkMode ? "Mudar para Tema Claro" : "Mudar para Tema Escuro"}
              >
                {isDarkMode ? <Sun className="size-5" /> : <Moon className="size-5" />}
              </Button>

              <Button size="sm" className="rounded-full px-6 font-bold text-xs uppercase tracking-wider" asChild>
                <Link href="/login">Acessar Portal</Link>
              </Button>
            </div>

            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden">
                  <Menu className="size-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="bg-card">
                <SheetHeader className="text-left">
                  <SheetTitle className="font-headline text-primary">Menu RTM</SheetTitle>
                </SheetHeader>
                <nav className="flex flex-col gap-6 mt-10">
                  <a href="#sobre" className="text-lg font-bold font-headline">Sobre</a>
                  <a href="#servicos" className="text-lg font-bold font-headline">Serviços Críticos</a>
                  <a href="#trajetoria" className="text-lg font-bold font-headline">Trajetória</a>
                  <button onClick={toggleTheme} className="text-left text-lg font-bold font-headline flex items-center gap-2">
                    {isDarkMode ? <><Sun className="size-5" /> Tema Claro</> : <><Moon className="size-5" /> Tema Escuro</>}
                  </button>
                  <hr />
                  <Link href="/login" className="text-lg font-bold font-headline text-primary">Login</Link>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center bg-transparent overflow-hidden pt-20">
        <HeroBackground />
        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-4xl space-y-8 animate-in fade-in slide-in-from-left duration-700">
            <h1 className="text-5xl lg:text-7xl font-bold tracking-tighter text-slate-900 dark:text-white font-headline leading-tight">
              Somos a <span className="text-primary">RTM.</span><br />
              <span className="text-3xl lg:text-5xl opacity-80 block mt-2 font-medium">O Hub integrador do mercado financeiro.</span>
            </h1>
            <p className="text-xl lg:text-2xl text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl font-light">
              Integramos o mercado financeiro brasileiro. Nossas soluções e ferramentas potencializam os resultados dos nossos clientes.
            </p>
            <div className="flex gap-4">
              <Button size="lg" className="rounded-full px-10 h-14 font-bold gap-2 text-lg shadow-sm" asChild>
                <Link href="/login">Começar Agora <ArrowRight className="size-6" /></Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Sobre Section */}
      <section id="sobre" className="py-32 bg-white dark:bg-slate-950 border-b border-border/50 transition-colors duration-500">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center space-y-8 mb-24 animate-in fade-in slide-in-from-bottom duration-1000">
            <h2 className="text-4xl lg:text-5xl font-bold font-headline text-primary tracking-tight">
              Identificar para integrar. Entender para atender. Conhecer para evoluir.
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-400 leading-relaxed font-medium italic">
              Empresa da ANBIMA e da B3, a RTM é o principal hub integrador do setor financeiro. Atuando como agente neutro de tecnologia, ouve o mercado com propósito de viabilizar o desenvolvimento de soluções que facilitem o dia a dia operacional das instituições.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-20 items-start">
            <div className="space-y-8 text-lg text-slate-600 dark:text-slate-400 leading-relaxed">
              <p>
                Fundada em 1997, como rede de comunicação crítica para o segmento financeiro, a RTM evoluiu de provedora de infraestrutura de telecomunicações para o principal hub integrador do setor no país e hoje conecta mais de 850 instituições, com presença em 21 estados brasileiros.
              </p>
              <p>
                Com a evolução tecnológica e a transformação digital, a oferta de soluções especializadas foi se ampliando e hoje inclui serviços de Data Center, nuvem, cibersegurança, plataforma para indústria de fundos de investimentos, conexão ao Pix, Drex e Open Finance, além de Blockchain as a Service para operações com ativos tokenizados.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-10">
                <div className="p-8 bg-slate-50 dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 text-center hover:border-primary/30 transition-colors">
                  <h4 className="font-black text-primary mb-3 uppercase tracking-tighter text-sm">Propósito</h4>
                  <p className="text-sm font-bold text-slate-900 dark:text-white leading-snug">Promover a evolução do Mercado Financeiro pela Tecnologia</p>
                </div>
                <div className="p-8 bg-slate-50 dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 text-center hover:border-primary/30 transition-colors">
                  <h4 className="font-black text-primary mb-3 uppercase tracking-tighter text-sm">Valores</h4>
                  <p className="text-sm font-bold text-slate-900 dark:text-white leading-snug">Foco no cliente, Desenvolvimento de Pessoas e Equipe, Confiança e Inovação</p>
                </div>
                <div className="p-8 bg-slate-50 dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 text-center hover:border-primary/30 transition-colors">
                  <h4 className="font-black text-primary mb-3 uppercase tracking-tighter text-sm">Posicionamento</h4>
                  <p className="text-sm font-bold text-slate-900 dark:text-white leading-snug">Identificar, Entender, Conhecer</p>
                </div>
              </div>
            </div>

            <div className="bg-slate-900 p-12 rounded-[4rem] text-white space-y-12 relative overflow-hidden group">
               <h3 className="text-3xl font-bold font-headline relative z-10">Nossa Presença</h3>
               <div className="space-y-8 relative z-10">
                <div className="flex items-center gap-6 group-hover:translate-x-2 transition-transform">
                  <div className="size-14 rounded-2xl bg-primary flex items-center justify-center"><MapPin className="text-white size-8" /></div>
                  <div>
                    <p className="text-2xl font-black">20 Estados + DF</p>
                    <p className="text-slate-400 font-medium">Cobertura em todas as 5 regiões do país.</p>
                  </div>
                </div>
                <div className="flex items-center gap-6 group-hover:translate-x-2 transition-transform duration-500">
                  <div className="size-14 rounded-2xl bg-primary flex items-center justify-center"><Building2 className="text-white size-8" /></div>
                  <div>
                    <p className="text-2xl font-black">750+ Instituições</p>
                    <p className="text-slate-400 font-medium">Conectadas com estabilidade, segurança e rapidez.</p>
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-20 -right-20 size-64 bg-primary/10 blur-3xl rounded-full"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Serviços Críticos Section */}
      <section id="servicos" className="py-32 bg-slate-50 dark:bg-slate-900/50 transition-colors duration-500">
        <div className="container mx-auto px-6 text-foreground">
          <div className="text-center mb-20 space-y-4">
            <h2 className="text-5xl font-bold font-headline tracking-tighter text-slate-900 dark:text-white uppercase">Serviços Críticos</h2>
            <div className="h-2 w-24 bg-primary mx-auto rounded-full"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <ServiceCard icon={Network} title="RSFN" desc="Rede do Sistema Financeiro Nacional do SPB em consórcio com a Embratel." />
            <ServiceCard icon={Database} title="NÚCLEA" desc="Sistema de Cessão de Crédito, plataforma de nova cobrança, sistema de liquidação centralizado e cadastro positivo." />
            <ServiceCard icon={TrendingUp} title="B3" desc="Sistema de negociação, compensação, liquidação, depósito e registro para títulos privados." />
            <ServiceCard icon={FileCheck} title="COMPE ABBC" desc="Compensação de cheques por imagem digital." />
            <ServiceCard icon={Lock} title="SELIC" desc="Sistema Especial de Liquidação e Custódia para títulos públicos." />
            <ServiceCard icon={PhoneCall} title="Hotline/Mesa" desc="Serviços de comunicação e negociação para traders. Atualmente com mais de 2 mil linhas privadas conectando o mercado." />
            <ServiceCard icon={Zap} title="SWIFT" desc="Acesso aos serviços SWIFT para remessas e pagamentos internacionais." />
            <ServiceCard icon={Server} title="TECBAN" desc="Movimentação bancária das transações de rede de atendimento 24 horas." />
          </div>
        </div>
      </section>

      {/* Trajetória em Carrossel */}
      <section id="trajetoria" className="py-32 bg-slate-950 text-white overflow-hidden relative">
        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-3xl mb-24 space-y-4 animate-in fade-in slide-in-from-left duration-700">
            <Badge className="bg-primary/20 text-primary border-primary/30 px-4 py-1 uppercase font-black tracking-widest text-[10px]">Nossa Evolução</Badge>
            <h2 className="text-5xl lg:text-6xl font-bold font-headline tracking-tighter">Confira os destaques da nossa trajetória</h2>
            <p className="text-slate-400 text-xl font-light leading-relaxed">
              Temos uma história que reflete a construção de nosso profundo conhecimento técnico e entregas de excelência através das décadas.
            </p>
          </div>
          
          <Carousel 
            opts={{ align: "start", loop: true }} 
            plugins={[autoplayPlugin]}
            className="w-full"
          >
            <CarouselContent className="-ml-4">
              <CarouselItem className="pl-4 md:basis-1/2 lg:basis-1/3 xl:basis-1/4 h-full">
                <FuturisticMilestone year="1997" title="Fundação" text="Nasce a RTM - Rede de Telecomunicações para o Mercado." icon={History} />
              </CarouselItem>
              <CarouselItem className="pl-4 md:basis-1/2 lg:basis-1/3 xl:basis-1/4 h-full">
                <FuturisticMilestone year="2001" title="SPB" text="Implantação da rede do SPB." icon={Network} />
              </CarouselItem>
              <CarouselItem className="pl-4 md:basis-1/2 lg:basis-1/3 xl:basis-1/4 h-full">
                <FuturisticMilestone year="2002" title="Contingência" text="Oferta de Site de Contingência." icon={ShieldCheck} />
              </CarouselItem>
              <CarouselItem className="pl-4 md:basis-1/2 lg:basis-1/3 xl:basis-1/4 h-full">
                <FuturisticMilestone year="2003" title="SWIFT" text="Estrutura para conexão à SWIFT." icon={Zap} />
              </CarouselItem>
              <CarouselItem className="pl-4 md:basis-1/2 lg:basis-1/3 xl:basis-1/4 h-full">
                <FuturisticMilestone year="2011" title="Data Center" text="Data Center para o mercado financeiro." icon={Server} />
              </CarouselItem>
              <CarouselItem className="pl-4 md:basis-1/2 lg:basis-1/3 xl:basis-1/4 h-full">
                <FuturisticMilestone year="2014" title="Cloud" text="Solução de Cloud." icon={Cloud} />
              </CarouselItem>
              <CarouselItem className="pl-4 md:basis-1/2 lg:basis-1/3 xl:basis-1/4 h-full">
                <FuturisticMilestone year="2016" title="Traders" text="Mesa de operações financeiras." icon={PhoneCall} />
              </CarouselItem>
              <CarouselItem className="pl-4 md:basis-1/2 lg:basis-1/3 xl:basis-1/4 h-full">
                <FuturisticMilestone year="2017" title="SaaS" text="1ª solução de SaaS para o mercado de pagamentos." icon={Zap} />
              </CarouselItem>
              <CarouselItem className="pl-4 md:basis-1/2 lg:basis-1/3 xl:basis-1/4 h-full">
                <FuturisticMilestone year="2018" title="Hybrid Cloud" text="Conexão segura com nuvens públicas." icon={Layers} />
              </CarouselItem>
              <CarouselItem className="pl-4 md:basis-1/2 lg:basis-1/3 xl:basis-1/4 h-full">
                <FuturisticMilestone year="2020" title="PIX" text="Soluções de segurança e infraestrutura para o Pix." icon={Zap} />
              </CarouselItem>
              <CarouselItem className="pl-4 md:basis-1/2 lg:basis-1/3 xl:basis-1/4 h-full">
                <FuturisticMilestone year="2022" title="Hub Fundos" text="Lançamento da Plataforma Hub Fundos." icon={LayoutGrid} />
              </CarouselItem>
              <CarouselItem className="pl-4 md:basis-1/2 lg:basis-1/3 xl:basis-1/4 h-full">
                <FuturisticMilestone year="2023" title="Blockchain" text="Infraestrutura de Blockchain para Drex/Tokenização." icon={LinkIcon} />
              </CarouselItem>
              <CarouselItem className="pl-4 md:basis-1/2 lg:basis-1/3 xl:basis-1/4 h-full">
                <FuturisticMilestone year="2024" title="Conciliação" text="Nova funcionalidade do Hub Pagamentos para conciliação de vendas." icon={Activity} />
              </CarouselItem>
              <CarouselItem className="pl-4 md:basis-1/2 lg:basis-1/3 xl:basis-1/4 h-full">
                <FuturisticMilestone year="2025" title="Expansão" text="Aquisição da Galgo S.A. e expansão dos serviços para a indústria de fundos." icon={Rocket} isHighlight />
              </CarouselItem>
            </CarouselContent>
            <div className="flex justify-end gap-4 mt-12">
              <CarouselPrevious className="static translate-y-0 size-14 border-2 border-primary/20 bg-slate-900 text-white hover:bg-primary transition-all rounded-2xl" />
              <CarouselNext className="static translate-y-0 size-14 border-2 border-primary/20 bg-slate-900 text-white hover:bg-primary transition-all rounded-2xl" />
            </div>
          </Carousel>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 border-t bg-white dark:bg-slate-950 transition-colors duration-500">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-12">
            <div className="space-y-4 text-center md:text-left">
              <p className="font-headline font-black text-primary text-3xl tracking-tighter">OnFlow <span className="text-slate-300 dark:text-slate-800">by RTM</span></p>
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
    <Card className="border-none hover:shadow-lg transition-all group bg-white dark:bg-slate-900 p-2 rounded-[2rem] hover:-translate-y-2 duration-300">
      <CardHeader className="pb-4">
        <div className="size-14 rounded-2xl bg-slate-50 dark:bg-slate-800 text-primary flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-white transition-all">
          <Icon className="size-7" />
        </div>
        <CardTitle className="text-xl font-bold font-headline text-slate-900 dark:text-white group-hover:text-primary transition-colors tracking-tight">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed font-medium">{desc}</p>
      </CardContent>
    </Card>
  );
}

function FuturisticMilestone({ year, title, text, icon: Icon, isHighlight = false }: any) {
  return (
    <div className={`relative group p-6 rounded-3xl border transition-all duration-500 overflow-hidden h-full min-h-[280px] flex flex-col justify-between hover:scale-[1.02] ${
      isHighlight ? "bg-primary/10 border-primary/40 shadow-sm" : "bg-slate-900/50 border-slate-800 hover:border-primary/50 hover:bg-slate-900"
    }`}>
      <div className="relative z-10 space-y-4">
        <div className="flex items-center justify-between">
          <span className={`text-3xl font-black font-headline tracking-tighter ${isHighlight ? "text-primary" : "text-slate-600 group-hover:text-primary"}`}>{year}</span>
          <div className={`size-10 rounded-xl flex items-center justify-center transition-all ${isHighlight ? "bg-primary text-white" : "bg-slate-800 text-slate-400 group-hover:text-primary"}`}>
            <Icon className="size-5" />
          </div>
        </div>
        <div className="space-y-1">
          <h3 className="text-lg font-bold font-headline text-white group-hover:text-primary transition-colors">{title}</h3>
          <p className="text-slate-400 text-xs leading-relaxed font-medium group-hover:text-slate-200 line-clamp-3">{text}</p>
        </div>
      </div>
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
    </div>
  );
}
