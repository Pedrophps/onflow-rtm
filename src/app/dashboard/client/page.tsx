
"use client";

import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { StatusBadge } from "@/components/status-badge";
import { OnboardingStage } from "@/lib/types";
import { CheckCircle2, ChevronDown, ChevronUp, FileUp, MessageSquare, Send } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const initialStages: OnboardingStage[] = [
  {
    id: "1",
    title: "Boas Vindas e Cadastro",
    description: "Inicie sua jornada conosco completando seu cadastro básico.",
    order: 1,
    status: "concluida",
    requirements: [
      { type: "text", label: "Nome da Empresa" }
    ]
  },
  {
    id: "2",
    title: "Documentação Contratual",
    description: "Por favor, envie o contrato assinado e o documento de identificação.",
    order: 2,
    status: "em_revisao",
    requirements: [
      { type: "file", label: "Contrato Assinado (PDF)" },
      { type: "file", label: "Documento de Identidade" }
    ]
  },
  {
    id: "3",
    title: "Configuração de Perfil",
    description: "Personalize sua experiência enviando sua logo e cores da marca.",
    order: 3,
    status: "pendente",
    requirements: [
      { type: "file", label: "Logotipo (PNG/SVG)" },
      { type: "text", label: "Código Hex da Cor Principal" }
    ]
  },
  {
    id: "4",
    title: "Treinamento Inicial",
    description: "Assista ao vídeo de introdução e agende sua primeira call.",
    order: 4,
    status: "pendente",
    requirements: [
      { type: "text", label: "Data Preferencial para Call" }
    ]
  }
];

export default function ClientPage() {
  const [stages] = useState<OnboardingStage[]>(initialStages);
  const [expandedStage, setExpandedStage] = useState<string | null>("2");

  const completedCount = stages.filter(s => s.status === 'concluida').length;
  const progress = (completedCount / stages.length) * 100;

  return (
    <DashboardLayout role="client">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="bg-white rounded-2xl p-8 shadow-sm border space-y-4">
          <div className="flex justify-between items-end">
            <div>
              <h1 className="text-2xl font-bold font-headline">Olá, João! 👋</h1>
              <p className="text-muted-foreground">Bem-vindo à sua jornada de onboarding no OnFlow.</p>
            </div>
            <div className="text-right">
              <span className="text-3xl font-bold text-primary">{Math.round(progress)}%</span>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Concluído</p>
            </div>
          </div>
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between text-xs text-muted-foreground font-medium">
            <span>{completedCount} de {stages.length} etapas concluídas</span>
            <span>Próxima etapa: Documentação Contratual</span>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-bold font-headline flex items-center gap-2">
            Sua Jornada
          </h2>
          
          <div className="relative pl-8 space-y-6 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-border">
            {stages.map((stage) => {
              const isExpanded = expandedStage === stage.id;
              const isCompleted = stage.status === 'concluida';
              const isPendente = stage.status === 'pendente';

              return (
                <div key={stage.id} className="relative">
                  <div className={cn(
                    "absolute -left-[29px] top-1 size-6 rounded-full border-2 flex items-center justify-center transition-colors z-10 bg-background",
                    isCompleted ? "border-emerald-500 bg-emerald-500 text-white" : 
                    stage.status === 'em_revisao' ? "border-amber-500 bg-amber-500 text-white" : "border-border text-muted-foreground"
                  )}>
                    {isCompleted ? <CheckCircle2 className="size-3.5" /> : <span className="text-[10px] font-bold">{stage.order}</span>}
                  </div>

                  <Card className={cn(
                    "transition-all duration-300",
                    isExpanded ? "ring-2 ring-primary/10 shadow-md" : "hover:border-primary/50"
                  )}>
                    <CardHeader 
                      className="cursor-pointer p-4 flex flex-row items-center justify-between space-y-0"
                      onClick={() => setExpandedStage(isExpanded ? null : stage.id)}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <CardTitle className="text-base font-semibold">{stage.title}</CardTitle>
                          <StatusBadge status={stage.status} />
                        </div>
                        <CardDescription className="text-sm mt-1">{stage.description}</CardDescription>
                      </div>
                      {isExpanded ? <ChevronUp className="size-5 text-muted-foreground" /> : <ChevronDown className="size-5 text-muted-foreground" />}
                    </CardHeader>

                    {isExpanded && (
                      <CardContent className="p-4 pt-0 border-t bg-muted/5 animate-in slide-in-from-top-2 duration-300">
                        <div className="mt-4 space-y-4">
                          {stage.requirements?.map((req, idx) => (
                            <div key={idx} className="space-y-2">
                              <Label className="text-sm font-semibold">{req.label}</Label>
                              {req.type === 'file' ? (
                                <div className="border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center bg-white group hover:border-primary transition-colors cursor-pointer">
                                  <div className="size-10 rounded-full bg-primary/5 flex items-center justify-center text-primary group-hover:scale-110 transition-transform mb-2">
                                    <FileUp className="size-5" />
                                  </div>
                                  <p className="text-sm font-medium">Clique para fazer upload</p>
                                  <p className="text-xs text-muted-foreground mt-1">PDF, JPG ou PNG até 10MB</p>
                                </div>
                              ) : (
                                <Input placeholder={`Digite ${req.label.toLowerCase()}...`} className="bg-white" />
                              )}
                            </div>
                          ))}
                          
                          <div className="flex justify-end gap-3 pt-2">
                            <Button variant="outline" size="sm">Salvar Rascunho</Button>
                            <Button size="sm" className="gap-2">
                              Enviar para Revisão <Send className="size-3.5" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    )}
                  </Card>
                </div>
              );
            })}
          </div>
        </div>

        <Card className="bg-primary text-white overflow-hidden border-none shadow-xl">
          <CardContent className="p-8 relative">
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="space-y-2 text-center md:text-left">
                <h3 className="text-2xl font-bold font-headline">Precisa de ajuda?</h3>
                <p className="text-primary-foreground/90 max-w-md">
                  Nossa equipe está pronta para te auxiliar em qualquer etapa do seu onboarding.
                </p>
              </div>
              <Button size="lg" variant="secondary" className="bg-white text-primary hover:bg-white/90 gap-2 px-8 rounded-full font-bold">
                <MessageSquare className="size-5" /> Falar com Suporte
              </Button>
            </div>
            <div className="absolute top-0 right-0 size-64 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl pointer-events-none" />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
