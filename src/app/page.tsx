'use client';

import * as React from 'react';
import { useState } from 'react';
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

  const autoplayPlugin = React.useMemo(
    () => Autoplay({ delay: 3000, stopOnInteraction: false, stopOnMouseEnter: true }),
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
    <main className="min-h-screen bg-background font-body text-foreground transition-colors duration-500">
      {/* Header Section */}
      <header className="fixed top-0 w-full z-50 bg-background/90 backdrop-blur-sm border-b border-border">
        <div className="container mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2 font-headline font-light text-2xl text-primary">
              RTM
              <span className="text-foreground dark:text-white text-xs font-medium tracking-[0.3em] uppercase ml-2 opacity-40">OnFlow</span>
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <nav className="hidden lg:flex items-center gap-8 mr-8">
              <a href="#sobre" className="text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors">Sobre</a>
              <a href="#servicos" className="text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors">Serviços Críticos</a>
              <a href="#trajetoria" className="text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors">Trajetória</a>
            </nav>
            
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={toggleTheme} 
                className="rounded-full text-muted-foreground hover:text-primary hover:bg-muted transition-all"
              >
                {isDarkMode ? <Sun className="size-4" /> : <Moon className="size-4" />}
              </Button>

              <Button size="sm" className="rounded-full px-8 font-bold text-[10px] uppercase tracking-[0.2em]" asChild>
                <Link href="/login">Acessar Portal</Link>
              </Button>
            </div>

            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden">
                  <Menu className="size-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="bg-card">
                <SheetHeader className="text-left">
                  <SheetTitle className="font-headline font-light text-primary text-2xl">Menu RTM</SheetTitle>
                </SheetHeader>
                <nav className="flex flex-col gap-8 mt-12">
                  <a href="#sobre" className="text-sm font-bold uppercase tracking-widest hover:text-primary transition-colors">Sobre</a>
                  <a href="#servicos" className="text-sm font-bold uppercase tracking-widest hover:text-primary transition-colors">Serviços Críticos</a>
                  <a href="#trajetoria" className="text-sm font-bold uppercase tracking-widest hover:text-primary transition-colors">Trajetória</a>
                  <hr className="border-border" />
                  <Link href="/login" className="text-sm font-bold uppercase tracking-[0.2em] text-primary">Login</Link>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center overflow-hidden pt-20 bg-white dark:bg-slate-950">
        <HeroBackground />
        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-4xl space-y-10 animate-in fade-in slide-in-from-left duration-1000">
            <h1 className="text-6xl lg:text-8xl font-light tracking-tighter text-slate-900 dark:text-white font-headline leading-[0.9]">
              Somos a <span className="text-primary font-normal">RTM.</span><br />
              <span className="text-2xl lg:text-4xl opacity-50 block mt-6 font-light tracking-tight">O Hub integrador do mercado financeiro.</span>
            </h1>
            <p className="text-lg lg:text-xl text-muted-foreground leading-relaxed max-w-2xl font-light italic">
              "Estimular a evolução através do conhecimento." — Nosso propósito em cada conexão.
            </p>
            <div className="flex gap-6">
              <Button size="lg" className="rounded-full px-12 h-16 font-bold gap-3 text-sm uppercase tracking-widest hover:scale-105 transition-all duration-300" asChild>
                <Link href="/login">Começar Agora <ArrowRight className="size-5" /></Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Sobre Section */}
      <section id="sobre" className="py-32 bg-white dark:bg-slate-950 border-y border-border">
        <div className="container mx-auto px-6">
          <div className="max-w-5xl mx-auto text-center space-y-10 mb-32">
            <h2 className="text-4xl lg:text-6xl font-light font-headline text-primary tracking-tighter leading-none">
              Entender para integrar.<br />
              Entender para atender.
            </h2>
            <div className="h-1 w-20 bg-primary/20 mx-auto rounded-full"></div>
            <p className="text-xl text-muted-foreground leading-relaxed font-light max-w-3xl mx-auto">
              Empresa da ANBIMA e da B3, a RTM é o principal hub integrador do setor financeiro. Atuando como agente neutro de tecnologia, potencializamos o ecossistema com inteligência e segurança.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <ValueCard 
              label="Propósito" 
              title="Estimular a evolução através do conhecimento" 
              desc="Nossa razão de ser e o que nos guia em cada projeto."
            />
            <ValueCard 
              label="Valores" 
              title="Conhecimento, Inteligência e Certeza" 
              desc="Direcionamos o discurso e defendemos a precisão técnica."
            />
            <ValueCard 
              label="Posicionamento" 
              title="Entender para Evoluir" 
              desc="Identificar, entender e conhecer para transformar o mercado."
            />
          </div>
        </div>
      </section>

      {/* Serviços Críticos Section */}
      <section id="servicos" className="py-32 bg-muted/30">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-20 gap-8">
            <div className="space-y-4">
              <Badge className="bg-primary/10 text-primary border-primary/20 px-4 py-1 uppercase font-bold tracking-[0.2em] text-[10px]">Infraestrutura de Elite</Badge>
              <h2 className="text-5xl font-light font-headline tracking-tighter text-slate-900 dark:text-white uppercase">Serviços Críticos</h2>
            </div>
            <p className="text-muted-foreground max-w-md text-sm font-light leading-relaxed border-l-2 border-primary/20 pl-6">
              Nossa força é nossa inteligência e know-how. Revelamos o que está "debaixo do capô" para garantir operações ininterruptas.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <ServiceCard icon={Network} title="RSFN" desc="Rede do Sistema Financeiro Nacional do SPB." />
            <ServiceCard icon={Database} title="NÚCLEA" desc="Plataformas de liquidação e cadastro positivo." />
            <ServiceCard icon={TrendingUp} title="B3" desc="Sistemas de negociação, compensação e depósito." />
            <ServiceCard icon={FileCheck} title="COMPE ABBC" desc="Compensação de cheques por imagem digital." />
            <ServiceCard icon={Lock} title="SELIC" desc="Liquidação e Custódia para títulos públicos." />
            <ServiceCard icon={PhoneCall} title="Mesa de Voz" desc="Comunicação crítica para negociação (Traders)." />
            <ServiceCard icon={Zap} title="SWIFT" desc="Conectividade internacional e mensageria global." />
            <ServiceCard icon={Server} title="TECBAN" desc="Movimentação das transações de rede 24 horas." />
          </div>
        </div>
      </section>

      {/* Trajetória Section */}
      <section id="trajetoria" className="py-32 bg-white dark:bg-slate-950 overflow-hidden">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mb-20 space-y-6">
            <div className="flex items-center gap-4 text-primary">
              <History className="size-6" />
              <span className="text-xs font-bold uppercase tracking-[0.3em]">Nossa Trajetória</span>
            </div>
            <h2 className="text-5xl lg:text-7xl font-light font-headline tracking-tighter text-slate-900 dark:text-white">Confira nossa evolução através das décadas</h2>
          </div>
          
          <Carousel 
            opts={{ align: "start", loop: true }} 
            plugins={[autoplayPlugin]}
            className="w-full"
          >
            <CarouselContent className="-ml-4 py-8">
              <CarouselItem className="pl-4 md:basis-1/2 lg:basis-1/3 xl:basis-1/4">
                <Milestone year="1997" title="Fundação" text="Nasce a RTM - Rede de Telecomunicações para o Mercado." icon={History} />
              </CarouselItem>
              <CarouselItem className="pl-4 md:basis-1/2 lg:basis-1/3 xl:basis-1/4">
                <Milestone year="2003" title="SWIFT" text="Estrutura homologada para conexão à SWIFT." icon={Zap} />
              </CarouselItem>
              <CarouselItem className="pl-4 md:basis-1/2 lg:basis-1/3 xl:basis-1/4">
                <Milestone year="2011" title="Data Center" text="Lançamento do Data Center especializado." icon={Server} />
              </CarouselItem>
              <CarouselItem className="pl-4 md:basis-1/2 lg:basis-1/3 xl:basis-1/4">
                <Milestone year="2020" title="PIX" text="Soluções críticas para o ecossistema de pagamentos instantâneos." icon={Zap} />
              </CarouselItem>
              <CarouselItem className="pl-4 md:basis-1/2 lg:basis-1/3 xl:basis-1/4">
                <Milestone year="2025" title="Expansão" text="Consolidação como o maior Hub Integrador do setor." icon={Rocket} isHighlight />
              </CarouselItem>
            </CarouselContent>
            <div className="flex justify-end gap-3 mt-12">
              <CarouselPrevious className="static translate-y-0 size-12 border border-border bg-white text-foreground hover:bg-muted transition-all rounded-full" />
              <CarouselNext className="static translate-y-0 size-12 border border-border bg-white text-foreground hover:bg-muted transition-all rounded-full" />
            </div>
          </Carousel>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 border-t border-border bg-muted/10">
        <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-10">
          <div className="space-y-2 text-center md:text-left">
            <p className="font-headline font-light text-primary text-3xl tracking-tighter">OnFlow <span className="text-muted-foreground opacity-30">by RTM</span></p>
            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-[0.2em] italic">© {new Date().getFullYear()} RTM - Identificar para integrar.</p>
          </div>
          <div className="flex gap-8 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
             <a href="#" className="hover:text-primary transition-colors">Termos de Uso</a>
             <a href="#" className="hover:text-primary transition-colors">Privacidade</a>
             <a href="#" className="hover:text-primary transition-colors">Suporte</a>
          </div>
        </div>
      </footer>
    </main>
  );
}

