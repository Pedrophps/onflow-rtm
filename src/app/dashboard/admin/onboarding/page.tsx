
'use client';

import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
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
  Info,
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
  LayoutGrid
} from "lucide-react";
import { useCollection, useFirestore, useUser, useDoc } from "@/firebase";
import { collection, query, where, doc, updateDoc, serverTimestamp, addDoc, getDocs, orderBy } from "firebase/firestore";
import { useMemo, useState, useEffect } from "react";
import { UserProfile, OnboardingInstance, ActivationFlow, Product, FlowStep } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";

export default function OnboardingManagement() {
  const db = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  
  const userRef = useMemo(() => (user ? doc(db, "users", user.uid) : null), [user, db]);
  const { data: profile } = useDoc<UserProfile>(userRef);
  const isSupport = profile?.adminType === 'suporte';

  const [activeTab, setActiveTab] = useState("available");
  const [selectedClientForFicha, setSelectedClientForFicha] = useState<UserProfile | null>(null);
  const [isFichaOpen, setIsFichaOpen] = useState(false);
  
  const [isFlowSelectionOpen, setIsFlowSelectionOpen] = useState(false);
  const [targetInstance, setTargetInstance] = useState<OnboardingInstance | null>(null);
  const [availableFlows, setAvailableFlows] = useState<ActivationFlow[]>([]);
  const [selectedFlowId, setSelectedFlowId] = useState("");
  const [isSavingFlow, setIsSavingFlow] = useState(false);
  const [isAdvancing, setIsAdvancing] = useState(false);
  const [isFetchingFlows, setIsFetchingFlows] = useState(false);

  // Estados para Visão de Jornada
  const [isJourneyOpen, setIsJourneyOpen] = useState(false);
  const [journeyInstance, setJourneyInstance] = useState<OnboardingInstance | null>(null);
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

  // 1. Buscar Clientes Aprovados
  const clientsQuery = useMemo(() => {
    if (!user) return null;
    return query(
      collection(db, "users"), 
      where("role", "==", "client"),
      where("status", "==", "approved")
    );
  }, [db, user]);
  const { data: approvedClients, loading: clientsLoading } = useCollection<UserProfile>(clientsQuery);

  // 2. Buscar Instâncias de Onboarding
  const instancesQuery = useMemo(() => {
    if (!user) return null;
    return query(collection(db, "onboardingInstances"));
  }, [db, user]);
  const { data: instances, loading: instancesLoading } = useCollection<OnboardingInstance>(instancesQuery);

  // 3. Cruzamento para Suporte: Disponíveis (Não assumidos)
  const availableActivities = useMemo(() => {
    return approvedClients.filter(client => {
      const instance = instances.find(inst => inst.clientId === client.id);
      return !instance || !instance.techId;
    });
  }, [approvedClients, instances]);

  // 4. Meus Onboardings (Suporte)
  const myOnboardings = useMemo(() => {
    return instances.filter(inst => inst.techId === user?.uid && inst.status === 'active');
  }, [instances, user]);

  const handleAssumeActivity = async (client: UserProfile) => {
    if (!user || !isSupport) return;

    const instanceData = {
      clientId: client.id,
      institutionName: client.institutionName || client.displayName,
      productId: client.activeProduct, 
      techId: user.uid,
      techName: user.displayName || 'Analista Suporte',
      status: 'active',
      currentStepOrder: 1,
      startedAt: new Date().toISOString(),
      updatedAt: serverTimestamp()
    };

    try {
      const existingInstance = instances.find(inst => inst.clientId === client.id);
      if (existingInstance?.id) {
        await updateDoc(doc(db, "onboardingInstances", existingInstance.id), {
          techId: user.uid,
          techName: user.displayName || 'Analista Suporte',
          status: 'active',
          updatedAt: serverTimestamp()
        });
      } else {
        await addDoc(collection(db, "onboardingInstances"), instanceData);
      }

      toast({
        title: "Atividade Assumida",
        description: `Você agora é o responsável técnico da ${client.institutionName}.`,
      });
      setActiveTab("my");
    } catch (e) {
      toast({ variant: "destructive", title: "Erro", description: "Falha ao assumir atividade." });
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
      if (foundProductByName) {
        productId = foundProductByName.id!;
      }
    }

    try {
      const flowsRef = collection(db, "products", productId, "activationFlows");
      const snapshot = await getDocs(flowsRef);
      const flows = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as ActivationFlow));
      
      setAvailableFlows(flows);
      setIsFlowSelectionOpen(true);
    } catch (error) {
      console.error("Error fetching flows:", error);
      toast({ variant: "destructive", title: "Erro", description: "Falha ao buscar roteiros técnicos." });
    } finally {
      setIsFetchingFlows(false);
    }
  };

  const openJourneyView = async (instance: OnboardingInstance) => {
    setJourneyInstance(instance);
    setIsFetchingSteps(true);
    setJourneySteps([]);
    
    let productId = instance.productId;
    const productById = dbProducts.find(p => p.id === productId);
    if (!productById) {
      const foundProductByName = dbProducts.find(p => p.name.toLowerCase() === productId.toLowerCase());
      if (foundProductByName) productId = foundProductByName.id!;
    }

    if (!instance.flowId) {
      setIsFetchingSteps(false);
      setIsJourneyOpen(true);
      return;
    }

    try {
      const stepsRef = collection(db, "products", productId, "activationFlows", instance.flowId, "steps");
      const snapshot = await getDocs(query(stepsRef, orderBy("order", "asc")));
      const steps = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as FlowStep));
      setJourneySteps(steps);
      setIsJourneyOpen(true);
    } catch (error) {
      console.error("Error fetching steps:", error);
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

  const handleAdvanceStep = async (instanceId: string, currentStep: number) => {
    if (isAdvancing) return;
    setIsAdvancing(true);

    const instanceRef = doc(db, "onboardingInstances", instanceId);
    try {
      await updateDoc(instanceRef, {
        currentStepOrder: currentStep + 1,
        updatedAt: serverTimestamp()
      });
      toast({ title: "Próxima Etapa Ativada" });
      if (journeyInstance?.id === instanceId) {
        setJourneyInstance(prev => prev ? {...prev, currentStepOrder: currentStep + 1} : null);
      }
    } catch (e) {
      toast({ variant: "destructive", title: "Erro ao avançar" });
    } finally {
      setIsAdvancing(false);
    }
  };

  const handleViewFicha = (clientId: string) => {
    const client = approvedClients.find(c => c.id === clientId);
    if (client) {
      setSelectedClientForFicha(client);
      setIsFichaOpen(true);
    }
  };

  const getResponsibleIcon = (role: string) => {
    const iconClass = "size-3.5 text-slate-500";
    switch (role) {
      case 'suporte': return <Headset className={iconClass} />;
      case 'comercial': return <ShieldCheck className={iconClass} />;
      case 'cliente': return <User className={iconClass} />;
      case 'infraestrutura': return <HardDrive className={iconClass} />;
      case 'compliance': return <CheckCircle2 className={iconClass} />;
      default: return <User className={iconClass} />;
    }
  };

  if (clientsLoading || instancesLoading) {
    return <DashboardLayout role="admin"><div className="flex flex-col items-center justify-center p-20 gap-4"><Loader2 className="animate-spin text-primary size-10" /></div></DashboardLayout>;
  }

  return (
    <DashboardLayout role="admin">
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold font-headline text-slate-900">Gestão de Onboarding</h1>
          <p className="text-muted-foreground">
            {isSupport ? "Monitore e avance a jornada técnica dos clientes ativados." : "Acompanhe a inicialização técnica do Comercial."}
          </p>
        </div>

        {isSupport ? (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="bg-slate-100 p-1 h-12 rounded-xl">
              <TabsTrigger value="available" className="rounded-lg px-8 gap-2 data-[state=active]:bg-white">
                <Zap className="size-4" /> Atividades Disponíveis
                <Badge variant="secondary" className="ml-2">{availableActivities.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="my" className="rounded-lg px-8 gap-2 data-[state=active]:bg-white">
                <ClipboardList className="size-4" /> Meus Atendimentos
                <Badge variant="secondary" className="ml-2">{myOnboardings.length}</Badge>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="available" className="space-y-4">
              <div className="grid gap-4">
                {availableActivities.length > 0 ? (
                  availableActivities.map((client) => (
                    <Card key={client.id} className="border-l-4 border-l-amber-500 overflow-hidden group hover:shadow-md transition-all">
                      <CardContent className="p-0">
                        <div className="flex flex-col md:flex-row">
                          <div className="p-6 flex-1 space-y-4">
                            <div className="flex justify-between items-start">
                              <div className="space-y-1">
                                <h3 className="text-xl font-bold text-slate-900">{client.institutionName}</h3>
                                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                  <span className="flex items-center gap-1"><Building2 className="size-3" /> {client.cnpj}</span>
                                  <span className="flex items-center gap-1 font-bold text-primary"><Zap className="size-3" /> {productsMap[client.activeProduct!] || client.activeProduct}</span>
                                </div>
                              </div>
                              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Aguardando Analista</Badge>
                            </div>

                            <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-3 rounded-lg border">
                              <div className="space-y-1">
                                <p className="text-muted-foreground uppercase font-black text-[9px] tracking-widest">Contato Cliente</p>
                                <p className="font-bold flex items-center gap-1.5">{client.displayName}</p>
                                <p className="text-slate-500">{client.email}</p>
                              </div>
                              <div className="space-y-1">
                                <p className="text-muted-foreground uppercase font-black text-[9px] tracking-widest">Aprovação</p>
                                <p className="font-bold text-slate-700">{client.approvedAt ? new Date(client.approvedAt).toLocaleDateString() : 'N/A'}</p>
                                <p className="text-slate-500">ID RTM: {client.clientCode || 'Pendente'}</p>
                              </div>
                            </div>
                          </div>
                          <div className="bg-slate-50 md:w-48 flex items-center justify-center p-6 border-l border-t md:border-t-0">
                            <Button className="w-full gap-2 font-bold shadow-lg" onClick={() => handleAssumeActivity(client)}>
                              <UserPlus className="size-4" /> Assumir
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="p-20 text-center border-2 border-dashed rounded-3xl space-y-4">
                    <CheckCircle2 className="size-12 mx-auto text-emerald-500/20" />
                    <p className="text-muted-foreground">Nenhum cliente aprovado aguardando suporte no momento.</p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="my" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                {myOnboardings.length > 0 ? (
                  myOnboardings.map((inst) => (
                    <Card key={inst.id} className="hover:border-primary/40 transition-all overflow-hidden border-2">
                      <CardHeader className="bg-slate-50 p-4 border-b flex flex-row justify-between items-center">
                        <div className="flex items-center gap-2">
                          {inst.flowId ? (
                             <Badge className="bg-emerald-500 text-[9px] uppercase">Fluxo em Execução</Badge>
                          ) : (
                             <Badge variant="destructive" className="text-[9px] uppercase animate-pulse">Pendente Seleção de Roteiro</Badge>
                          )}
                        </div>
                        <span className="text-[10px] text-muted-foreground font-bold">{new Date(inst.startedAt).toLocaleDateString()}</span>
                      </CardHeader>
                      <CardContent className="p-6 space-y-6">
                        <div className="space-y-1">
                          <h4 className="font-bold text-xl">{inst.institutionName}</h4>
                          <p className="text-sm text-muted-foreground flex items-center gap-2">
                            <Briefcase className="size-3.5" /> Produto: <strong>{productsMap[inst.productId] || inst.productId}</strong>
                          </p>
                        </div>

                        {inst.flowId && (
                           <div className="bg-primary/5 p-3 rounded-xl border border-primary/10">
                              <div className="flex justify-between items-center mb-1">
                                <span className="text-[10px] font-bold text-primary uppercase">Progresso Atual</span>
                                <span className="text-xs font-black text-primary">Etapa {inst.currentStepOrder}</span>
                              </div>
                              <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full bg-primary" style={{ width: '30%' }} />
                              </div>
                           </div>
                        )}
                        
                        <div className="grid grid-cols-2 gap-2">
                          <Button 
                            variant="outline" 
                            className="w-full rounded-xl font-bold text-xs"
                            onClick={() => handleViewFicha(inst.clientId)}
                          >
                            Ver Ficha
                          </Button>
                          {inst.flowId ? (
                            <Button 
                              className="w-full rounded-xl font-bold text-xs gap-2"
                              onClick={() => openJourneyView(inst)}
                              disabled={isFetchingSteps}
                            >
                              {isFetchingSteps ? <Loader2 className="size-3 animate-spin" /> : <ChevronRight className="size-3" />}
                              Ver Jornada
                            </Button>
                          ) : (
                            <Button 
                              className="w-full rounded-xl font-bold text-xs gap-2 bg-amber-600 hover:bg-amber-700"
                              onClick={() => openFlowSelection(inst)}
                              disabled={isFetchingFlows}
                            >
                              {isFetchingFlows ? <Loader2 className="size-3 animate-spin" /> : <Settings2 className="size-3" />}
                              Definir Fluxo
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="col-span-full p-20 text-center border-2 border-dashed rounded-3xl">
                    <p className="text-muted-foreground">Você ainda não assumiu atendimentos para ativação.</p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        ) : (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Monitoramento de Ativação (Comercial)</CardTitle>
              <CardDescription>Acompanhe se o time de suporte já iniciou o processo técnico de seus clientes.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Instituição</TableHead>
                    <TableHead>Produto</TableHead>
                    <TableHead>Status Ativação</TableHead>
                    <TableHead>Etapa Atual</TableHead>
                    <TableHead>Responsável Técnico</TableHead>
                    <TableHead className="text-right">Acompanhar</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {instances.length > 0 ? instances.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-bold text-xs">{item.institutionName}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-[11px] font-bold text-primary">{productsMap[item.productId] || item.productId}</TableCell>
                      <TableCell>
                        <Badge variant={item.techId ? 'default' : 'secondary'} className="text-[9px] uppercase">
                          {item.techId ? 'Em Atendimento' : 'Fila de Suporte'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className={cn(
                          "text-[11px] font-bold",
                          item.flowId ? "text-emerald-600" : "text-amber-500"
                        )}>
                          {item.flowId ? `Etapa ${item.currentStepOrder}` : 'Aguardando Fluxo'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-[11px]">
                          {item.techId ? (
                            <><UserCheck className="size-3.5 text-emerald-500" /> <span className="font-medium text-slate-700">{item.techName}</span></>
                          ) : (
                            <span className="text-muted-foreground italic">Pendente</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-slate-400 hover:text-primary"
                          onClick={() => openJourneyView(item)}
                        >
                          <ArrowRight className="size-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  )) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">Nenhuma ativação em curso.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Diálogo de Seleção de Fluxo */}
      <Dialog open={isFlowSelectionOpen} onOpenChange={setIsFlowSelectionOpen}>
        <DialogContent className="rounded-3xl">
          <DialogHeader>
            <div className="size-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-2">
              <GitFork className="size-6" />
            </div>
            <DialogTitle>Definir Roteiro Técnico</DialogTitle>
            <DialogDescription>
              Selecione o fluxo que será aplicado à instituição <strong>{targetInstance?.institutionName}</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="py-6 space-y-4">
            <div className="space-y-2">
              <Label>Fluxos Técnicos Cadastrados</Label>
              <Select value={selectedFlowId} onValueChange={setSelectedFlowId}>
                <SelectTrigger className="h-14">
                  <SelectValue placeholder="Selecione o roteiro de etapas..." />
                </SelectTrigger>
                <SelectContent>
                  {availableFlows.length > 0 ? availableFlows.map(f => (
                    <SelectItem key={f.id} value={f.id!}>
                      <div className="flex flex-col text-left py-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm">{f.name}</span>
                          {!f.published && <Badge variant="outline" className="text-[8px] h-4 uppercase font-black bg-slate-100">Rascunho</Badge>}
                        </div>
                        <span className="text-[10px] text-muted-foreground truncate max-w-[320px]">{f.description}</span>
                      </div>
                    </SelectItem>
                  )) : (
                    <div className="p-8 text-center space-y-2">
                      <AlertTriangle className="size-6 mx-auto text-amber-500" />
                      <p className="text-xs text-muted-foreground font-medium">Nenhum fluxo encontrado para este produto.</p>
                      <p className="text-[10px] text-muted-foreground italic">Cadastre fluxos na aba "Produtos & Fluxos" primeiro.</p>
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFlowSelectionOpen(false)}>Cancelar</Button>
            <Button disabled={!selectedFlowId || isSavingFlow} onClick={handleSetFlow} className="font-bold px-8">
              {isSavingFlow ? <Loader2 className="size-4 animate-spin mr-2" /> : <CheckCircle2 className="size-4 mr-2" />}
              Ativar Roteiro
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo da Ficha Cadastral */}
      <Dialog open={isFichaOpen} onOpenChange={setIsFichaOpen}>
        <DialogContent className="max-w-2xl overflow-hidden rounded-3xl p-0">
          <DialogHeader className="p-8 bg-slate-900 text-white relative">
            <div className="flex items-center gap-4 mb-2">
              <div className="size-12 rounded-2xl bg-primary flex items-center justify-center">
                <Building2 className="size-6" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-headline">Ficha Técnica OnFlow</DialogTitle>
                <DialogDescription className="text-slate-400">Dados consolidados do cliente.</DialogDescription>
              </div>
            </div>
          </DialogHeader>
          
          <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-1">
                <Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Instituição</Label>
                <p className="font-bold text-lg text-slate-900">{selectedClientForFicha?.institutionName || '-'}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">CNPJ</Label>
                <p className="font-mono text-slate-700">{selectedClientForFicha?.cnpj || '-'}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Responsável</Label>
                <p className="font-bold text-slate-900">{selectedClientForFicha?.displayName || '-'}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">E-mail</Label>
                <p className="text-slate-700 flex items-center gap-2"><Mail className="size-3.5" /> {selectedClientForFicha?.email || '-'}</p>
              </div>
              <div className="space-y-1 col-span-2">
                <Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Contato Direto</Label>
                <p className="text-slate-700 flex items-center gap-2 font-bold"><Phone className="size-3.5 text-primary" /> {selectedClientForFicha?.phoneNumber || 'Não informado'}</p>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-primary/5 border border-primary/10 flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-[10px] uppercase font-bold text-primary tracking-widest">Produto</Label>
                <div className="flex items-center gap-2 font-black text-xl text-primary">
                  <Zap className="size-5 fill-current" />
                  {productsMap[selectedClientForFicha?.activeProduct!] || selectedClientForFicha?.activeProduct || 'N/A'}
                </div>
              </div>
              <div className="text-right space-y-1">
                <Label className="text-[10px] uppercase font-bold text-primary tracking-widest">ID RTM</Label>
                <p className="font-mono font-black text-lg">
                  {selectedClientForFicha?.clientCode || 'Pendente'}
                </p>
              </div>
            </div>
          </div>

          <DialogFooter className="p-6 bg-slate-50 border-t">
            <Button className="w-full font-bold" onClick={() => setIsFichaOpen(false)}>
              Fechar Ficha Técnica
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo de Visão da Jornada */}
      <Dialog open={isJourneyOpen} onOpenChange={setIsJourneyOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 gap-1.5 px-3 py-1 font-bold">
                  <CheckCircle2 className="size-3.5" /> JORNADA TÉCNICA
                </Badge>
                <DialogTitle className="text-3xl font-bold font-headline">
                  {journeyInstance?.institutionName} - {productsMap[journeyInstance?.productId!] || journeyInstance?.productId}
                </DialogTitle>
                <p className="text-muted-foreground font-medium">Analista RTM: <span className="text-foreground font-bold">{journeyInstance?.techName || 'Pendente'}</span></p>
              </div>
              <div className="text-right">
                {journeySteps.length > 0 && (
                  <>
                    <span className="text-5xl font-black text-primary">
                      {Math.min(100, Math.round(((Math.max(0, (journeyInstance?.currentStepOrder || 1) - 1)) / journeySteps.length) * 100))}%
                    </span>
                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-1">Concluído</p>
                  </>
                )}
              </div>
            </div>
          </DialogHeader>

          <div className="py-8 space-y-10">
            {journeySteps.length > 0 ? (
              <>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold text-muted-foreground uppercase">
                    <span>Progresso do Projeto</span>
                    <span>Etapa {journeyInstance?.currentStepOrder} de {journeySteps.length}</span>
                  </div>
                  <Progress 
                    value={Math.min(100, ((Math.max(0, (journeyInstance?.currentStepOrder || 1) - 1)) / journeySteps.length) * 100)} 
                    className="h-3 rounded-full" 
                  />
                </div>

                <div className="space-y-6">
                  <h3 className="text-lg font-bold font-headline flex items-center gap-2">
                    <ClipboardList className="size-5 text-primary" /> Etapas do Roteiro Técnico
                  </h3>
                  
                  <div className="relative pl-8 space-y-6 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-100">
                    {journeySteps.map((step) => {
                      const isCompleted = step.order < (journeyInstance?.currentStepOrder || 1);
                      const isCurrent = step.order === (journeyInstance?.currentStepOrder || 1);
                      const isFuture = step.order > (journeyInstance?.currentStepOrder || 1);
                      const isExpanded = expandedStepId === step.id;

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
                              onClick={() => setExpandedStepId(isExpanded ? null : step.id || null)}
                            >
                              <div className="flex-1 space-y-1">
                                <div className="flex items-center gap-3">
                                  <CardTitle className={cn(
                                    "text-base font-bold",
                                    isCompleted ? "text-slate-400" : "text-slate-800"
                                  )}>{step.name}</CardTitle>
                                  <Badge variant="secondary" className="text-[9px] uppercase font-bold bg-slate-100 gap-1">
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
                                <div className="mt-5 space-y-6">
                                  <div className="grid md:grid-cols-2 gap-4">
                                     <div className="space-y-1">
                                        <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">SLA de Atendimento</p>
                                        <p className="text-xs font-bold flex items-center gap-2"><Clock className="size-3" /> {step.estimatedTimeInHours}h Úteis</p>
                                     </div>
                                     <div className="space-y-1">
                                        <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Ação</p>
                                        <p className="text-xs font-bold flex items-center gap-2"><FileText className="size-3" /> {step.type === 'upload' ? 'Evidência Requerida' : 'Formulário Interno'}</p>
                                     </div>
                                  </div>
                                  
                                  <div className="p-4 rounded-xl bg-white border border-slate-200">
                                    <p className="text-sm text-slate-700 leading-relaxed font-medium">
                                      {step.description}
                                    </p>
                                  </div>

                                  {isSupport && isCurrent && (
                                    <div className="flex justify-end gap-3 pt-4 border-t">
                                      <Button 
                                        className="font-bold gap-2"
                                        onClick={() => handleAdvanceStep(journeyInstance?.id!, step.order)}
                                        disabled={isAdvancing}
                                      >
                                        {isAdvancing ? <Loader2 className="size-4 animate-spin" /> : <ChevronRight className="size-4" />}
                                        Concluir Etapa {step.order}
                                      </Button>
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
              </>
            ) : (
              <div className="p-20 text-center border-2 border-dashed rounded-3xl bg-slate-50/50 space-y-4">
                <AlertTriangle className="size-12 mx-auto text-amber-500/20" />
                <div className="space-y-1">
                  <p className="font-bold text-slate-900">Nenhum roteiro técnico ativo</p>
                  <p className="text-sm text-muted-foreground">O analista de suporte ainda não selecionou um fluxo para esta instituição.</p>
                </div>
              </div>
            )}
          </div>
          <DialogFooter className="border-t pt-4">
            <Button className="w-full font-bold h-12" onClick={() => setIsJourneyOpen(false)}>Fechar Visualização</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}

