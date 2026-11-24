
"use client";

import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  ClipboardList, 
  CheckCircle2, 
  Loader2, 
  ArrowRight, 
  UserPlus, 
  Building2, 
  Briefcase, 
  Zap, 
  Mail, 
  FileText, 
  UserCheck, 
  ChevronRight, 
  Phone, 
  Settings2, 
  GitFork, 
  AlertTriangle, 
  Clock, 
  ChevronUp, 
  ChevronDown, 
  User, 
  ShieldCheck, 
  HardDrive, 
  Headset, 
  Lock, 
  LayoutGrid, 
  ArrowLeft, 
  RotateCcw,
  Trash2,
  MessageSquare,
  UserCircle,
  Hash,
  Search,
  Flag
} from "lucide-react";
import { useCollection, useFirestore, useUser, useDoc } from "@/firebase";
import { collection, query, where, doc, updateDoc, serverTimestamp, addDoc, getDocs, orderBy, deleteDoc, writeBatch } from "firebase/firestore";
import { useMemo, useState, useEffect } from "react";
import { UserProfile, OnboardingInstance, ActivationFlow, Product, FlowStep } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { StepInteractions } from "@/components/step-interactions";

export default function OnboardingManagement() {
  const db = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  
  const userRef = useMemo(() => (user ? doc(db, "users", user.uid) : null), [user, db]);
  const { data: profile } = useDoc<UserProfile>(userRef);
  const isSupport = profile?.adminType === 'suporte' || profile?.adminType === 'coordenador_suporte';
  const isAdminUser = profile?.role === 'admin';

  const [activeTab, setActiveTab] = useState("available");
  const [selectedClientForFicha, setSelectedClientForFicha] = useState<UserProfile | null>(null);
  const [isFichaOpen, setIsFichaOpen] = useState(false);
  
  const [isFlowSelectionOpen, setIsFlowSelectionOpen] = useState(false);
  const [targetInstance, setTargetInstance] = useState<OnboardingInstance | null>(null);
  const [availableFlows, setAvailableFlows] = useState<ActivationFlow[]>([]);
  const [selectedFlowId, setSelectedFlowId] = useState("");
  const [isSavingFlow, setIsSavingFlow] = useState(false);
  const [isUpdatingStep, setIsUpdatingStep] = useState(false);
  const [isFetchingFlows, setIsFetchingFlows] = useState(false);

  // Estados para Conclusão
  const [isCompletionOpen, setIsCompletionOpen] = useState(false);
  const [completionNotes, setCompletionNotes] = useState("");
  const [isCompleting, setIsCompleting] = useState(false);

  // Estados para Visão de Jornada Integrada
  const [journeyInstanceId, setJourneyInstanceId] = useState<string | null>(null);
  const [journeySteps, setJourneySteps] = useState<FlowStep[]>([]);
  const [isFetchingSteps, setIsFetchingSteps] = useState(false);
  const [expandedStepId, setExpandedStepId] = useState<string | null>(null);

  // Mapeamento de Produtos
  const productsQuery = useMemo(() => {
    if (!user) return null;
    return query(collection(db, "products"));
  }, [db, user]);
  const { data: dbProducts } = useCollection<Product>(productsQuery);
  
  const productsMap = useMemo(() => {
    return dbProducts.reduce((acc, p) => ({ ...acc, [p.id!]: p.name }), {} as Record<string, string>);
  }, [dbProducts]);

  // 1. Buscar Clientes (para ficha técnica)
  const clientsQuery = useMemo(() => {
    if (!user) return null;
    return query(collection(db, "users"), where("role", "==", "client"));
  }, [db, user]);
  const { data: allClients } = useCollection<UserProfile>(clientsQuery);

  // 2. Buscar Instâncias de Onboarding
  const instancesQuery = useMemo(() => {
    if (!user) return null;
    return collection(db, "onboardingInstances");
  }, [db, user]);
  const { data: instances, loading: instancesLoading } = useCollection<OnboardingInstance>(instancesQuery);

  const selectedJourneyInstance = useMemo(() => 
    instances.find(inst => inst.id === journeyInstanceId), 
  [instances, journeyInstanceId]);

  // 3. Atividades Disponíveis: Instâncias sem responsável técnico
  const availableActivities = useMemo(() => {
    return instances.filter(inst => !inst.techId && inst.status === 'pending');
  }, [instances]);

  // 4. Meus Onboardings (Suporte)
  const myOnboardings = useMemo(() => {
    return instances.filter(inst => inst.techId === user?.uid && (inst.status === 'active' || inst.status === 'pending'));
  }, [instances, user]);

  const handleAssumeActivity = async (instance: OnboardingInstance) => {
    if (!user || !isSupport || !instance.id) return;

    try {
      await updateDoc(doc(db, "onboardingInstances", instance.id), {
        techId: user.uid,
        techName: user.displayName || 'Analista Suporte',
        status: 'active',
        updatedAt: serverTimestamp()
      });

      toast({
        title: "Atividade Assumida",
        description: `Você agora é o responsável técnico da ${instance.institutionName}.`,
      });
      setActiveTab("my");
    } catch (e) {
      toast({ variant: "destructive", title: "Erro", description: "Falha ao assumir atividade." });
    }
  };

  const handleCompleteActivation = async () => {
    if (!selectedJourneyInstance?.id || !user || !isSupport || isCompleting) return;
    setIsCompleting(true);

    const batch = writeBatch(db);
    const instanceRef = doc(db, "onboardingInstances", selectedJourneyInstance.id);
    const logRef = doc(collection(db, "system_logs"));

    try {
      // 1. Atualizar a Instância
      batch.update(instanceRef, {
        status: 'completed',
        operationalStatus: 'concluido',
        completedAt: new Date().toISOString(),
        completedBy: user.uid,
        completionObservation: completionNotes,
        updatedAt: serverTimestamp()
      });

      // 2. Registrar Log de Auditoria
      batch.set(logRef, {
        type: 'success',
        message: `Ativação Técnica Concluída: ${selectedJourneyInstance.productName || selectedJourneyInstance.productId}`,
        context: 'onboarding-completion',
        instanceId: selectedJourneyInstance.id,
        clientId: selectedJourneyInstance.clientId,
        institutionName: selectedJourneyInstance.institutionName,
        userId: user.uid,
        userName: user.displayName || user.email,
        timestamp: new Date().toISOString()
      });

      // 3. Verificar Status Institucional (Logica de Promoção para ATIVO)
      const otherInstancesQuery = query(
        collection(db, "onboardingInstances"),
        where("clientId", "==", selectedJourneyInstance.clientId)
      );
      const otherInstancesSnap = await getDocs(otherInstancesQuery);
      const allInstances = otherInstancesSnap.docs.map(d => d.data() as OnboardingInstance);
      
      const pendingInstances = allInstances.filter(i => i.id !== selectedJourneyInstance.id && i.status !== 'completed');
      
      // Se não houver mais nenhuma ativação pendente, marcamos o cliente como ATIVO
      if (pendingInstances.length === 0) {
        const clientRef = doc(db, "users", selectedJourneyInstance.clientId);
        batch.update(clientRef, {
          institutionalStatus: 'ativo',
          updatedAt: serverTimestamp()
        });
      }

      await batch.commit();

      toast({
        title: "Ativação Concluída",
        description: `A jornada de ${selectedJourneyInstance.institutionName} foi encerrada com sucesso.`,
      });
      
      setIsCompletionOpen(false);
      setCompletionNotes("");
    } catch (e: any) {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: instanceRef.path,
        operation: 'update',
        requestResourceData: { status: 'completed' }
      }));
    } finally {
      setIsCompleting(false);
    }
  };

  const handleDeleteInstance = async (id: string) => {
    if (!id || !isSupport) return;
    try {
      await deleteDoc(doc(db, "onboardingInstances", id));
      toast({ 
        title: "Atendimento Removido", 
        description: "O fluxo de ativação foi excluído com sucesso." 
      });
      if (journeyInstanceId === id) {
        setJourneyInstanceId(null);
        setJourneySteps([]);
        setActiveTab("my");
      }
    } catch (e) {
      toast({ 
        variant: "destructive", 
        title: "Erro na Remoção", 
        description: "Não foi possível excluir o atendimento." 
      });
    }
  };

  const openFlowSelection = async (instance: OnboardingInstance) => {
    setTargetInstance(instance);
    setSelectedFlowId("");
    setIsFetchingFlows(true);
    
    let productId = instance.productId;
    const productById = dbProducts.find(p => p.id === productId);
    if (!productById) {
      const foundProductByName = dbProducts.find(p => p.name.toLowerCase() === productId.toLowerCase());
      if (foundProductByName) productId = foundProductByName.id!;
    }

    try {
      const flowsRef = collection(db, "products", productId, "activationFlows");
      const snapshot = await getDocs(flowsRef);
      const flows = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as ActivationFlow));
      setAvailableFlows(flows);
      setIsFlowSelectionOpen(true);
    } catch (error) {
      toast({ variant: "destructive", title: "Erro", description: "Falha ao buscar roteiros técnicos." });
    } finally {
      setIsFetchingFlows(false);
    }
  };

  const handleSelectJourney = async (instance: OnboardingInstance) => {
    setJourneyInstanceId(instance.id!);
    setIsFetchingSteps(true);
    setJourneySteps([]);
    setExpandedStepId(null);
    
    let productId = instance.productId;
    const productById = dbProducts.find(p => p.id === productId);
    if (!productById) {
      const foundProductByName = dbProducts.find(p => p.name.toLowerCase() === productId.toLowerCase());
      if (foundProductByName) productId = foundProductByName.id!;
    }

    if (!instance.flowId) {
      setIsFetchingSteps(false);
      setActiveTab("journey");
      return;
    }

    try {
      const stepsRef = collection(db, "products", productId, "activationFlows", instance.flowId, "steps");
      const snapshot = await getDocs(query(stepsRef, orderBy("order", "asc")));
      const steps = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as FlowStep));
      setJourneySteps(steps);
      setActiveTab("journey");
    } catch (error) {
      toast({ variant: "destructive", title: "Erro", description: "Falha ao carregar roteiro." });
    } finally {
      setIsFetchingSteps(false);
    }
  };

  const handleSetFlow = async () => {
    if (!targetInstance?.id || !selectedFlowId || isSavingFlow) return;
    setIsSavingFlow(true);

    const instanceRef = doc(db, "onboardingInstances", targetInstance.id);
    const updateData = {
      flowId: selectedFlowId,
      currentStepOrder: 1, 
      updatedAt: serverTimestamp()
    };

    updateDoc(instanceRef, updateData)
      .then(() => {
        toast({ title: "Fluxo Ativado", description: "O roteiro técnico foi vinculado com sucesso." });
        setIsFlowSelectionOpen(false);
      })
      .catch((e) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: instanceRef.path,
          operation: 'update',
          requestResourceData: updateData
        }));
      })
      .finally(() => setIsSavingFlow(false));
  };

  const handleUpdateCurrentStep = async (instanceId: string, newStepOrder: number) => {
    if (isUpdatingStep || newStepOrder < 1) return;
    setIsUpdatingStep(true);

    const instanceRef = doc(db, "onboardingInstances", instanceId);
    try {
      await updateDoc(instanceRef, {
        currentStepOrder: newStepOrder,
        status: newStepOrder > journeySteps.length ? 'completed' : 'active',
        updatedAt: serverTimestamp()
      });
      
      const isAdvance = newStepOrder > (selectedJourneyInstance?.currentStepOrder || 0);
      toast({ 
        title: isAdvance ? "Etapa Concluída" : "Etapa Retornada",
        description: isAdvance ? `Avançamos para a etapa ${newStepOrder}.` : `Retornamos para a etapa ${newStepOrder}.`
      });
    } catch (e) {
      toast({ variant: "destructive", title: "Erro ao atualizar jornada" });
    } finally {
      setIsUpdatingStep(false);
    }
  };

  const handleViewFicha = (clientId: string) => {
    const client = allClients.find(c => c.id === clientId);
    if (client) {
      setSelectedClientForFicha(client);
      setIsFichaOpen(true);
    }
  };

  const getResponsibleIcon = (role: string) => {
    const iconClass = "size-3.5 text-muted-foreground";
    switch (role) {
      case 'suporte': return <Headset className={iconClass} />;
      case 'comercial': return <ShieldCheck className={iconClass} />;
      case 'cliente': return <User className={iconClass} />;
      case 'infraestrutura': return <HardDrive className={iconClass} />;
      case 'compliance': return <CheckCircle2 className={iconClass} />;
      default: return <User className={iconClass} />;
    }
  };

  const journeyProgress = useMemo(() => {
    if (!journeySteps.length) return 0;
    if (selectedJourneyInstance?.status === 'completed') return 100;
    const currentOrder = selectedJourneyInstance?.currentStepOrder || 1;
    return Math.min(100, Math.round(((currentOrder - 1) / journeySteps.length) * 100));
  }, [journeySteps, selectedJourneyInstance]);

  if (instancesLoading) {
    return <DashboardLayout role="admin"><div className="flex flex-col items-center justify-center p-20 gap-4"><Loader2 className="animate-spin text-primary size-10" /></div></DashboardLayout>;
  }

  return (
    <DashboardLayout role="admin">
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold font-headline text-foreground">Gestão de Onboarding</h1>
          <p className="text-muted-foreground">
            {isSupport ? "Monitore e avance a jornada técnica dos clientes ativados." : "Acompanhe a inicialização técnica do Comercial."}
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-muted p-1 h-12 rounded-xl">
            <TabsTrigger value="available" className="rounded-lg px-8 gap-2 data-[state=active]:bg-background transition-colors">
              <Zap className="size-4" /> Disponíveis ({availableActivities.length})
            </TabsTrigger>
            <TabsTrigger value="my" className="rounded-lg px-8 gap-2 data-[state=active]:bg-background transition-colors">
              <ClipboardList className="size-4" /> Meus Atendimentos ({myOnboardings.length})
            </TabsTrigger>
            <TabsTrigger value="journey" disabled={!journeyInstanceId} className="rounded-lg px-8 gap-2 data-[state=active]:bg-background transition-colors">
              <LayoutGrid className="size-4" /> Jornada Técnica
            </TabsTrigger>
          </TabsList>

          <TabsContent value="available" className="space-y-4">
            <div className="grid gap-4">
              {availableActivities.length > 0 ? (
                availableActivities.map((inst) => {
                  const client = allClients.find(c => c.id === inst.clientId);
                  return (
                    <Card key={inst.id} className="border-l-4 border-l-amber-500 overflow-hidden group hover:shadow-md transition-all bg-card">
                      <CardContent className="p-0">
                        <div className="flex flex-col md:flex-row">
                          <div className="p-6 flex-1 space-y-4">
                            <div className="flex justify-between items-start">
                              <div className="space-y-1">
                                <h3 className="text-xl font-bold text-foreground">{inst.institutionName}</h3>
                                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                  <span className="flex items-center gap-1 font-bold text-primary"><Zap className="size-3" /> {productsMap[inst.productId] || inst.productName || inst.productId}</span>
                                </div>
                              </div>
                              <Badge variant="outline" className="bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800">Novo Ticket / API</Badge>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-dashed">
                              <div className="space-y-1">
                                <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Consultor RTM</p>
                                <p className="text-xs font-semibold text-foreground flex items-center gap-2"><UserCircle className="size-3 text-primary" /> {client?.consultantName || 'Não informado'}</p>
                              </div>
                              <div className="space-y-1">
                                <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Ordem de Venda</p>
                                <p className="text-xs font-mono font-bold text-foreground flex items-center gap-2"><Hash className="size-3 text-primary" /> {client?.orderValue || 'Pendente'}</p>
                              </div>
                              <div className="space-y-1">
                                <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Responsável Cliente</p>
                                <p className="text-xs font-semibold text-foreground flex items-center gap-2"><User className="size-3 text-primary" /> {client?.displayName}</p>
                              </div>
                            </div>

                            <div className="text-[10px] text-muted-foreground font-medium flex items-center gap-2 pt-2">
                              <Clock className="size-3" /> Recebido em: {new Date(inst.startedAt).toLocaleString()}
                            </div>
                          </div>
                          <div className="bg-muted/10 md:w-64 flex flex-col gap-2 items-center justify-center p-6 border-l border-t md:border-t-0">
                            <Button variant="outline" className="w-full gap-2 font-bold bg-background" onClick={() => handleViewFicha(inst.clientId)}>
                              <Search className="size-4" /> Ver Ficha
                            </Button>
                            <Button className="w-full gap-2 font-bold shadow-lg" onClick={() => handleAssumeActivity(inst)}>
                              <UserPlus className="size-4" /> Assumir
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              ) : (
                <div className="p-20 text-center border-2 border-dashed rounded-3xl space-y-4 bg-muted/5">
                  <CheckCircle2 className="size-12 mx-auto text-emerald-500/20" />
                  <p className="text-muted-foreground text-sm font-medium">Nenhuma nova ativação pendente na fila.</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="my" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {myOnboardings.length > 0 ? (
                myOnboardings.map((inst) => (
                  <Card key={inst.id} className="hover:border-primary/40 transition-all overflow-hidden border-2 bg-card shadow-sm">
                    <CardHeader className="bg-muted/30 p-4 border-b flex flex-row justify-between items-center">
                      <div className="flex items-center gap-2">
                        {inst.flowId ? (
                           <Badge className="bg-emerald-500 text-[9px] uppercase">Fluxo Ativo</Badge>
                        ) : (
                           <Badge variant="destructive" className="text-[9px] uppercase animate-pulse">Pendente Seleção</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] text-muted-foreground font-bold">{new Date(inst.startedAt).toLocaleDateString()}</span>
                        {isSupport && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="size-6 text-muted-foreground hover:text-destructive transition-colors">
                                <Trash2 className="size-3.5" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="bg-card">
                              <AlertDialogHeader>
                                <AlertDialogTitle>Excluir Atendimento?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Esta ação removerá permanentemente a jornada de <strong>{inst.institutionName}</strong>. 
                                  As interações registradas e arquivos enviados permanecerão na base para auditoria, mas o progresso atual será perdido.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteInstance(inst.id!)} className="bg-destructive text-white hover:bg-destructive/90 font-bold">
                                  Excluir Atendimento
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="p-6 space-y-6">
                      <div className="space-y-1">
                        <h4 className="font-bold text-xl text-foreground">{inst.institutionName}</h4>
                        <p className="text-sm text-muted-foreground flex items-center gap-2">
                          <Briefcase className="size-3.5" /> Produto: <strong>{productsMap[inst.productId] || inst.productName || inst.productId}</strong>
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <Button variant="outline" className="w-full rounded-xl font-bold text-xs" onClick={() => handleViewFicha(inst.clientId)}>Ficha</Button>
                        {inst.flowId ? (
                          <Button className="w-full rounded-xl font-bold text-xs gap-2" onClick={() => handleSelectJourney(inst)}>
                            <ArrowRight className="size-3" /> Ver Jornada
                          </Button>
                        ) : (
                          <Button className="w-full rounded-xl font-bold text-xs gap-2 bg-amber-600 hover:bg-amber-700" onClick={() => openFlowSelection(inst)}>
                            Definir Fluxo
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="col-span-full p-20 text-center border-2 border-dashed rounded-3xl bg-muted/5">
                  <p className="text-muted-foreground text-sm font-medium">Você ainda não assumiu atendimentos.</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="journey" className="space-y-8 animate-in fade-in duration-500">
            {selectedJourneyInstance ? (
              <div className="space-y-8">
                <div className="bg-card rounded-3xl p-8 shadow-sm border space-y-6 relative overflow-hidden">
                  {!selectedJourneyInstance?.flowId && selectedJourneyInstance.status !== 'completed' && (
                    <div className="absolute inset-0 bg-background/80 backdrop-blur-[2px] z-50 flex flex-col items-center justify-center p-12 text-center space-y-4">
                      <Settings2 className="size-12 text-amber-500 animate-spin" />
                      <div className="space-y-1">
                        <h3 className="text-xl font-bold text-foreground">Roteiro em Definição</h3>
                        <p className="text-sm text-muted-foreground max-w-md">Selecione um roteiro técnico para este cliente para habilitar as etapas.</p>
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 relative z-10">
                    <div className="space-y-2">
                      <Badge variant="outline" className={cn(
                        "gap-1.5 px-3 py-1 font-bold",
                        selectedJourneyInstance.status === 'completed' ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-primary/5 text-primary border-primary/20"
                      )}>
                        <CheckCircle2 className="size-3.5" /> {selectedJourneyInstance.status === 'completed' ? "JORNADA CONCLUÍDA" : "JORNADA TÉCNICA ATIVA"}
                      </Badge>
                      <h2 className="text-3xl font-bold font-headline text-foreground">{selectedJourneyInstance.institutionName} - {productsMap[selectedJourneyInstance.productId] || selectedJourneyInstance.productName || selectedJourneyInstance.productId}</h2>
                      <p className="text-muted-foreground font-medium">Analista Responsável: <span className="text-foreground font-bold">{selectedJourneyInstance.techName}</span></p>
                    </div>
                    <div className="text-right flex flex-col items-end gap-4">
                      {isSupport && selectedJourneyInstance.status !== 'completed' && (
                        <AlertDialog open={isCompletionOpen} onOpenChange={setIsCompletionOpen}>
                          <AlertDialogTrigger asChild>
                            <Button className="bg-emerald-600 hover:bg-emerald-700 font-black gap-2 shadow-lg h-12 px-8 rounded-xl group">
                              <Flag className="size-4 group-hover:scale-125 transition-transform" />
                              Concluir Ativação
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="bg-card rounded-3xl border-2">
                            <AlertDialogHeader>
                              <AlertDialogTitle className="text-2xl font-headline flex items-center gap-3">
                                <CheckCircle2 className="size-7 text-emerald-500" /> Concluir Ativação Técnica?
                              </AlertDialogTitle>
                              <AlertDialogDescription className="text-base">
                                Esta ação encerrará a jornada técnica de <strong>{selectedJourneyInstance.institutionName}</strong> e atualizará seu status na Gestão de Clientes para <strong>Concluída</strong>.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <div className="py-4 space-y-2">
                              <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Observações de Fechamento (Opcional)</Label>
                              <Textarea 
                                placeholder="Descreva os resultados finais, evidências coletadas ou observações para o comercial..."
                                value={completionNotes}
                                onChange={e => setCompletionNotes(e.target.value)}
                                className="min-h-[100px] rounded-2xl"
                              />
                            </div>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="rounded-xl font-bold">Voltar ao Projeto</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={handleCompleteActivation} 
                                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black px-8"
                                disabled={isCompleting}
                              >
                                {isCompleting ? <Loader2 className="size-4 animate-spin mr-2" /> : <Zap className="size-4 mr-2" />}
                                Confirmar Conclusão
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                      
                      {selectedJourneyInstance.status === 'completed' && (
                        <div className="bg-emerald-50 border border-emerald-200 p-3 px-6 rounded-2xl flex flex-col items-end shadow-inner">
                           <p className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">Finalizado em:</p>
                           <p className="text-sm font-bold text-emerald-900">{selectedJourneyInstance.completedAt ? new Date(selectedJourneyInstance.completedAt).toLocaleDateString() : 'N/A'}</p>
                        </div>
                      )}

                      <div className="text-right">
                        <span className="text-5xl font-black text-primary">{journeyProgress}%</span>
                        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-1">Concluído</p>
                      </div>
                    </div>
                  </div>
                  <Progress value={journeyProgress} className="h-3 rounded-full" />
                </div>

                <div className="space-y-6">
                  <h3 className="text-lg font-bold font-headline flex items-center gap-2 text-foreground">
                    <ClipboardList className="size-5 text-primary" /> Etapas do Projeto
                  </h3>
                  
                  {journeySteps.length > 0 ? (
                    <div className="relative pl-8 space-y-6 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-border">
                      {journeySteps.map((step) => {
                        const isCompleted = step.order < (selectedJourneyInstance.currentStepOrder || 1) || selectedJourneyInstance.status === 'completed';
                        const isCurrent = step.order === (selectedJourneyInstance.currentStepOrder || 1) && selectedJourneyInstance.status !== 'completed';
                        const isExpanded = expandedStepId === step.id;

                        return (
                          <div key={step.id} className="relative">
                            <div className={cn(
                              "absolute -left-[29px] top-1 size-6 rounded-full border-2 flex items-center justify-center transition-all z-10 bg-background",
                              isCompleted ? "border-emerald-500 bg-emerald-500 text-white" : 
                              isCurrent ? "border-primary bg-primary text-white animate-pulse" : 
                              "border-border text-muted-foreground"
                            )}>
                              {isCompleted ? <CheckCircle2 className="size-3.5" /> : <span className="text-[10px] font-bold">{step.order}</span>}
                            </div>
                            <Card className={cn(
                              "transition-all duration-300 bg-card",
                              isCurrent ? "ring-2 ring-primary/20 shadow-lg border-primary/40" : 
                              (step.order > (selectedJourneyInstance.currentStepOrder || 1) && selectedJourneyInstance.status !== 'completed') ? "opacity-60" : "hover:border-primary/30"
                            )}>
                              <CardHeader className="p-5 flex flex-row items-center justify-between cursor-pointer" onClick={() => setExpandedStepId(isExpanded ? null : step.id!)}>
                                <div className="flex-1 space-y-1">
                                  <div className="flex items-center gap-3">
                                    <CardTitle className={cn("text-base font-bold", isCompleted ? "text-muted-foreground" : "text-foreground")}>{step.name}</CardTitle>
                                    <Badge variant="outline" className="text-[9px] uppercase font-bold bg-muted/20 text-muted-foreground border-border gap-1 px-2 py-0.5">
                                      {getResponsibleIcon(step.responsible)} {step.responsible}
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
                                      <div className="grid grid-cols-2 gap-4">
                                         <div className="space-y-1">
                                            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">SLA</p>
                                            <p className="text-xs font-bold flex items-center gap-2 text-foreground"><Clock className="size-3" /> {step.estimatedTimeInHours}h Úteis</p>
                                         </div>
                                         <div className="space-y-1">
                                            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Ação</p>
                                            <p className="text-xs font-bold flex items-center gap-2 text-foreground"><FileText className="size-3" /> {step.type === 'upload' ? 'Evidência Requerida' : 'Formulário Interno'}</p>
                                         </div>
                                      </div>
                                      <div className="p-4 rounded-xl bg-background border border-border text-sm text-foreground leading-relaxed font-medium">
                                        {step.description}
                                      </div>
                                      {isCurrent && isSupport && selectedJourneyInstance.status !== 'completed' && (
                                        <div className="flex gap-3 pt-4 border-t">
                                          {step.order > 1 && (
                                            <Button 
                                              variant="outline" 
                                              className="flex-1 font-bold gap-2 rounded-full border-2 text-foreground" 
                                              onClick={() => handleUpdateCurrentStep(selectedJourneyInstance.id!, step.order - 1)} 
                                              disabled={isUpdatingStep}
                                            >
                                              <ArrowLeft className="size-4" /> Voltar
                                            </Button>
                                          )}
                                          <Button 
                                            className="flex-[2] font-bold gap-2 rounded-full px-8" 
                                            onClick={() => handleUpdateCurrentStep(selectedJourneyInstance.id!, step.order + 1)} 
                                            disabled={isUpdatingStep}
                                          >
                                            {isUpdatingStep ? <Loader2 className="size-4 animate-spin" /> : <ChevronRight className="size-4" />}
                                            {step.order === journeySteps.length ? "Finalizar" : "Concluir Etapa"}
                                          </Button>
                                        </div>
                                      )}
                                      {!isCurrent && isSupport && step.order < (selectedJourneyInstance.currentStepOrder || 1) && selectedJourneyInstance.status !== 'completed' && (
                                        <div className="pt-4 border-t">
                                          <Button 
                                            variant="ghost" 
                                            className="w-full font-bold gap-2 text-muted-foreground hover:text-primary transition-colors"
                                            onClick={() => handleUpdateCurrentStep(selectedJourneyInstance.id!, step.order)}
                                            disabled={isUpdatingStep}
                                          >
                                            <RotateCcw className="size-3.5" /> Reabrir esta etapa
                                          </Button>
                                        </div>
                                      )}
                                    </div>
                                    <div className="lg:col-span-2">
                                      <StepInteractions 
                                        instanceId={selectedJourneyInstance.id!}
                                        stepId={step.id!}
                                        clientId={selectedJourneyInstance.clientId}
                                        canInteract={isAdminUser && selectedJourneyInstance.status !== 'completed'}
                                        userName={profile?.displayName}
                                        userRole={profile?.adminType || 'admin'}
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
                    <div className="p-20 text-center border-2 border-dashed rounded-3xl bg-muted/10">
                      <p className="text-sm text-muted-foreground">Nenhuma etapa encontrada para este fluxo.</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-20 text-center border-2 border-dashed rounded-3xl bg-muted/5">
                <p className="text-muted-foreground text-sm font-medium">Selecione um atendimento na aba anterior para ver a jornada.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Diálogos Auxiliares */}
      <Dialog open={isFlowSelectionOpen} onOpenChange={setIsFlowSelectionOpen}>
        <DialogContent className="rounded-3xl bg-card border-border shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-foreground">Definir Roteiro Técnico</DialogTitle>
            <DialogDescription className="text-muted-foreground">Selecione o fluxo para {targetInstance?.institutionName}.</DialogDescription>
          </DialogHeader>
          <div className="py-6 space-y-4">
            <Select value={selectedFlowId} onValueChange={setSelectedFlowId}>
              <SelectTrigger className="h-14 bg-background text-foreground border-border"><SelectValue placeholder="Selecione o roteiro..." /></SelectTrigger>
              <SelectContent className="bg-card">
                {availableFlows.map(f => (
                  <SelectItem key={f.id} value={f.id!}>
                    <span className="font-bold text-sm">{f.name}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFlowSelectionOpen(false)} className="text-foreground">Cancelar</Button>
            <Button disabled={!selectedFlowId || isSavingFlow} onClick={handleSetFlow} className="font-bold px-8">Ativar Roteiro</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isFichaOpen} onOpenChange={setIsFichaOpen}>
        <DialogContent className="max-w-3xl overflow-hidden rounded-3xl p-0 bg-card border-border shadow-2xl">
          <DialogHeader className="p-8 bg-slate-900 text-white">
            <DialogTitle className="text-2xl flex items-center gap-3">
              <FileText className="size-6 text-primary" /> Ficha Técnica OnFlow
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Dados mestres integrados do ERP e Gestão Comercial.
            </DialogDescription>
          </DialogHeader>
          
          <div className="p-8 space-y-8 bg-card max-h-[70vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-1">
                <Label className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1.5"><Building2 className="size-3" /> Instituição</Label>
                <p className="font-bold text-foreground text-base">{selectedClientForFicha?.institutionName}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1.5"><Hash className="size-3" /> CNPJ</Label>
                <p className="font-mono text-foreground font-medium">{selectedClientForFicha?.cnpj || "N/A"}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1.5"><UserCircle className="size-3" /> Responsável do Cliente</Label>
                <p className="font-bold text-foreground">{selectedClientForFicha?.displayName}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1.5"><Mail className="size-3" /> E-mail de Contato</Label>
                <p className="text-muted-foreground font-medium">{selectedClientForFicha?.email}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1.5"><ShieldCheck className="size-3" /> Consultor RTM</Label>
                <p className="text-foreground font-bold">{selectedClientForFicha?.consultantName || "Não informado"}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1.5"><Phone className="size-3" /> Telefone</Label>
                <p className="text-foreground font-bold">{selectedClientForFicha?.phoneNumber || "Não informado"}</p>
              </div>
            </div>
            
            <div className="space-y-6 pt-6 border-t border-border">
               <div className="p-6 rounded-2xl bg-primary/5 border border-primary/10 flex items-center justify-between shadow-sm">
                <div>
                  <Label className="text-[10px] uppercase font-bold text-primary flex items-center gap-1.5"><Hash className="size-3" /> OV (Ordem de Venda)</Label>
                  <p className="font-mono font-black text-2xl text-foreground mt-1">{selectedClientForFicha?.orderValue || 'Pendente'}</p>
                </div>
                <div className="text-right">
                  <Badge className="bg-primary/20 text-primary border-primary/30 uppercase text-[9px] font-black">Dados de Ativação</Badge>
                </div>
               </div>

               <div className="p-6 rounded-2xl bg-muted/50 border border-border shadow-inner">
                  <div className="flex items-center gap-2 mb-3 text-muted-foreground">
                    <MessageSquare className="size-4 text-primary" />
                    <Label className="text-[10px] uppercase font-bold">Observações Importantes (Comercial)</Label>
                  </div>
                  <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap font-medium bg-background/50 p-4 rounded-xl border border-border/50">
                    {selectedClientForFicha?.commercialNotes || "Nenhuma observação inserida pelo comercial ou API."}
                  </p>
               </div>
            </div>
          </div>
          
          <DialogFooter className="p-6 bg-muted/10 border-t">
            <Button className="w-full font-bold h-12 rounded-xl shadow-lg" onClick={() => setIsFichaOpen(false)}>
              Fechar Ficha Técnica
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
