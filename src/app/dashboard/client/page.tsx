
"use client";

import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { StatusBadge } from "@/components/status-badge";
import { OnboardingStage } from "@/lib/types";
import { CheckCircle2, ChevronDown, ChevronUp, FileUp, MessageSquare, Send, Clock, ShieldAlert } from "lucide-react";
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUser, useFirestore, useDoc } from "@/firebase";
import { doc } from "firebase/firestore";
import { cn } from "@/lib/utils";

const initialStages: OnboardingStage[] = [
  {
    id: "1",
    title: "Boas Vindas e Cadastro",
    description: "Inicie sua jornada conosco completando seu cadastro básico.",
    order: 1,
    status: "concluida",
    requirements: [{ type: "text", label: "Nome da Empresa" }]
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
  }
];

export default function ClientPage() {
  const { user } = useUser();
  const db = useFirestore();
  const userRef = useMemo(() => (user ? doc(db, "users", user.uid) : null), [user, db]);
  const { data: profile, loading } = useDoc<any>(userRef);
  
  const [expandedStage, setExpandedStage] = useState<string | null>("2");

  if (loading) return null;

  // Se o cliente ainda não foi aprovado pelo comercial
  if (profile?.status === 'pending') {
    return (
      <DashboardLayout role="client">
        <div className="max-w-2xl mx-auto mt-20 text-center space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="size-24 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 mx-auto">
            <Clock className="size-12" />
          </div>
          <div className="space-y-4">
            <h1 className="text-3xl font-bold font-headline">Aguardando Validação Comercial</h1>
            <p className="text-muted-foreground text-lg">
              Olá, <span className="font-bold text-foreground">{profile.displayName}</span>. Recebemos seu cadastro! 
              Nossa equipe comercial está validando seus dados e em breve liberaremos seu acesso ao fluxo de integração.
            </p>
          </div>
          <Card className="bg-muted/50 border-dashed">
            <CardContent className="p-6 flex items-start gap-4 text-left">
              <ShieldAlert className="size-6 text-amber-600 shrink-0 mt-1" />
              <div>
                <p className="text-sm font-semibold">O que acontece agora?</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Um consultor RTM analisará o CNPJ informado e atribuirá seu código de cliente e o produto contratado. 
                  Você receberá uma notificação assim que puder prosseguir.
                </p>
              </div>
            </CardContent>
          </Card>
          <Button variant="outline" onClick={() => window.location.reload()}>Atualizar Status</Button>
        </div>
      </DashboardLayout>
    );
  }

  const completedCount = initialStages.filter(s => s.status === 'concluida').length;
  const progress = (completedCount / initialStages.length) * 100;

  return (
    <DashboardLayout role="client">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="bg-white rounded-2xl p-8 shadow-sm border space-y-4">
          <div className="flex justify-between items-end">
            <div>
              <h1 className="text-2xl font-bold font-headline">Olá, {profile?.displayName?.split(' ')[0]}! 👋</h1>
              <p className="text-muted-foreground">Bem-vindo à sua jornada de onboarding no OnFlow.</p>
              {profile?.clientCode && (
                <div className="mt-2 inline-flex items-center gap-2 px-2 py-1 rounded bg-primary/5 text-[10px] font-bold text-primary uppercase">
                  Código: {profile.clientCode} | Produto: {profile.activeProduct}
                </div>
              )}
            </div>
            <div className="text-right">
              <span className="text-3xl font-bold text-primary">{Math.round(progress)}%</span>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Concluído</p>
            </div>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-bold font-headline flex items-center gap-2">Sua Jornada</h2>
          <div className="relative pl-8 space-y-6 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-border">
            {initialStages.map((stage) => (
              <div key={stage.id} className="relative">
                <div className={cn(
                  "absolute -left-[29px] top-1 size-6 rounded-full border-2 flex items-center justify-center transition-colors z-10 bg-background",
                  stage.status === 'concluida' ? "border-emerald-500 bg-emerald-500 text-white" : "border-border text-muted-foreground"
                )}>
                  {stage.status === 'concluida' ? <CheckCircle2 className="size-3.5" /> : <span className="text-[10px] font-bold">{stage.order}</span>}
                </div>
                <Card className={cn("transition-all", expandedStage === stage.id ? "ring-2 ring-primary/10 shadow-md" : "hover:border-primary/50")}>
                  <CardHeader 
                    className="cursor-pointer p-4 flex flex-row items-center justify-between space-y-0"
                    onClick={() => setExpandedStage(expandedStage === stage.id ? null : stage.id)}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <CardTitle className="text-base font-semibold">{stage.title}</CardTitle>
                        <StatusBadge status={stage.status} />
                      </div>
                      <CardDescription className="text-sm mt-1">{stage.description}</CardDescription>
                    </div>
                    {expandedStage === stage.id ? <ChevronUp className="size-5 text-muted-foreground" /> : <ChevronDown className="size-5 text-muted-foreground" />}
                  </CardHeader>
                  {expandedStage === stage.id && (
                    <CardContent className="p-4 pt-0 border-t bg-muted/5">
                      <div className="mt-4 space-y-4">
                        {stage.requirements?.map((req, idx) => (
                          <div key={idx} className="space-y-2">
                            <Label className="text-sm font-semibold">{req.label}</Label>
                            {req.type === 'file' ? (
                              <div className="border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center bg-white group hover:border-primary cursor-pointer">
                                <FileUp className="size-5 mb-2 text-primary" />
                                <p className="text-sm font-medium">Clique para fazer upload</p>
                              </div>
                            ) : (
                              <Input placeholder={`Digite ${req.label.toLowerCase()}...`} className="bg-white" />
                            )}
                          </div>
                        ))}
                        <div className="flex justify-end gap-3 pt-2">
                          <Button size="sm" className="gap-2">Enviar para Revisão <Send className="size-3.5" /></Button>
                        </div>
                      </div>
                    </CardContent>
                  )}
                </Card>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
