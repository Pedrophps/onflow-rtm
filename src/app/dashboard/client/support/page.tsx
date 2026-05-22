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
  Mail, 
  Phone, 
  Clock, 
  ShieldCheck, 
  ExternalLink,
  User,
  Zap,
  Loader2,
  AlertCircle,
  MessageSquareText
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUser, useFirestore, useCollection, useDoc } from "@/firebase";
import { collection, query, where, doc } from "firebase/firestore";
import { useMemo } from "react";
import { OnboardingInstance, UserProfile } from "@/lib/types";
import { StepInteractions } from "@/components/step-interactions";

export default function ClientSupportPage() {
  const { user } = useUser();
  const db = useFirestore();

  const userRef = useMemo(() => (user ? doc(db, "users", user.uid) : null), [user, db]);
  const { data: profile } = useDoc<UserProfile>(userRef);

  const instancesQuery = useMemo(() => 
    user ? query(
      collection(db, "onboardingInstances"),
      where("clientId", "==", user.uid),
      where("status", "==", "active")
    ) : null, 
  [db, user]);

  const { data: instances, loading: instancesLoading } = useCollection<OnboardingInstance>(instancesQuery);

  const activeInstanceForChat = instances.length > 0 ? instances[0] : null;

  return (
    <DashboardLayout role="client">
      <div className="max-w-4xl mx-auto space-y-8 pb-12">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold font-headline text-slate-900 dark:text-white">Central de Suporte RTM</h1>
          <p className="text-muted-foreground">Estamos aqui para garantir a estabilidade da sua infraestrutura financeira.</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="hover:shadow-md hover:border-primary/40 hover:bg-primary/5 transition-all border-2 border-border bg-card group">
            <CardContent className="p-6 flex flex-col items-center text-center space-y-3">
              <div className="size-12 rounded-2xl bg-primary/5 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
                <Mail className="size-6" />
              </div>
              <div className="space-y-1">
                <p className="font-bold text-foreground group-hover:text-primary transition-colors">E-mail Técnico</p>
                <p className="text-xs text-muted-foreground">suporte@rtm.net.br</p>
              </div>
              <Button variant="ghost" className="text-primary font-bold text-xs hover:bg-primary/10 transition-colors" asChild>
                <a href="mailto:suporte@rtm.net.br">Enviar E-mail</a>
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md hover:border-blue-500/40 hover:bg-blue-500/5 transition-all border-2 border-border bg-card group">
            <CardContent className="p-6 flex flex-col items-center text-center space-y-3">
              <div className="size-12 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all">
                <Phone className="size-6" />
              </div>
              <div className="space-y-1">
                <p className="font-bold text-foreground group-hover:text-blue-600 transition-colors">Telefone 24h</p>
                <p className="text-xs text-muted-foreground">0800 123 4567</p>
              </div>
              <Button variant="ghost" className="text-blue-600 font-bold text-xs hover:bg-blue-500/10 transition-colors">
                Ligar Agora
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-bold font-headline flex items-center gap-2">
            <ShieldCheck className="size-5 text-primary" /> Seus Analistas Dedicados
          </h3>
          <div className="grid gap-4">
            {instancesLoading ? (
              <div className="p-8 text-center border rounded-2xl"><Loader2 className="size-6 animate-spin mx-auto text-primary/20" /></div>
            ) : instances.length > 0 ? (
              instances.map((inst) => (
                <Card key={inst.id} className="border-none shadow-sm bg-card overflow-hidden group hover:bg-muted/10 transition-colors">
                  <div className="flex flex-col md:flex-row">
                    <div className="p-6 flex-1 flex items-center gap-4">
                      <div className="size-12 rounded-full border-2 border-primary/10 flex items-center justify-center bg-muted text-muted-foreground group-hover:border-primary transition-colors">
                        <User className="size-6" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">{inst.techName || "Analista a definir"}</p>
                        <p className="text-xs text-muted-foreground">Analista Responsável pela Ativação</p>
                      </div>
                    </div>
                    <div className="p-6 bg-muted/30 group-hover:bg-muted/20 md:w-64 flex flex-col justify-center gap-1 border-l border-border transition-colors">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Produto</p>
                      <div className="flex items-center gap-2">
                        <Zap className="size-3 text-primary" />
                        <span className="text-xs font-bold text-foreground opacity-80">{inst.productName || inst.productId}</span>
                      </div>
                    </div>
                  </div>
                </Card>
              ))
            ) : (
              <div className="p-8 text-center border-2 border-dashed rounded-3xl space-y-2 bg-card">
                <AlertCircle className="size-8 mx-auto text-muted-foreground/20" />
                <p className="text-sm text-muted-foreground">Nenhuma ativação técnica em curso com analista atribuído.</p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-bold font-headline flex items-center gap-2">
            <MessageSquareText className="size-5 text-primary" /> Chat de Suporte OnFlow
          </h3>
          {activeInstanceForChat ? (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
              <StepInteractions 
                instanceId={activeInstanceForChat.id!}
                stepId="general_support"
                clientId={user?.uid || ""}
                canInteract={true}
                userName={profile?.displayName}
                userRole="cliente"
              />
              <p className="mt-2 text-[10px] text-muted-foreground text-center font-bold uppercase tracking-widest">
                Conectado ao suporte de {activeInstanceForChat.productName || activeInstanceForChat.productId}
              </p>
            </div>
          ) : (
            <Card className="p-12 text-center border-2 border-dashed bg-muted/20">
              <MessageSquareText className="size-12 mx-auto text-muted-foreground/20 mb-4" />
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                O chat em tempo real fica disponível automaticamente assim que uma jornada de ativação técnica for iniciada.
              </p>
            </Card>
          )}
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-bold font-headline flex items-center gap-2">
            <Clock className="size-5 text-primary" /> Dúvidas Frequentes (FAQ)
          </h3>
          <Card className="border-none shadow-xl bg-card p-6 rounded-3xl">
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1" className="border-border">
                <AccordionTrigger className="text-left font-bold text-foreground opacity-80 hover:text-primary transition-colors hover:no-underline">
                  Qual o SLA médio de ativação técnica?
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground leading-relaxed">
                  O tempo de ativação varia conforme o produto. Serviços como Mensageria SWIFT possuem SLA médio de 10 dias úteis, enquanto conexões via RSFN podem levar até 15 dias devido a homologações externas.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-2" className="border-border">
                <AccordionTrigger className="text-left font-bold text-foreground opacity-80 hover:text-primary transition-colors hover:no-underline">
                  Como enviar evidências de conformidade?
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground leading-relaxed">
                  Você pode enviar evidências diretamente na aba "Ativações", selecionando a etapa atual da sua jornada e utilizando o ícone de anexo no log de interação.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-3" className="border-border">
                <AccordionTrigger className="text-left font-bold text-foreground opacity-80 hover:text-primary transition-colors hover:no-underline">
                  Onde encontro os manuais de conectividade?
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground leading-relaxed">
                  Todos os guias técnicos, diagramas de rede e termos de uso estão disponíveis na aba "Documentos" do seu portal OnFlow.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </Card>
        </div>

        <div className="bg-slate-900 rounded-3xl p-8 text-white flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden relative group">
          <div className="space-y-2 relative z-10">
            <h4 className="text-xl font-bold font-headline group-hover:text-primary transition-colors">Precisa de consultoria especializada?</h4>
            <p className="text-sm text-slate-400 max-w-md">Nossos arquitetos de rede podem ajudar no desenho da sua topologia crítica para máxima resiliência.</p>
          </div>
          <Button variant="secondary" className="rounded-full px-8 font-bold gap-2 relative z-10 hover:scale-105 transition-transform">
            Agendar Reunião <ExternalLink className="size-4" />
          </Button>
          <div className="absolute top-0 right-0 size-64 bg-primary/20 blur-3xl rounded-full -mr-32 -mt-32 group-hover:bg-primary/30 transition-all duration-700"></div>
        </div>
      </div>
    </DashboardLayout>
  );
}
