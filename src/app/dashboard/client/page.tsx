
"use client";

import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { FlowStep, UserProfile, Product, ActivationFlow, OnboardingInstance } from "@/lib/types";
import { CheckCircle2, ChevronDown, ChevronUp, FileUp, Send, Clock, ShieldAlert, Loader2, Zap, Lock, Circle } from "lucide-react";
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useUser, useFirestore, useDoc, useCollection } from "@/firebase";
import { doc, collection, query, where, limit, addDoc, serverTimestamp } from "firebase/firestore";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";

export default function ClientPage() {
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  
  const userRef = useMemo(() => (user ? doc(db, "users", user.uid) : null), [user, db]);
  const { data: profile, loading: profileLoading } = useDoc<UserProfile>(userRef);
  
  // Buscar Instância de Onboarding Ativa
  const instanceQuery = useMemo(() => 
    user ? query(
      collection(db, "onboardingInstances"),
      where("clientId", "==", user.uid),
      where("status", "==", "active"),
      limit(1)
    ) : null, 
  [db, user]);
  const { data: instances, loading: instanceLoading } = useCollection<OnboardingInstance>(instanceQuery);
  const instance = instances?.[0];

  // Buscar Produto
  const productRef = useMemo(() => instance?.productId ? doc(db, "products", instance.productId) : null, [db, instance]);
  const { data: product } = useDoc<Product>(productRef);

  // Buscar Fluxo (a partir da instância)
  const flowRef = useMemo(() => (instance?.productId && instance?.flowId) ? doc(db, "products", instance.productId, "activationFlows", instance.flowId) : null, [db, instance]);
  const { data: flow } = useDoc<ActivationFlow>(flowRef);

  // Buscar Etapas do Fluxo
  const stepsQuery = useMemo(() => 
    (instance?.productId && instance?.flowId) ? query(
      collection(db, "products", instance.productId, "activationFlows", instance.flowId, "steps")
    ) : null, 
  [db, instance]);
  const { data: rawSteps, loading: stepsLoading } = useCollection<FlowStep>(stepsQuery);
  
  const steps = useMemo(() => [...rawSteps].sort((a, b) => a.order - b.order), [rawSteps]);

  const [expandedStage, setExpandedStage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Lógica de Validação RTM
  const isFullyValidated = profile?.status === 'approved' && profile?.clientCode && profile?.activeProduct;

  const handleSendEvidence = async (step: FlowStep) => {
    if (!user || isSubmitting) return;
    setIsSubmitting(true);

    const submissionData = {
      userId: user.uid,
      productId: instance?.productId,
      flowId: instance?.flowId,
      stepId: step.id,
      submittedAt: serverTimestamp(),
      status: 'pending',
      responsibleAtTime: step.responsible,
      institutionName: profile?.institutionName
    };

    try {
      await addDoc(collection(db, "submissions"), submissionData);
      toast({
        title: "Evidência Enviada",
        description: `Sua interação na etapa "${step.name}" foi registrada para análise.`
      });
      setExpandedStage(null);
    } catch (e) {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: 'submissions',
        operation: 'create',
        requestResourceData: submissionData
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (profileLoading || instanceLoading || stepsLoading) {
    return (
      <DashboardLayout role="client">
        <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
          <Loader2 className="size-8 animate-spin text-primary" />
          <p className="text-muted-foreground font-medium">Carregando sua jornada técnica...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!isFullyValidated || !instance) {
    return (
      <DashboardLayout role="client">
        <div className="max-w-2xl mx-auto mt-10 md:mt-20 text-center space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="size-24 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 mx-auto">
            <ShieldAlert className="size-12" />
          </div>
          <div className="space-y-4">
            <h1 className="text-3xl font-bold font-headline">Aguardando Habilitação Técnica</h1>
            <p className="text-muted-foreground text-lg leading-relaxed">
              Olá, <span className="font-bold text-foreground">{profile?.displayName}</span>. 
              Sua conta institucional está aguardando a atribuição de um Analista de Suporte RTM para iniciar o fluxo técnico.
            </p>
          </div>
          
          <Card className="bg-white border-2 border-amber-100 shadow-sm overflow-hidden">
            <div className="bg-amber-50 px-6 py-3 border-b border-amber-100 flex items-center gap-2">
              <Clock className="size-4 text-amber-600" />
              <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">Status de Conformidade RTM</span>
            </div>
            <CardContent className="p-6 text-left space-y-4">
              <div className="grid gap-4">
                <CheckItem label="Aprovação de Cadastro" checked={profile?.status === 'approved'} />
                <CheckItem label="Atribuição de ID RTM" checked={!!profile?.clientCode} />
                <CheckItem label="Instância de Ativação Criada" checked={!!instance} />
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  const currentStepOrder = instance?.currentStepOrder || 1;
  const progress = steps.length > 0 ? ((currentStepOrder - 1) / steps.length) * 100 : 0;

  return (
    <DashboardLayout role="client">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="bg-white rounded-3xl p-8 shadow-sm border space-y-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <Zap className="size-32 text-primary" />
          </div>
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 relative z-10">
            <div className="space-y-2">
              <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 gap-1.5 px-3 py-1">
                <CheckCircle2 className="size-3.5" /> Ativação em Curso
              </Badge>
              <h1 className="text-3xl font-bold font-headline">Ativação: {product?.name || profile?.activeProduct}</h1>
              <p className="text-muted-foreground font-medium">{profile?.institutionName} • ID {profile?.clientCode}</p>
            </div>
            <div className="text-right">
              <span className="text-5xl font-black text-primary">{Math.round(progress)}%</span>
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-1">Progresso Atual</p>
            </div>
          </div>
          <Progress value={progress} className="h-3 rounded-full" />
        </div>

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold font-headline flex items-center gap-2">Etapas do Workflow</h2>
            <Badge variant="secondary" className="text-[10px] uppercase font-bold tracking-tighter">Analista: {instance?.techName || 'Pendente'}</Badge>
          </div>
          
          <div className="relative pl-8 space-y-6 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-100">
            {steps.map((step) => {
              const isCompleted = step.order < currentStepOrder;
              const isCurrent = step.order === currentStepOrder;
              const isFuture = step.order > currentStepOrder;
              const isClientResponsible = step.responsible === 'cliente';
              const isExpanded = expandedStage === step.id;

              return (
                <div key={step.id} className="relative">
                  <div className={cn(
                    "absolute -left-[29px] top-1 size-6 rounded-full border-2 flex items-center justify-center transition-all z-10 bg-white shadow-sm",
                    isCompleted ? "border-emerald-500 bg-emerald-500 text-white" : 
                    isCurrent ? "border-primary bg-primary text-white animate-pulse" : 
                    "border-slate-200 text-slate-400"
                  )}>
                    {isCompleted ? <CheckCircle2 className="size-3.5" /> : 
                     isCurrent ? <Circle className="size-2 fill-current" /> :
                     <span className="text-[10px] font-bold">{step.order}</span>}
                  </div>
                  
                  <Card className={cn(
                    "transition-all duration-300",
                    isCurrent ? "ring-2 ring-primary/20 shadow-lg border-primary/20" : 
                    isFuture ? "opacity-60" : "hover:border-primary/30"
                  )}>
                    <CardHeader 
                      className={cn(
                        "p-5 flex flex-row items-center justify-between space-y-0",
                        !isFuture && "cursor-pointer"
                      )}
                      onClick={() => !isFuture && setExpandedStage(isExpanded ? null : step.id || null)}
                    >
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-3">
                          <CardTitle className={cn(
                            "text-base font-bold",
                            isCompleted ? "text-slate-400" : "text-slate-800"
                          )}>{step.name}</CardTitle>
                          <Badge variant="secondary" className="text-[9px] uppercase font-black bg-slate-100">
                            {step.responsible}
                          </Badge>
                          {isCurrent && <Badge className="text-[8px] bg-primary/10 text-primary border-primary/20 uppercase font-bold">Aguardando Ação</Badge>}
                        </div>
                        <CardDescription className="text-sm line-clamp-1">{step.description}</CardDescription>
                      </div>
                      {!isFuture && (isExpanded ? <ChevronUp className="size-5 text-slate-400" /> : <ChevronDown className="size-5 text-slate-400" />)}
                      {isFuture && <Lock className="size-4 text-slate-300" />}
                    </CardHeader>

                    {isExpanded && !isFuture && (
                      <CardContent className="p-5 pt-0 border-t bg-slate-50/30">
                        <div className="mt-5 space-y-6">
                          {!isClientResponsible ? (
                            <div className="p-4 rounded-2xl bg-white border border-slate-200 flex gap-3 items-center">
                              <Loader2 className="size-5 text-primary animate-spin shrink-0" />
                              <div className="space-y-0.5">
                                <p className="text-xs font-bold text-slate-600 uppercase">Processamento RTM</p>
                                <p className="text-[11px] text-slate-500">Esta etapa está sendo tratada pelo time de <strong>{step.responsible}</strong>. Você será notificado ao concluir.</p>
                              </div>
                            </div>
                          ) : isCompleted ? (
                            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100 flex gap-3 items-center">
                              <CheckCircle2 className="size-5 text-emerald-500 shrink-0" />
                              <div className="space-y-0.5">
                                <p className="text-xs font-bold text-emerald-700 uppercase">Enviado com Sucesso</p>
                                <p className="text-[11px] text-emerald-600">Sua evidência foi recebida e validada pelo suporte.</p>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-4">
                              <div className="space-y-2">
                                <Label className="text-xs font-bold uppercase text-slate-500 tracking-widest">Sua Ação Necessária</Label>
                                <div className="border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center bg-white group hover:border-primary cursor-pointer transition-all">
                                  <FileUp className="size-8 mb-3 text-primary/40 group-hover:text-primary group-hover:scale-110 transition-all" />
                                  <p className="text-sm font-bold text-slate-700">Clique para enviar a evidência</p>
                                  <p className="text-[10px] text-muted-foreground mt-1 uppercase font-bold tracking-tighter">Arquivos aceitos: PDF, PNG ou JPG</p>
                                </div>
                              </div>
                              <div className="flex justify-between items-center pt-2">
                                <div className="flex items-center gap-2 text-amber-600">
                                  <Clock className="size-4" />
                                  <span className="text-[10px] font-bold uppercase">SLA Estimado: {step.estimatedTimeInHours} Horas</span>
                                </div>
                                <Button 
                                  size="sm" 
                                  className="gap-2 rounded-full px-8 font-bold shadow-md"
                                  onClick={() => handleSendEvidence(step)}
                                  disabled={isSubmitting}
                                >
                                  {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-3.5" />}
                                  Confirmar Envio
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    )}
                  </Card>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

function CheckItem({ label, checked }: { label: string, checked: boolean }) {
  return (
    <div className={cn(
      "flex items-center gap-3 text-sm p-4 rounded-xl border transition-all",
      checked ? "bg-emerald-50 border-emerald-100" : "bg-white border-dashed shadow-sm"
    )}>
      {checked ? (
        <CheckCircle2 className="size-5 text-emerald-500" />
      ) : (
        <Clock className="size-5 text-amber-500 animate-pulse" />
      )}
      <span className={cn("font-bold", checked ? "text-emerald-800" : "text-slate-600")}>
        {label}: {checked ? 'OK' : 'Pendente'}
      </span>
    </div>
  );
}
