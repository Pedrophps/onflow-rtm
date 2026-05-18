
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
  ClipboardList
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
    const iconClass = "size-3.5 text-slate-600";
    switch (role) {
      case 'suporte': return <Headset className={iconClass} />;
      case 'comercial': return <ShieldCheck className={iconClass} />;
      case 'cliente': return <User className={iconClass} />;
      case 'infraestrutura': return <HardDrive className={iconClass} />;
      case 'compliance': return <CheckCircle2 className={iconClass} />;
      default: return <User className={iconClass} />;
    }
  };

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

  const currentStepOrder = selectedInstance?.currentStepOrder || 1;
  const progress = steps.length > 0 ? Math.min(100, (Math.max(0, currentStepOrder - 1) / steps.length) * 100) : 0;

  return (
    <DashboardLayout role="client">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold font-headline text-slate-900">Jornada de Ativação</h1>
          <p className="text-muted-foreground">Confira as etapas técnicas e envie as evidências necessárias.</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="bg-slate-100 p-1 h-12 rounded-xl">
            <TabsTrigger value="selection" className="rounded-lg px-8 gap-2 data-[state=active]:bg-white">
              <LayoutGrid className="size-4" /> Meus Produtos
            </TabsTrigger>
            <TabsTrigger 
              value="journey" 
              disabled={!selectedInstanceId} 
              className="rounded-lg px-8 gap-2 data-[state=active]:bg-white"
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
                    "cursor-pointer transition-all hover:border-primary group overflow-hidden border-2",
                    selectedInstanceId === inst.id ? "border-primary ring-2 ring-primary/10" : "border-slate-200"
                  )}
                  onClick={() => handleSelectInstance(inst.id!)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div className="size-12 rounded-2xl bg-primary/5 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                        <Package className="size-6" />
                      </div>
                      <Badge variant={inst.techId ? 'default' : 'secondary'} className="uppercase text-[9px] font-bold">
                        {inst.techId ? 'Atendimento Iniciado' : 'Fila de Espera'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <CardTitle className="text-xl mb-1 truncate">{inst.productName || inst.productId}</CardTitle>
                      <CardDescription className="text-xs">Iniciado em: {new Date(inst.startedAt).toLocaleDateString()}</CardDescription>
                    </div>
                    <Button variant="ghost" className="w-full justify-between font-bold text-xs group-hover:text-primary p-0">
                      Ver Progresso Técnico <ArrowRight className="size-4" />
                    </Button>
                  </CardContent>
                </Card>
              )) : (
                <div className="col-span-full p-20 text-center border-2 border-dashed rounded-3xl space-y-4 bg-white">
                  <ShieldAlert className="size-12 mx-auto text-amber-500/20" />
                  <p className="text-sm text-muted-foreground">Você ainda não possui produtos ativos para este CNPJ.</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="journey" className="animate-in fade-in slide-in-from-right duration-500">
            {selectedInstance ? (
              <div className="space-y-8">
                <div className="bg-white rounded-3xl p-8 shadow-sm border space-y-6 relative overflow-hidden">
                  {!selectedInstance.flowId && (
                    <div className="absolute inset-0 bg-white/70 backdrop-blur-[2px] z-50 flex flex-col items-center justify-center p-12 text-center space-y-4">
                      <Settings2 className="size-12 text-amber-500 animate-spin" />
                      <div className="space-y-1">
                        <h3 className="text-xl font-bold text-slate-900">Roteiro em Definição</h3>
                        <p className="text-sm text-muted-foreground max-w-md">O analista de suporte <strong>{selectedInstance.techName || 'técnico'}</strong> está configurando o seu roteiro de ativação. Em breve as etapas aparecerão aqui.</p>
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 relative z-10">
                    <div className="space-y-2">
                      <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 gap-1.5 px-3 py-1 font-bold">
                        <CheckCircle2 className="size-3.5" /> JORNADA ATIVA
                      </Badge>
                      <h2 className="text-3xl font-bold font-headline">{product?.name || selectedInstance.productName || selectedInstance.productId}</h2>
                      <p className="text-muted-foreground font-medium">Analista RTM: <span className="text-foreground font-bold">{selectedInstance.techName || 'Pendente'}</span></p>
                    </div>
                    <div className="text-right">
                      <span className="text-5xl font-black text-primary">{Math.round(progress)}%</span>
                      <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-1">Concluído</p>
                    </div>
                  </div>
                  <Progress value={progress} className="h-3 rounded-full" />
                </div>

                <div className="space-y-6">
                  <h3 className="text-lg font-bold font-headline flex items-center gap-2">
                    <ClipboardList className="size-5 text-primary" /> Etapas do Projeto
                  </h3>
                  
                  {stepsLoading ? (
                    <div className="flex justify-center py-10"><Loader2 className="animate-spin text-primary" /></div>
                  ) : steps.length > 0 ? (
                    <div className="relative pl-8 space-y-6 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-100">
                      {steps.map((step) => {
                        const isCompleted = step.order < currentStepOrder;
                        const isCurrent = step.order === currentStepOrder;
                        const isFuture = step.order > currentStepOrder;
                        const isExpanded = expandedStage === step.id;

                        return (
                          <div key={step.id} className="relative">
                            <div className={cn(
                              "absolute -left-[29px] top-1 size-6 rounded-full border-2 flex items-center justify-center transition-all z-10 bg-white",
                              isCompleted ? "border-emerald-500 bg-emerald-500 text-white" : 
                              isCurrent ? "border-primary bg-primary text-white animate-pulse" : 
                              "border-slate-200 text-slate-400"
                            )}>
                              {isCompleted ? <CheckCircle2 className="size-3.5" /> : 
                               <span className="text-[10px] font-bold">{step.order}</span>}
                            </div>
                            
                            <Card className={cn(
                              "transition-all duration-300",
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
                                      isCompleted ? "text-slate-400" : "text-slate-800"
                                    )}>{step.name}</CardTitle>
                                    <Badge variant="outline" className="text-[9px] uppercase font-bold bg-slate-50 text-slate-600 border-slate-200 gap-1 px-2 py-0.5">
                                      {getResponsibleIcon(step.responsible)}
                                      {step.responsible}
                                    </Badge>
                                  </div>
                                  <CardDescription className="text-sm line-clamp-1">{step.description}</CardDescription>
                                </div>
                                {isExpanded ? <ChevronUp className="size-5 text-slate-400" /> : <ChevronDown className="size-5 text-slate-400" />}
                              </CardHeader>

                              {isExpanded && (
                                <CardContent className="p-5 pt-0 border-t bg-slate-50/30">
                                  <div className="mt-5 grid grid-cols-1 lg:grid-cols-3 gap-6">
                                    <div className="lg:col-span-1 space-y-6">
                                      <div className="grid md:grid-cols-2 gap-4">
                                         <div className="space-y-1">
                                            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">SLA de Atendimento</p>
                                            <p className="text-xs font-bold flex items-center gap-2"><Clock className="size-3" /> {step.estimatedTimeInHours}h Úteis</p>
                                         </div>
                                         <div className="space-y-1">
                                            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Ação</p>
                                            <p className="text-xs font-bold flex items-center gap-2"><FileEdit className="size-3" /> {step.type === 'upload' ? 'Envio de Arquivo' : 'Preenchimento'}</p>
                                         </div>
                                      </div>
                                      <div className="p-4 rounded-xl bg-white border border-slate-200 text-sm text-slate-700 leading-relaxed font-medium">
                                        {step.description}
                                      </div>
                                      
                                      {isCompleted && (
                                        <div className="flex items-center gap-2 text-xs text-emerald-600 font-bold uppercase">
                                          <CheckCircle2 className="size-3.5" /> Etapa Concluída
                                        </div>
                                      )}
                                      
                                      {isFuture && (
                                        <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
                                          <Lock className="size-3.5" /> Etapa bloqueada
                                        </div>
                                      )}
                                    </div>
                                    <div className="lg:col-span-2">
                                      {/* Log de Interação - Clientes interagem em SUAS etapas, mesmo que concluídas */}
                                      <StepInteractions 
                                        instanceId={selectedInstance.id!}
                                        stepId={step.id!}
                                        clientId={selectedInstance.clientId}
                                        canInteract={(isCurrent || isCompleted) && step.responsible === 'cliente'}
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
                    <div className="p-10 text-center border-2 border-dashed rounded-3xl bg-slate-50/50">
                      <p className="text-sm text-muted-foreground">O roteiro selecionado ainda não possui etapas cadastradas pelo Suporte.</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-20 text-center border-2 border-dashed rounded-3xl bg-white space-y-4">
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
