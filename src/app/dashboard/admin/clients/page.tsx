
'use client';

import { DashboardLayout } from "@/components/dashboard-layout";
import { useCollection, useFirestore, useUser, useDoc } from "@/firebase";
import { collection, query, where, doc, updateDoc, serverTimestamp, addDoc, getDocs, orderBy } from "firebase/firestore";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserProfile, Product, OnboardingInstance, InstitutionalStatus, OperationalStatus, SupportStatus } from "@/lib/types";
import { 
  Search, 
  Building2, 
  Loader2, 
  ChevronDown, 
  ChevronUp, 
  Package, 
  Phone, 
  FileText, 
  CheckCircle2, 
  Lock, 
  UserCircle, 
  Hash, 
  Mail, 
  ShieldCheck, 
  Zap, 
  PlusCircle, 
  Clock, 
  AlertTriangle,
  History,
  Activity,
  Briefcase,
  Headset,
  CalendarDays,
  MoreVertical
} from "lucide-react";
import { useState, useMemo, Fragment } from "react";
import { useToast } from "@/hooks/use-toast";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { format, isAfter, parseISO } from "date-fns";

export default function ClientsAdminPage() {
  const db = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  
  const userRef = useMemo(() => (user ? doc(db, "users", user.uid) : null), [user, db]);
  const { data: profile } = useDoc<UserProfile>(userRef);
  
  const currentView = profile?.adminType || searchParams.get('view');
  const isComercial = currentView === 'comercial';
  const isSuporte = currentView === 'suporte' || profile?.adminType === 'coordenador_suporte';

  // State
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedInstitution, setExpandedInstitution] = useState<string | null>(null);
  const [isNewActivationOpen, setIsNewActivationOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<UserProfile | null>(null);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [orderValue, setOrderValue] = useState("");
  const [commercialNotes, setCommercialNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ETA Dialog State
  const [isETADialogOpen, setIsETADialogOpen] = useState(false);
  const [targetInstance, setTargetInstance] = useState<OnboardingInstance | null>(null);
  const [newETA, setNewETA] = useState("");

  // Status Dialog State
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<OperationalStatus>("em_andamento");

  // Buscar Usuários do tipo Cliente
  const clientsQuery = useMemo(() => {
    if (!user) return null;
    return query(collection(db, "users"), where("role", "==", "client"));
  }, [db, user]);
  const { data: dbClients, loading: usersLoading } = useCollection<UserProfile>(clientsQuery);

  // Buscar Todas as Instâncias de Onboarding
  const instancesQuery = useMemo(() => {
    if (!user) return null;
    return collection(db, "onboardingInstances");
  }, [db, user]);
  const { data: instances, loading: instancesLoading } = useCollection<OnboardingInstance>(instancesQuery);

  // Buscar Produtos Reais
  const productsQuery = useMemo(() => {
    if (!user) return null;
    return collection(db, "products");
  }, [db, user]);
  const { data: dbProducts } = useCollection<Product>(productsQuery);

  // LÓGICA DE SINCRONIZAÇÃO: Construir a lista unificada de instituições
  const unifiedInstitutions = useMemo(() => {
    const institutions = [...dbClients];
    const userIdsInCollection = new Set(dbClients.map(c => c.id));
    
    instances.forEach(inst => {
      if (!userIdsInCollection.has(inst.clientId)) {
        const alreadyAdded = institutions.find(i => i.id === inst.clientId);
        if (!alreadyAdded) {
          institutions.push({
            id: inst.clientId,
            institutionName: inst.institutionName || "Instituição s/ Cadastro",
            displayName: inst.institutionName || "Instituição s/ Cadastro",
            status: 'approved',
            role: 'client',
            email: 'pendente@rtm.net.br',
            createdAt: inst.startedAt || new Date().toISOString()
          } as UserProfile);
        }
      }
    });

    return institutions;
  }, [dbClients, instances]);

  // Indicadores calculados sobre a base unificada e real
  const stats = useMemo(() => {
    const validClientIds = new Set(unifiedInstitutions.map(c => c.id));
    const activeInstances = instances.filter(i => validClientIds.has(i.clientId));

    const awaitingSupportClients = new Set(activeInstances.filter(i => i.supportStatus === 'fila_suporte' || !i.techId).map(i => i.clientId));
    const inProgressClients = new Set(activeInstances.filter(i => i.operationalStatus === 'em_andamento' || i.operationalStatus === 'em_homologacao').map(i => i.clientId));
    const withIssuesClients = new Set(activeInstances.filter(i => i.operationalStatus === 'bloqueado' || i.operationalStatus === 'aguardando_cliente').map(i => i.clientId));
    const completedClients = new Set(activeInstances.filter(i => i.operationalStatus === 'concluido').map(i => i.clientId));

    return {
      total: unifiedInstitutions.length,
      pendingCommercial: unifiedInstitutions.filter(c => c.status === 'pending').length,
      awaitingSupport: awaitingSupportClients.size,
      inProgress: inProgressClients.size,
      withIssues: withIssuesClients.size,
      completed: completedClients.size,
    };
  }, [unifiedInstitutions, instances]);

  // Filtro de pesquisa
  const filteredInstitutions = useMemo(() => {
    return unifiedInstitutions
      .filter(c => 
        (c.institutionName || c.displayName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.cnpj || "").includes(searchTerm)
      )
      .sort((a, b) => (a.institutionName || a.displayName || "").localeCompare(b.institutionName || b.displayName || ""));
  }, [unifiedInstitutions, searchTerm]);

  const handleCreateActivation = async () => {
    if (!selectedClient?.id || isSubmitting || selectedProductIds.length === 0) return;
    setIsSubmitting(true);
    
    const clientRef = doc(db, "users", selectedClient.id);
    const instancesRef = collection(db, "onboardingInstances");

    try {
      if (dbClients.find(c => c.id === selectedClient.id)) {
        await updateDoc(clientRef, {
          status: 'approved',
          institutionalStatus: 'aprovado_comercialmente',
          updatedAt: serverTimestamp()
        });
      }

      const promises = selectedProductIds.map(pid => {
        const product = dbProducts.find(p => p.id === pid);
        return addDoc(instancesRef, {
          clientId: selectedClient.id,
          institutionName: selectedClient.institutionName || selectedClient.displayName,
          productId: pid,
          productName: product?.name || pid,
          status: 'pending',
          supportStatus: 'fila_suporte',
          operationalStatus: 'em_andamento',
          currentStepOrder: 1,
          consultantName: selectedClient.consultantName || profile?.displayName,
          startedAt: new Date().toISOString(),
          updatedAt: serverTimestamp(),
          lastNote: commercialNotes || "Nova ativação iniciada via Comercial."
        } as OnboardingInstance);
      });

      await Promise.all(promises);

      toast({ title: "Ativações Vinculadas", description: "O Suporte Técnico foi notificado sobre os novos fluxos." });
      setIsNewActivationOpen(false);
      setSelectedClient(null);
      setSelectedProductIds([]);
    } catch (error) {
      toast({ variant: "destructive", title: "Erro na Operação" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateETA = async () => {
    if (!targetInstance?.id || !newETA) return;
    const ref = doc(db, "onboardingInstances", targetInstance.id);
    try {
      await updateDoc(ref, {
        expectedDeliveryDate: new Date(newETA).toISOString(),
        updatedAt: serverTimestamp()
      });
      toast({ title: "Previsão Atualizada" });
      setIsETADialogOpen(false);
    } catch (e) {
      toast({ variant: "destructive", title: "Erro ao atualizar ETA" });
    }
  };

  const handleUpdateStatus = async () => {
    if (!targetInstance?.id) return;
    const ref = doc(db, "onboardingInstances", targetInstance.id);
    try {
      await updateDoc(ref, {
        operationalStatus: newStatus,
        updatedAt: serverTimestamp()
      });
      toast({ title: "Status Operacional Atualizado" });
      setIsStatusDialogOpen(false);
    } catch (e) {
      toast({ variant: "destructive", title: "Erro ao atualizar status" });
    }
  };

  const toggleExpansion = (id: string) => {
    setExpandedInstitution(expandedInstitution === id ? null : id);
  };

  return (
    <DashboardLayout role="admin">
      <div className="space-y-8 pb-20">
        <header className="flex justify-between items-start">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold font-headline text-primary">Gestão de Clientes</h1>
            <p className="text-muted-foreground">Gerencie o acesso institucional e acompanhe o andamento das ativações.</p>
          </div>
          <div className="flex gap-4">
             <div className="relative">
               <Search className="absolute left-3 top-3 size-4 text-muted-foreground" />
               <Input 
                 placeholder="Buscar por Razão Social ou CNPJ..." 
                 className="pl-10 w-80 h-11 bg-card rounded-xl border-border"
                 value={searchTerm}
                 onChange={e => setSearchTerm(e.target.value)}
               />
             </div>
          </div>
        </header>

        <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <IndicatorCard label="Total Instituições" value={stats.total} icon={Building2} color="blue" />
          <IndicatorCard label="Pendente Comercial" value={stats.pendingCommercial} icon={Briefcase} color="amber" />
          <IndicatorCard label="Fila Suporte" value={stats.awaitingSupport} icon={Headset} color="primary" />
          <IndicatorCard label="Em Andamento" value={stats.inProgress} icon={Activity} color="emerald" />
          <IndicatorCard label="Com Pendência" value={stats.withIssues} icon={AlertTriangle} color="red" />
          <IndicatorCard label="Concluídas" value={stats.completed} icon={CheckCircle2} color="slate" />
        </section>

        <Card className="border-border shadow-sm overflow-hidden bg-card">
          <CardHeader className="bg-muted/30 border-b">
            <CardTitle className="text-lg">Base de Clientes RTM</CardTitle>
            <CardDescription>Clique em uma instituição para ver detalhes das ativações em curso.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {usersLoading || instancesLoading ? (
              <div className="flex flex-col items-center justify-center p-20 gap-4">
                <Loader2 className="animate-spin text-primary size-8" />
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Sincronizando base real...</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/10 hover:bg-muted/10 border-border">
                    <TableHead className="w-12"></TableHead>
                    <TableHead>Instituição / CNPJ</TableHead>
                    <TableHead className="text-center">Status Atual</TableHead>
                    <TableHead className="text-center">Ativações</TableHead>
                    <TableHead>Responsável Comercial</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInstitutions.map((client) => {
                    const clientInstances = instances.filter(i => i.clientId === client.id);
                    const isExpanded = expandedInstitution === client.id;
                    
                    return (
                      <Fragment key={client.id}>
                        <TableRow 
                          className={cn(
                            "cursor-pointer hover:bg-primary/5 transition-colors border-border group",
                            isExpanded && "bg-primary/5"
                          )}
                          onClick={() => toggleExpansion(client.id!)}
                        >
                          <TableCell className="text-center">
                            {isExpanded ? <ChevronUp className="size-4 text-primary" /> : <ChevronDown className="size-4 text-muted-foreground group-hover:text-primary" />}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-bold text-foreground group-hover:text-primary transition-colors">{client.institutionName || client.displayName}</span>
                              <span className="text-[10px] font-mono text-muted-foreground">{client.cnpj || "CNPJ NÃO VINCULADO"}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex flex-col items-center justify-center gap-1.5">
                              {clientInstances.length > 0 ? (
                                <div className="space-y-1 flex flex-col items-center">
                                  <StatusBadge 
                                    type="operational" 
                                    status={clientInstances.some(i => !i.techId) ? 'pending' :
                                            clientInstances.find(i => i.operationalStatus === 'bloqueado') ? 'bloqueado' : 
                                            clientInstances.find(i => i.operationalStatus === 'em_andamento') ? 'em_andamento' : 
                                            clientInstances[0].operationalStatus || 'em_andamento'} 
                                  />
                                  <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-sm bg-slate-100 border border-slate-200 w-fit">
                                    <Headset className="size-2.5 text-slate-500" />
                                    <span className="text-[9px] font-black uppercase text-slate-600">
                                      {clientInstances.find(i => i.techName)?.techName || "Fila de Espera"}
                                    </span>
                                  </div>
                                </div>
                              ) : (
                                <StatusBadge type="institutional" status={client.institutionalStatus || (client.status === 'approved' ? 'aprovado_comercialmente' : 'cadastro_recebido')} />
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline" className="rounded-sm bg-white border-border text-foreground font-bold">
                              {clientInstances.length}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2 text-xs font-medium text-foreground">
                               <UserCircle className="size-3 text-muted-foreground" />
                               {client.consultantName || "A definir"}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                             {isComercial && (
                               <Button 
                                 variant="outline" 
                                 size="sm" 
                                 className="h-8 gap-1.5 text-[10px] font-black uppercase tracking-tighter hover:bg-primary hover:text-white border-border"
                                 onClick={(e) => {
                                   e.stopPropagation();
                                   setSelectedClient(client);
                                   setIsNewActivationOpen(true);
                                 }}
                               >
                                 <PlusCircle className="size-3" /> Nova Ativação
                               </Button>
                             )}
                          </TableCell>
                        </TableRow>
                        
                        {isExpanded && (
                          <TableRow className="bg-muted/5 border-b-2 border-primary/20">
                            <TableCell colSpan={6} className="p-0">
                              <div className="p-6 space-y-6 animate-in slide-in-from-top-2 duration-300">
                                <div className="flex justify-between items-center">
                                  <h4 className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2">
                                    <Zap className="size-4" /> Jornadas de Ativação Vinculadas
                                  </h4>
                                </div>

                                {clientInstances.length > 0 ? (
                                  <div className="grid gap-4">
                                    {clientInstances.map((inst) => {
                                      const isDelayed = inst.expectedDeliveryDate && isAfter(new Date(), parseISO(inst.expectedDeliveryDate)) && inst.operationalStatus !== 'concluido';
                                      
                                      return (
                                        <Card key={inst.id} className="border-border bg-white shadow-sm overflow-hidden rounded-sm">
                                          <CardContent className="p-4 grid md:grid-cols-12 gap-6 items-center">
                                            <div className="md:col-span-3 space-y-1">
                                              <p className="text-[9px] font-black uppercase text-muted-foreground">Produto</p>
                                              <p className="font-bold text-foreground flex items-center gap-2">
                                                <Package className="size-3 text-primary" /> {inst.productName || inst.productId}
                                              </p>
                                              <p className="text-[10px] text-muted-foreground truncate font-mono">ID: {inst.id?.substring(0, 8)}</p>
                                            </div>

                                            <div className="md:col-span-2 space-y-1">
                                              <p className="text-[9px] font-black uppercase text-muted-foreground">Operacional</p>
                                              <StatusBadge type="operational" status={!inst.techId ? 'pending' : (inst.operationalStatus || 'em_andamento')} />
                                            </div>

                                            <div className="md:col-span-2 space-y-1">
                                              <p className="text-[9px] font-black uppercase text-muted-foreground">Analista Suporte</p>
                                              <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                                                <Headset className="size-3 text-muted-foreground" /> {inst.techName || "Fila de Espera"}
                                              </div>
                                            </div>

                                            <div className="md:col-span-2 space-y-1">
                                              <p className="text-[9px] font-black uppercase text-muted-foreground">Previsão Entrega</p>
                                              <div className={cn(
                                                "flex items-center gap-2 text-xs font-black",
                                                isDelayed ? "text-destructive" : "text-foreground"
                                              )}>
                                                <CalendarDays className="size-3" />
                                                {inst.expectedDeliveryDate ? format(parseISO(inst.expectedDeliveryDate), "dd/MM/yyyy") : "Não definida"}
                                                {isDelayed && <Badge variant="destructive" className="text-[8px] h-4 px-1 rounded-sm">ATRASADO</Badge>}
                                              </div>
                                            </div>

                                            <div className="md:col-span-3 flex justify-end gap-2">
                                              {isSuporte && (
                                                <>
                                                  <Button variant="outline" size="sm" className="h-8 text-[10px] font-bold rounded-sm" onClick={() => { setTargetInstance(inst); setIsETADialogOpen(true); }}>
                                                    Definir ETA
                                                  </Button>
                                                  <Button variant="outline" size="sm" className="h-8 text-[10px] font-bold rounded-sm" onClick={() => { setTargetInstance(inst); setNewStatus(inst.operationalStatus || 'em_andamento'); setIsStatusDialogOpen(true); }}>
                                                    Status
                                                  </Button>
                                                </>
                                              )}
                                              <Button variant="ghost" size="icon" className="size-8">
                                                <MoreVertical className="size-4 text-muted-foreground" />
                                              </Button>
                                            </div>
                                          </CardContent>
                                        </Card>
                                      );
                                    })}
                                  </div>
                                ) : (
                                  <div className="p-10 text-center border-2 border-dashed rounded-sm bg-muted/5">
                                    <p className="text-sm text-muted-foreground italic">Nenhuma ativação técnica iniciada para esta instituição.</p>
                                  </div>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </Fragment>
                    );
                  })}
                  {filteredInstitutions.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-20 text-muted-foreground">Nenhuma instituição encontrada com estes critérios.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialog: Nova Ativação */}
      <Dialog open={isNewActivationOpen} onOpenChange={setIsNewActivationOpen}>
        <DialogContent className="max-w-3xl bg-card border-border rounded-xl p-0 overflow-hidden shadow-2xl">
          <DialogHeader className="p-8 bg-slate-950 text-white">
            <DialogTitle className="text-2xl font-headline font-bold flex items-center gap-3">
              <PlusCircle className="size-6 text-primary" /> Vincular Nova Ativação
            </DialogTitle>
            <DialogDescription className="text-slate-400">Inicie um novo projeto técnico para {selectedClient?.institutionName}</DialogDescription>
          </DialogHeader>

          <div className="p-8 space-y-8">
             <div className="space-y-4">
                <Label className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2">
                  <Zap className="size-4" /> Selecione os Produtos Contratados
                </Label>
                <div className="grid grid-cols-2 gap-3">
                  {dbProducts.map((prod) => (
                    <div 
                      key={prod.id} 
                      className={cn(
                        "flex items-center space-x-3 p-4 rounded-sm border-2 transition-all cursor-pointer hover:border-primary/50",
                        selectedProductIds.includes(prod.id!) ? "border-primary bg-primary/5" : "border-border bg-muted/10"
                      )}
                      onClick={() => setSelectedProductIds(prev => prev.includes(prod.id!) ? prev.filter(id => id !== prod.id) : [...prev, prod.id!])}
                    >
                      <Checkbox checked={selectedProductIds.includes(prod.id!)} className="rounded-sm border-primary" />
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-foreground">{prod.name}</span>
                        <span className="text-[10px] text-muted-foreground mt-1 truncate w-40">{prod.description}</span>
                      </div>
                    </div>
                  ))}
                </div>
             </div>

             <div className="space-y-4">
                <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  <FileText className="size-4 text-primary" /> Notas Comerciais para o Suporte
                </Label>
                <Textarea 
                  placeholder="Instruções de prioridade, prazos ou particularidades contratuais..."
                  value={commercialNotes}
                  onChange={e => setCommercialNotes(e.target.value)}
                  className="min-h-[120px] rounded-sm bg-background border-border"
                />
             </div>
          </div>

          <DialogFooter className="p-8 bg-muted/10 border-t border-border">
            <Button variant="outline" onClick={() => setIsNewActivationOpen(false)} className="rounded-sm font-bold px-8">Cancelar</Button>
            <Button 
              className="rounded-sm font-bold px-12" 
              disabled={selectedProductIds.length === 0 || isSubmitting}
              onClick={handleCreateActivation}
            >
              {isSubmitting && <Loader2 className="size-4 animate-spin mr-2" />}
              Gerar Ativações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Atualizar ETA */}
      <Dialog open={isETADialogOpen} onOpenChange={setIsETADialogOpen}>
        <DialogContent className="bg-card rounded-sm">
          <DialogHeader>
            <DialogTitle>Previsão de Conclusão</DialogTitle>
            <DialogDescription>Defina a data estimada para a entrega final de {targetInstance?.productName}.</DialogDescription>
          </DialogHeader>
          <div className="py-6">
            <Label>Data Estimada</Label>
            <Input type="date" className="mt-2 rounded-sm" value={newETA} onChange={e => setNewETA(e.target.value)} />
          </div>
          <DialogFooter>
             <Button variant="outline" className="rounded-sm" onClick={() => setIsETADialogOpen(false)}>Cancelar</Button>
             <Button className="rounded-sm" onClick={handleUpdateETA} disabled={!newETA}>Salvar Previsão</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Status Operacional */}
      <Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
        <DialogContent className="bg-card rounded-sm">
          <DialogHeader>
            <DialogTitle>Atualizar Estágio Operacional</DialogTitle>
            <DialogDescription>Mude o estado atual do projeto {targetInstance?.productName}.</DialogDescription>
          </DialogHeader>
          <div className="py-6 space-y-4">
            <Label>Novo Status</Label>
            <Select value={newStatus} onValueChange={(val: any) => setNewStatus(val)}>
              <SelectTrigger className="h-12 bg-background rounded-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="em_andamento">Em Andamento</SelectItem>
                <SelectItem value="aguardando_cliente">Aguardando Cliente</SelectItem>
                <SelectItem value="aguardando_rtm">Aguardando RTM</SelectItem>
                <SelectItem value="em_homologacao">Em Homologação</SelectItem>
                <SelectItem value="bloqueado">Bloqueado / Impedimento</SelectItem>
                <SelectItem value="concluido">Concluído</SelectItem>
                <SelectItem value="cancelado">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
             <Button variant="outline" className="rounded-sm" onClick={() => setIsStatusDialogOpen(false)}>Cancelar</Button>
             <Button className="rounded-sm" onClick={handleUpdateStatus}>Confirmar Alteração</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}

function IndicatorCard({ label, value, icon: Icon, color }: any) {
  const colorMap: any = {
    blue: "border-slate-200 bg-white text-blue-600",
    amber: "border-slate-200 bg-white text-amber-600",
    primary: "border-slate-200 bg-white text-primary",
    emerald: "border-slate-200 bg-white text-emerald-600",
    red: "border-slate-200 bg-white text-red-600",
    slate: "border-slate-200 bg-white text-slate-600",
  };
  return (
    <Card className={cn("p-4 border-2 shadow-none transition-all rounded-sm", colorMap[color])}>
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <p className="text-[10px] font-black uppercase tracking-widest opacity-70 leading-none">{label}</p>
          <p className="text-2xl font-black">{value}</p>
        </div>
        <Icon className="size-4 opacity-40" />
      </div>
    </Card>
  );
}

function StatusBadge({ type, status }: { type: 'institutional' | 'operational', status: string }) {
  const configs: any = {
    institutional: {
      cadastro_recebido: { label: "Recebido", color: "bg-slate-50 text-slate-700 border-slate-200" },
      aguardando_analise_comercial: { label: "Análise Comercial", color: "bg-slate-50 text-amber-700 border-amber-200" },
      aprovado_comercialmente: { label: "Aprovado", color: "bg-slate-50 text-emerald-700 border-emerald-200" },
      reprovado: { label: "Reprovado", color: "bg-slate-50 text-red-700 border-red-200" },
      pending: { label: "Pendente", color: "bg-slate-50 text-slate-600 border-slate-200" },
    },
    operational: {
      pending: { label: "Pendente", color: "bg-slate-50 text-amber-700 border-slate-200" },
      em_andamento: { label: "Em Execução", color: "bg-slate-50 text-blue-700 border-slate-200" },
      aguardando_cliente: { label: "Pendente Cliente", color: "bg-slate-50 text-amber-700 border-amber-200" },
      bloqueado: { label: "Bloqueado", color: "bg-slate-50 text-red-700 border-red-200" },
      em_homologacao: { label: "Homologação", color: "bg-slate-50 text-purple-700 border-purple-200" },
      concluido: { label: "Concluído", color: "bg-slate-50 text-emerald-700 border-emerald-200" },
    }
  };

  const config = configs[type][status] || { label: status, color: "bg-slate-50 text-slate-600 border-slate-200" };
  return (
    <Badge 
      variant="outline" 
      className={cn(
        "text-[9px] uppercase font-black px-2.5 py-0.5 rounded-sm tracking-tight border-2 shadow-none", 
        config.color
      )}
    >
      {config.label}
    </Badge>
  );
}
