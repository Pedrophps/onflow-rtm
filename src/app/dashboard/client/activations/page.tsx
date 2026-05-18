
"use client";

import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { FlowStep, UserProfile, Product, ActivationFlow, OnboardingInstance } from "@/lib/types";
import { CheckCircle2, ChevronDown, ChevronUp, FileUp, Send, Clock, ShieldAlert, Loader2, Zap, Lock, Circle, ArrowRight, Package, LayoutGrid } from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUser, useFirestore, useDoc, useCollection } from "@/firebase";
import { doc, collection, query, where, addDoc, serverTimestamp } from "firebase/firestore";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";

export default function ActivationsPage() {
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState("selection");
  const [selectedInstanceId, setSelectedInstanceId] = useState<string | null>(null);
  const [expandedStage, setExpandedStage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const userRef = useMemo(() => (user ? doc(db, "users", user.uid) : null), [user, db]);
  const { data: profile, loading: profileLoading } = useDoc<UserProfile>(userRef);
  
  // 1. Buscar Todas as Instâncias de Onboarding do Cliente
  const instancesQuery = useMemo(() => 
    user ? query(
      collection(db, "onboardingInstances"),
      where("clientId", "==", user.uid)
    ) : null, 
  [db, user]);
  const { data: instances, loading: instancesLoading } = useCollection<OnboardingInstance>(instancesQuery);

  // 2. Instância Selecionada
  const selectedInstance = useMemo(() => 
    instances.find(inst => inst.id === selectedInstanceId), 
  [instances, selectedInstanceId]);

  // 3. Buscar Dados do Produto Selecionado
  const productRef = useMemo(() => selectedInstance?.productId ? doc(db, "products", selectedInstance.productId) : null, [db, selectedInstance]);
  const { data: product } = useDoc<Product>(productRef);

  // 4. Buscar Etapas do Fluxo do Produto Selecionado
  const stepsQuery = useMemo(() => 
    (selectedInstance?.productId && selectedInstance?.flowId) ? query(
      collection(db, "products", selectedInstance.productId, "activationFlows", selectedInstance.flowId, "steps")
    ) : null, 
  [db, selectedInstance]);
  const { data: rawSteps, loading: stepsLoading } = useCollection<FlowStep>(stepsQuery);
  
  const steps = useMemo(() => [...rawSteps].sort((a, b) => a.order - b.order), [rawSteps]);

  // Efeito para mudar de aba quando um produto é selecionado
  useEffect(() => {
    if (selectedInstanceId) {
      setActiveTab("journey");
    }
  }, [selectedInstanceId]);

  const handleSelectInstance = (id: string) => {
    setSelectedInstanceId(id);
  };

  const handleSendEvidence = async (step: FlowStep) => {
    if (!user || isSubmitting || !selectedInstance) return;
    setIsSubmitting(true);

    const submissionData = {
      userId: user.uid,
      productId: selectedInstance.productId,
      flowId: selectedInstance.flowId,
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

  if (profileLoading || instancesLoading) {
    return (
      <DashboardLayout role="client">
        <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
          <Loader2 className="size-8 animate-spin text-primary" />
          <p className="text-muted-foreground font-medium text-sm">Carregando seus produtos...</p>
        </div>
      </DashboardLayout>
    );
  }

  const currentStepOrder = selectedInstance?.currentStepOrder || 1;
  const progress = steps.length > 0 ? ((currentStepOrder - 1) / steps.length) * 100 : 0;

  return (
    <DashboardLayout role="client">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold font-headline text-slate-900">Ativações Técnicas</h1>
          <p className="text-muted-foreground">Gerencie a jornada de ativação dos seus produtos RTM.</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="bg-slate-100 p-1 h-12 rounded-xl">
            <TabsTrigger value="selection" className="rounded-lg px-8 gap-2 data-[state=active]:bg-white">
              <LayoutGrid className="size-4" /> Selecionar Produto
            </TabsTrigger>
            <TabsTrigger 
              value="journey" 
              disabled={!selectedInstanceId} 
              className="rounded-lg px-8 gap-2 data-[state=active]:bg-white"
            >
              <Zap className="size-4" /> Jornada Técnica
            </TabsTrigger>
          </TabsList>

          <TabsContent value="selection" className="animate-in fade-in slide-in-from-left duration-500">
            <div className="grid gap-6 md:grid-cols-2">
              {instances.length > 0 ? instances.map((inst) => (
                <Card 
                  key={inst.id} 
                  className={cn(
                    "cursor-pointer transition-all hover:border-primary group relative overflow-hidden",
                    selectedInstanceId === inst.id ? "border-primary ring-2 ring-primary/10" : "border-slate-200"
                  )}
                  onClick={() => handleSelectInstance(inst.id!)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div className="size-12 rounded-2xl bg-primary/5 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                        <Package className="size-6" />
                      </div>
                      <Badge variant={inst.status === 'active' ? 'default' : 'secondary'} className="uppercase text-[10px]">
                        {inst.status === 'active' ? 'Em Ativação' : inst.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <CardTitle className="text-xl mb-1">{inst.productId}</CardTitle>
                      <CardDescription className="text-xs">ID RTM: {profile?.clientCode || 'Pendente'}</CardDescription>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-[10px] font-bold text-muted-foreground uppercase">
                        <span>Progresso Técnico</span>
                        <span>Etapa {inst.currentStepOrder}</span>
                      </div>
                      <Progress value={25} className="h-1.5" />
                    </div>
                    <Button variant="ghost" className="w-full justify-between font-bold text-xs group-hover:text-primary p-0">
                      Gerenciar Ativação <ArrowRight className="size-4" />
                    </Button>
                  </CardContent>
                </Card>
              )) : (
                <div className="col-span-full p-20 text-center border-2 border-dashed rounded-3xl space-y-4 bg-white">
                  <ShieldAlert className="size-12 mx-auto text-amber-500/20" />
                  <div className="space-y-1">
                    <p className="text-lg font-bold">Nenhum produto em ativação</p>
                    <p className="text-sm text-muted-foreground max-w-sm mx-auto">Sua conta institucional ainda não possui processos técnicos iniciados pelo suporte RTM.</p>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="journey" className="animate-in fade-in slide-in-from-right duration-500">
            {selectedInstance ? (
              <div className="space-y-8">
                {/* Header do Produto Selecionado */}
                <div className="bg-white rounded-3xl p-8 shadow-sm border space-y-6 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-8 opacity-5">
                    <Zap className="size-32 text-primary" />
                  </div>
                  
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 relative z-10">
                    <div className="space-y-2">
                      <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 gap-1.5 px-3 py-1">
                        <CheckCircle2 className="size-3.5" /> Ativação Selecionada
                      </Badge>
                      <h2 className="text-3xl font-bold font-headline">{product?.name || selectedInstance.productId}</h2>
                      <p className="text-muted-foreground font-medium">Analista Responsável: <span className="text-foreground">{selectedInstance.techName || 'Pendente'}</span></p>
                    </div>
                    <div className="text-right">
                      <span className="text-5xl font-black text-primary">{Math.round(progress)}%</span>
                      <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-1">Conclusão</p>
                    </div>
                  </div>
                  <Progress value={progress} className="h-3 rounded-full" />
                </div>

                {/* Lista de Etapas */}
                <div className="space-y-6">
                  <h3 className="text-lg font-bold font-headline flex items-center gap-2">Fluxo de Trabalho</h3>
                  
                  {stepsLoading ? (
                    <div className="flex justify-center py-10"><Loader2 className="animate-spin text-primary" /></div>
                  ) : (
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
                                          <p className="text-[11px] text-slate-500">Esta etapa está sendo tratada internamente pela RTM. Notificaremos você ao concluir.</p>
                                        </div>
                                      </div>
                                    ) : isCompleted ? (
                                      <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100 flex gap-3 items-center">
                                        <CheckCircle2 className="size-5 text-emerald-500 shrink-0" />
                                        <div className="space-y-0.5">
                                          <p className="text-xs font-bold text-emerald-700 uppercase">Concluído</p>
                                          <p className="text-[11px] text-emerald-600">Sua interação nesta etapa foi validada.</p>
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="space-y-4">
                                        <div className="space-y-2">
                                          <Label className="text-xs font-bold uppercase text-slate-500 tracking-widest">Sua Ação Necessária</Label>
                                          <div className="border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center bg-white group hover:border-primary cursor-pointer transition-all">
                                            <FileUp className="size-8 mb-3 text-primary/40 group-hover:text-primary group-hover:scale-110 transition-all" />
                                            <p className="text-sm font-bold text-slate-700">Clique para enviar a evidência</p>
                                            <p className="text-[10px] text-muted-foreground mt-1 uppercase font-bold tracking-tighter">PDF, PNG ou JPG</p>
                                          </div>
                                        </div>
                                        <div className="flex justify-between items-center pt-2">
                                          <div className="flex items-center gap-2 text-amber-600">
                                            <Clock className="size-4" />
                                            <span className="text-[10px] font-bold uppercase">SLA: {step.estimatedTimeInHours}h</span>
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
                  )}
                </div>
              </div>
            ) : (
              <div className="p-20 text-center border-2 border-dashed rounded-3xl bg-white space-y-4">
                <Package className="size-12 mx-auto text-muted-foreground/20" />
                <p className="text-muted-foreground">Por favor, selecione um produto na aba ao lado para visualizar as etapas.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
