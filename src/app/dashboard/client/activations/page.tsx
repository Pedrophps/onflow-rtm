
"use client";

import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { FlowStep, UserProfile, Product, OnboardingInstance } from "@/lib/types";
import { 
  CheckCircle2, 
  ChevronDown, 
  ChevronUp, 
  FileUp, 
  Send, 
  Clock, 
  ShieldAlert, 
  Loader2, 
  Zap, 
  Lock, 
  ArrowRight, 
  Package, 
  LayoutGrid,
  Headset,
  User,
  HardDrive,
  ShieldCheck,
  FileEdit,
  Settings2,
  ClipboardList,
  Flag
} from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUser, useAuth, useFirestore, useDoc, useCollection } from "@/firebase";
import { doc, collection, query, where, addDoc, serverTimestamp } from "firebase/firestore";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";
import { StepInteractions } from "@/components/step-interactions";
import { format, parseISO } from "date-fns";

export default function ActivationsPage() {
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState("selection");
  const [selectedInstanceId, setSelectedInstanceId] = useState<string | null>(null);
  const [expandedStage, setExpandedStage] = useState<string | null>(null);
  const [realProductId, setRealProductId] = useState<string | null>(null);

  const userRef = useMemo(() => (user ? doc(db, "users", user.uid) : null), [user, db]);
  const { data: profile, loading: profileLoading } = useDoc<UserProfile>(userRef);
  
  const instancesQuery = useMemo(() => 
    user ? query(
      collection(db, "onboardingInstances"),
      where("clientId", "==", user.uid)
    ) : null, 
  [db, user]);
  const { data: instances, loading: instancesLoading } = useCollection<OnboardingInstance>(instancesQuery);

  const selectedInstance = useMemo(() => 
    instances.find(inst => inst.id === selectedInstanceId), 
  [instances, selectedInstanceId]);

  const productsQuery = useMemo(() => 
    user ? query(collection(db, "products")) : null, 
  [db, user]);
  const { data: dbProducts } = useCollection<Product>(productsQuery);

  useEffect(() => {
    if (selectedInstance && dbProducts.length > 0) {
      const productId = selectedInstance.productId;
      const productById = dbProducts.find(p => p.id === productId);
      
      if (productById) {
        setRealProductId(productById.id!);
      } else {
        const foundProductByName = dbProducts.find(p => p.name.toLowerCase() === productId.toLowerCase());
        if (foundProductByName) {
          setRealProductId(foundProductByName.id!);
        } else {
          setRealProductId(productId);
        }
      }
    }
  }, [selectedInstance, dbProducts]);

  const productRef = useMemo(() => 
    (user && realProductId) ? doc(db, "products", realProductId) : null, 
  [db, user, realProductId]);
  const { data: product } = useDoc<Product>(productRef);

  const stepsQuery = useMemo(() => 
    (user && realProductId && selectedInstance?.flowId) ? query(
      collection(db, "products", realProductId, "activationFlows", selectedInstance.flowId, "steps")
    ) : null, 
  [db, user, realProductId, selectedInstance]);
  const { data: rawSteps, loading: stepsLoading } = useCollection<FlowStep>(stepsQuery);
  
  const steps = useMemo(() => [...rawSteps].sort((a, b) => a.order - b.order), [rawSteps]);

  useEffect(() => {
    if (selectedInstanceId) {
      setActiveTab("journey");
    }
  }, [selectedInstanceId]);

  const handleSelectInstance = (id: string) => {
    setSelectedInstanceId(id);
  };

  const getResponsibleIcon = (role: string) => {
    const iconClass = "size-3.5 text-slate-600 dark:text-slate-400";
    switch (role) {
      case 'suporte': return <Headset className={iconClass} />;
      case 'comercial': return <ShieldCheck className={iconClass} />;
      case 'cliente': return <User className={iconClass} />;
      case 'infraestrutura': return <HardDrive className={iconClass} />;
      case 'compliance': return <CheckCircle2 className={iconClass} />;
      default: return <User className={iconClass} />;
    }
  };

  const currentStepOrder = selectedInstance?.currentStepOrder || 1;
  
  const progress = useMemo(() => {
    if (selectedInstance?.status === 'completed') return 100;
    if (steps.length === 0) return 0;
    return Math.min(100, Math.round(((currentStepOrder - 1) / steps.length) * 100));
  }, [selectedInstance?.status, steps.length, currentStepOrder]);

  const predictedCompletionDate = useMemo(() => {
    if (!selectedInstance?.startedAt || steps.length === 0) return null;
    const totalHours = steps.reduce((acc, step) => acc + (Number(step.estimatedTimeInHours) || 0), 0);
    const startDate = new Date(selectedInstance.startedAt);
    const endDate = new Date(startDate.getTime() + totalHours * 60 * 60 * 1000);
    return endDate;
  }, [selectedInstance, steps]);

  if (profileLoading || instancesLoading) {
    return (
      <DashboardLayout role="client">
        <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
          <Loader2 className="size-8 animate-spin text-primary" />
          <p className="text-muted-foreground font-medium text-sm">Carregando jornada técnica...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="client">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold font-headline text-slate-900 dark:text-white">Jornada de Ativação</h1>
          <p className="text-muted-foreground">Confira as etapas técnicas e envie as evidências necessárias.</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="bg-muted p-1 h-12 rounded-xl">
            <TabsTrigger value="selection" className="rounded-lg px-8 gap-2 data-[state=active]:bg-card">
              <LayoutGrid className="size-4" /> Meus Produtos
            </TabsTrigger>
            <TabsTrigger 
              value="journey" 
              disabled={!selectedInstanceId} 
              className="rounded-lg px-8 gap-2 data-[state=active]:bg-card"
            >
              <Zap className="size-4" /> Fluxo de Trabalho
            </TabsTrigger>
          </TabsList>

          <TabsContent value="selection" className="animate-in fade-in slide-in-from-left duration-500">
            <div className="grid gap-6 md:grid-cols-2">
              {instances.length > 0 ? instances.map((inst) => (
                <Card 
                  key={inst.id} 
                  className={cn(
                    "cursor-pointer transition-all hover:border-primary group overflow-hidden border-2 bg-card",
                    selectedInstanceId === inst.id ? "border-primary ring-2 ring-primary/10" : "border-border",
                    inst.status === 'completed' && "hover:border-emerald-500/50"
                  )}
                  onClick={() => handleSelectInstance(inst.id!)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div className={cn(
                        "size-12 rounded-2xl flex items-center justify-center transition-colors",
                        inst.status === 'completed' ? "bg-emerald-500/10 text-emerald-600" : "bg-primary/5 text-primary group-hover:bg-primary group-hover:text-white"
                      )}>
                        {inst.status === 'completed' ? <CheckCircle2 className="size-6" /> : <Package className="size-6" />}
                      </div>
                      <Badge 
                        variant={inst.status === 'completed' ? 'outline' : (inst.techId ? 'default' : 'secondary')} 
                        className={cn(
                          "uppercase text-[9px] font-black tracking-tighter",
                          inst.status === 'completed' && "bg-emerald-50 text-emerald-700 border-emerald-200"
                        )}
                      >
                        {inst.status === 'completed' ? 'Ativação Concluída' : (inst.techId ? 'Atendimento Iniciado' : 'Fila de Espera')}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <CardTitle className={cn(
                        "text-xl mb-1 truncate",
                        inst.status === 'completed' && "text-emerald-900 dark:text-emerald-100"
                      )}>{inst.productName || inst.productId}</CardTitle>
                      <CardDescription className="text-xs">
                        {inst.status === 'completed' ? (
                          <span className="flex items-center gap-1 text-emerald-600 font-bold">
                            <Flag className="size-3" /> Finalizado em: {inst.completedAt ? format(parseISO(inst.completedAt), "dd/MM/yyyy") : 'N/A'}
                          </span>
                        ) : (
                          `Iniciado em: ${new Date(inst.startedAt).toLocaleDateString()}`
                        )}
                      </CardDescription>
                    </div>
                    <Button variant="ghost" className="w-full justify-between font-bold text-xs group-hover:text-primary p-0">
                      {inst.status === 'completed' ? 'Ver Detalhes do Fechamento' : 'Ver Progresso Técnico'} <ArrowRight className="size-4" />
                    </Button>
                  </CardContent>
                </Card>
              )) : (
                <div className="col-span-full p-20 text-center border-2 border-dashed rounded-3xl space-y-4 bg-card">
                  <ShieldAlert className="size-12 mx-auto text-amber-500/20" />
                  <p className="text-sm text-muted-foreground">Você ainda não possui produtos ativos para este CNPJ.</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="journey" className="animate-in fade-in slide-in-from-right duration-500">
            {selectedInstance ? (
              <div className="space-y-8">
                <div className="bg-card rounded-3xl p-8 shadow-sm border space-y-6 relative overflow-hidden">
                  {!selectedInstance.flowId && (
                    <div className="absolute inset-0 bg-card/70 backdrop-blur-[2px] z-50 flex flex-col items-center justify-center p-12 text-center space-y-4">
                      <Settings2 className="size-12 text-amber-500 animate-spin" />
                      <div className="space-y-1">
                        <h3 className="text-xl font-bold text-foreground">Roteiro em Definição</h3>
                        <p className="text-sm text-muted-foreground max-w-md">O analista de suporte <strong>{selectedInstance.techName || 'técnico'}</strong> está configurando o seu roteiro de ativação. Em breve as etapas aparecerão aqui.</p>
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 relative z-10">
                    <div className="space-y-2">
                      <Badge variant="outline" className={cn(
                        "gap-1.5 px-3 py-1 font-bold",
                        selectedInstance.status === 'completed' 
                          ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800" 
                          : "bg-primary/5 text-primary border-primary/20"
                      )}>
                        <CheckCircle2 className="size-3.5" /> {selectedInstance.status === 'completed' ? 'JORNADA CONCLUÍDA' : 'JORNADA ATIVA'}
                      </Badge>
                      <h2 className="text-3xl font-bold font-headline">{product?.name || selectedInstance.productName || selectedInstance.productId}</h2>
                      <p className="text-muted-foreground font-medium">Analista RTM: <span className="text-foreground font-bold">{selectedInstance.techName || 'Pendente'}</span></p>
                    </div>
                    <div className="text-right">
                      <span className={cn(
                        "text-6xl font-black",
                        selectedInstance.status === 'completed' ? "text-emerald-500" : "text-primary"
                      )}>{Math.round(progress)}%</span>
                      <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-1">Concluído</p>
                      
                      <div className="mt-2 text-right">
                        {selectedInstance.status === 'completed' ? (
                          <>
                            <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest">Ativado em:</p>
                            <p className="text-xs font-black text-emerald-700">{selectedInstance.completedAt ? format(parseISO(selectedInstance.completedAt), "dd/MM/yyyy") : 'N/A'}</p>
                          </>
                        ) : predictedCompletionDate && (
                          <>
                            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">conclusão prevista:</p>
                            <p className="text-xs font-bold text-foreground opacity-80">{format(predictedCompletionDate, "dd/MM/yyyy")}</p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <Progress value={progress} className={cn("h-3 rounded-full", selectedInstance.status === 'completed' && "[&>div]:bg-emerald-500")} />
                </div>

                <div className="space-y-6">
                  <h3 className="text-lg font-bold font-headline flex items-center gap-2">
                    <ClipboardList className="size-5 text-primary" /> Etapas do Projeto
                  </h3>
                  
                  {stepsLoading ? (
                    <div className="flex justify-center py-10"><Loader2 className="animate-spin text-primary" /></div>
                  ) : steps.length > 0 ? (
                    <div className="relative pl-8 space-y-6 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-border">
                      {steps.map((step) => {
                        const isCompleted = step.order < currentStepOrder || selectedInstance.status === 'completed';
                        const isCurrent = step.order === currentStepOrder && selectedInstance.status !== 'completed';
                        const isFuture = step.order > currentStepOrder && selectedInstance.status !== 'completed';
                        const isExpanded = expandedStage === step.id;

                        return (
                          <div key={step.id} className="relative">
                            <div className={cn(
                              "absolute -left-[29px] top-1 size-6 rounded-full border-2 flex items-center justify-center transition-all z-10 bg-card",
                              isCompleted ? "border-emerald-500 bg-emerald-500 text-white" : 
                              isCurrent ? "border-primary bg-primary text-white animate-pulse" : 
                              "border-border text-muted-foreground"
                            )}>
                              {isCompleted ? <CheckCircle2 className="size-3.5" /> : 
                               <span className="text-[10px] font-bold">{step.order}</span>}
                            </div>
                            
                            <Card className={cn(
                              "transition-all duration-300 bg-card",
                              isCurrent ? "ring-2 ring-primary/20 shadow-lg border-primary/40" : 
                              isFuture ? "opacity-60" : "hover:border-primary/30"
                            )}>
                              <CardHeader 
                                className="p-5 flex flex-row items-center justify-between cursor-pointer"
                                onClick={() => setExpandedStage(isExpanded ? null : step.id || null)}
                              >
                                <div className="flex-1 space-y-1">
                                  <div className="flex items-center gap-3">
                                    <CardTitle className={cn(
                                      "text-base font-bold",
                                      isCompleted ? "text-muted-foreground" : "text-foreground"
                                    )}>{step.name}</CardTitle>
                                    <Badge variant="outline" className="text-[9px] uppercase font-bold bg-muted/20 text-muted-foreground border-border gap-1 px-2 py-0.5">
                                      {getResponsibleIcon(step.responsible)}
                                      {step.responsible}
                                    </Badge>
                                  </div>
                                  <CardDescription className="text-sm line-clamp-1">{step.description}</CardDescription>
                                </div>
                                {isExpanded ? <ChevronUp className="size-5 text-muted-foreground" /> : <ChevronDown className="size-5 text-muted-foreground" />}
                              </CardHeader>

                              {isExpanded && (
                                <CardContent className="p-5 pt-0 border-t bg-muted/10">
                                  <div className="mt-5 grid grid-cols-1 lg:grid-cols-3 gap-6">
                                    <div className="lg:col-span-1 space-y-6">
                                      <div className="grid md:grid-cols-2 gap-4">
                                         <div className="space-y-1">
                                            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">SLA de Atendimento</p>
                                            <p className="text-xs font-bold flex items-center gap-2 text-foreground"><Clock className="size-3" /> {step.estimatedTimeInHours}h Úteis</p>
                                         </div>
                                         <div className="space-y-1">
                                            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Ação</p>
                                            <p className="text-xs font-bold flex items-center gap-2 text-foreground"><FileEdit className="size-3" /> Envio de Evidência</p>
                                         </div>
                                      </div>
                                      <div className="p-4 rounded-xl bg-card border border-border text-sm text-foreground opacity-90 leading-relaxed font-medium">
                                        {step.description}
                                      </div>
                                      
                                      {isCompleted && (
                                        <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 font-bold uppercase">
                                          <CheckCircle2 className="size-3.5" /> Etapa Concluída
                                        </div>
                                      )}
                                      
                                      {isFuture && (
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                                          <Lock className="size-3.5" /> Etapa bloqueada
                                        </div>
                                      )}
                                    </div>
                                    <div className="lg:col-span-2">
                                      <StepInteractions 
                                        instanceId={selectedInstance.id!}
                                        stepId={step.id!}
                                        clientId={selectedInstance.clientId}
                                        canInteract={(isCurrent || (isCompleted && selectedInstance.status !== 'completed')) && step.responsible === 'cliente'}
                                        userName={profile?.displayName}
                                        userRole="cliente"
                                      />
                                    </div>
                                  </div>
                                </CardContent>
                              )}
                            </Card>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-10 text-center border-2 border-dashed rounded-3xl bg-muted/10">
                      <p className="text-sm text-muted-foreground">O roteiro selecionado ainda não possui etapas cadastradas pelo Suporte.</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-20 text-center border-2 border-dashed rounded-3xl bg-card space-y-4">
                <Package className="size-12 mx-auto text-muted-foreground/20" />
                <p className="text-muted-foreground">Selecione um produto para visualizar a jornada.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
