"use client";

import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from "@/components/ui/accordion";
import { 
  Headset, 
  Mail, 
  Phone, 
  Clock, 
  ShieldCheck, 
  ExternalLink,
  User,
  Zap,
  Loader2,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUser, useFirestore, useCollection } from "@/firebase";
import { collection, query, where } from "firebase/firestore";
import { useMemo } from "react";
import { OnboardingInstance } from "@/lib/types";
import { Badge } from "@/components/ui/badge";

export default function ClientSupportPage() {
  const { user } = useUser();
  const db = useFirestore();

  // Buscar instâncias para mostrar os analistas responsáveis
  const instancesQuery = useMemo(() => 
    user ? query(
      collection(db, "onboardingInstances"),
      where("clientId", "==", user.uid),
      where("status", "==", "active")
    ) : null, 
  [db, user]);

  const { data: instances, loading: instancesLoading } = useCollection<OnboardingInstance>(instancesQuery);

  return (
    <DashboardLayout role="client">
      <div className="max-w-4xl mx-auto space-y-8 pb-12">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold font-headline text-slate-900">Central de Suporte RTM</h1>
          <p className="text-muted-foreground">Estamos aqui para garantir a estabilidade da sua infraestrutura financeira.</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="hover:shadow-md transition-all border-2 border-slate-100">
            <CardContent className="p-6 flex flex-col items-center text-center space-y-3">
              <div className="size-12 rounded-2xl bg-primary/5 flex items-center justify-center text-primary">
                <Mail className="size-6" />
              </div>
              <div className="space-y-1">
                <p className="font-bold text-slate-900">E-mail Técnico</p>
                <p className="text-xs text-muted-foreground">suporte@rtm.net.br</p>
              </div>
              <Button variant="ghost" className="text-primary font-bold text-xs" asChild>
                <a href="mailto:suporte@rtm.net.br">Enviar E-mail</a>
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-all border-2 border-slate-100">
            <CardContent className="p-6 flex flex-col items-center text-center space-y-3">
              <div className="size-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
                <Phone className="size-6" />
              </div>
              <div className="space-y-1">
                <p className="font-bold text-slate-900">Telefone 24h</p>
                <p className="text-xs text-muted-foreground">0800 123 4567</p>
              </div>
              <Button variant="ghost" className="text-blue-600 font-bold text-xs">
                Ligar Agora
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Analistas Responsáveis */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold font-headline flex items-center gap-2">
            <ShieldCheck className="size-5 text-primary" /> Seus Analistas Dedicados
          </h3>
          <div className="grid gap-4">
            {instancesLoading ? (
              <div className="p-8 text-center border rounded-2xl"><Loader2 className="size-6 animate-spin mx-auto text-primary/20" /></div>
            ) : instances.length > 0 ? (
              instances.map((inst) => (
                <Card key={inst.id} className="border-none shadow-sm bg-white overflow-hidden group">
                  <div className="flex flex-col md:flex-row">
                    <div className="p-6 flex-1 flex items-center gap-4">
                      <div className="size-12 rounded-full border-2 border-primary/10 flex items-center justify-center bg-slate-50 text-slate-400">
                        <User className="size-6" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">{inst.techName || "Analista a definir"}</p>
                        <p className="text-xs text-muted-foreground">Analista Responsável pela Ativação</p>
                      </div>
                    </div>
                    <div className="p-6 bg-slate-50 md:w-64 flex flex-col justify-center gap-1 border-l">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Produto</p>
                      <div className="flex items-center gap-2">
                        <Zap className="size-3 text-primary" />
                        <span className="text-xs font-bold text-slate-700">{inst.productName || inst.productId}</span>
                      </div>
                    </div>
                  </div>
                </Card>
              ))
            ) : (
              <div className="p-8 text-center border-2 border-dashed rounded-3xl space-y-2">
                <AlertCircle className="size-8 mx-auto text-slate-200" />
                <p className="text-sm text-muted-foreground">Nenhuma ativação técnica em curso com analista atribuído.</p>
              </div>
            )}
          </div>
        </div>

        {/* FAQ Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold font-headline flex items-center gap-2">
            <Clock className="size-5 text-primary" /> Dúvidas Frequentes (FAQ)
          </h3>
          <Card className="border-none shadow-xl bg-white p-6 rounded-3xl">
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger className="text-left font-bold text-slate-700 hover:text-primary transition-colors">
                  Qual o SLA médio de ativação técnica?
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground leading-relaxed">
                  O tempo de ativação varia conforme o produto. Serviços como Mensageria SWIFT possuem SLA médio de 10 dias úteis, enquanto conexões via RSFN podem levar até 15 dias devido a homologações externas.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-2">
                <AccordionTrigger className="text-left font-bold text-slate-700 hover:text-primary transition-colors">
                  Como enviar evidências de conformidade?
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground leading-relaxed">
                  Você pode enviar evidências diretamente na aba "Ativações", selecionando a etapa atual da sua jornada e utilizando o ícone de anexo no log de interação.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-3">
                <AccordionTrigger className="text-left font-bold text-slate-700 hover:text-primary transition-colors">
                  Onde encontro os manuais de conectividade?
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground leading-relaxed">
                  Todos os guias técnicos, diagramas de rede e termos de uso estão disponíveis na aba "Documentos" do seu portal OnFlow.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-4">
                <AccordionTrigger className="text-left font-bold text-slate-700 hover:text-primary transition-colors">
                  Meu acesso foi bloqueado, o que fazer?
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground leading-relaxed">
                  Bloqueios podem ocorrer por pendências documentais ou falhas de segurança. Entre em contato imediatamente com nossa central 24h pelo telefone 0800 123 4567 para desbloqueio imediato.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </Card>
        </div>

        <div className="bg-slate-900 rounded-3xl p-8 text-white flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden relative">
          <div className="space-y-2 relative z-10">
            <h4 className="text-xl font-bold font-headline">Precisa de consultoria especializada?</h4>
            <p className="text-sm text-slate-400 max-w-md">Nossos arquitetos de rede podem ajudar no desenho da sua topologia crítica para máxima resiliência.</p>
          </div>
          <Button variant="secondary" className="rounded-full px-8 font-bold gap-2 relative z-10">
            Agendar Reunião <ExternalLink className="size-4" />
          </Button>
          <div className="absolute top-0 right-0 size-64 bg-primary/20 blur-3xl rounded-full -mr-32 -mt-32"></div>
        </div>
      </div>
    </DashboardLayout>
  );
}