function ValueCard({ label, title, desc }: any) {
  return (
    <div className="p-10 bg-white dark:bg-slate-900 rounded-lg border border-border flex flex-col justify-between hover:border-primary transition-all group min-h-[300px]">
      <div className="space-y-4">
        <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-primary">{label}</span>
        <h4 className="text-2xl font-light font-headline text-foreground leading-tight">{title}</h4>
      </div>
      <p className="text-sm text-muted-foreground font-light leading-relaxed group-hover:text-foreground transition-colors">{desc}</p>
    </div>
  );
}

function ServiceCard({ icon: Icon, title, desc }: any) {
  return (
    <Card className="border border-border hover:border-primary transition-all duration-300 group bg-card p-2 rounded-lg shadow-sm">
      <CardHeader className="pb-4">
        <div className="size-12 rounded-md bg-muted dark:bg-slate-800 text-primary flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-white transition-all duration-300">
          <Icon className="size-6 stroke-[1.5]" />
        </div>
        <CardTitle className="text-xl font-light font-headline tracking-tight group-hover:text-primary transition-colors">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground text-sm leading-relaxed font-light line-clamp-3">{desc}</p>
      </CardContent>
    </Card>
  );
}

function Milestone({ year, title, text, icon: Icon, isHighlight = false }: any) {
  return (
    <div className={`relative p-8 rounded-lg border transition-all duration-500 h-full min-h-[260px] flex flex-col justify-between ${
      isHighlight 
        ? "bg-primary text-white border-primary shadow-sm" 
        : "bg-white dark:bg-slate-900 border-border hover:border-primary"
    }`}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className={`text-4xl font-light font-headline tracking-tighter ${isHighlight ? "text-white" : "text-primary/30 group-hover:text-primary"}`}>{year}</span>
          <Icon className={`size-5 stroke-[1.5] ${isHighlight ? "text-white/60" : "text-muted-foreground"}`} />
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-normal font-headline uppercase tracking-widest">{title}</h3>
          <p className={`text-xs leading-relaxed font-light ${isHighlight ? "text-white/80" : "text-muted-foreground"}`}>{text}</p>
        </div>
      </div>
    </div>
  );
}
