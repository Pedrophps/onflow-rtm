'use client';

import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { 
  ClipboardList, 
  Users, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  ArrowRight, 
  UserPlus, 
  Building2,
  Briefcase,
  Zap,
  Mail,
  FileText,
  Search,
  UserCheck,
  Info,
  ExternalLink
} from "lucide-react";
import { useCollection, useFirestore, useUser, useDoc } from "@/firebase";
import { collection, query, where, doc, updateDoc, serverTimestamp, addDoc } from "firebase/firestore";
import { useMemo, useState } from "react";
import { UserProfile, OnboardingInstance } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

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

  // 1. Buscar Clientes Aprovados pelo Comercial
  const clientsQuery = useMemo(() => query(
    collection(db, "users"), 
    where("role", "==", "client"),
    where("status", "==", "approved")
  ), [db]);
  const { data: approvedClients, loading: clientsLoading } = useCollection<UserProfile>(clientsQuery);

  // 2. Buscar Instâncias de Onboarding (Execução)
  const instancesQuery = useMemo(() => query(
    collection(db, "onboardingInstances")
  ), [db]);
  const { data: instances, loading: instancesLoading } = useCollection<OnboardingInstance>(instancesQuery);

  // 3. Cruzamento de dados para o Suporte: Clientes sem técnico
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

  // 5. Visão Comercial: Todos os clientes aprovados e seus respectivos status de ativação
  const commercialOverview = useMemo(() => {
    return approvedClients.map(client => {
      const instance = instances.find(inst => inst.clientId === client.id);
      return {
        ...client,
        activationStatus: instance ? (instance.techId ? 'assumido' : 'aguardando') : 'pendente_inicio',
        techId: instance?.techId || null,
        instanceId: instance?.id || null
      };
    });
  }, [approvedClients, instances]);

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
      toast({
        variant: "destructive",
        title: "Erro ao assumir",
        description: "Não foi possível vincular seu perfil a esta atividade."
      });
    }
  };

  const handleViewFicha = (clientId: string) => {
    const client = approvedClients.find(c => c.id === clientId);
    if (client) {
      setSelectedClientForFicha(client);
      setIsFichaOpen(true);
    }
  };

  if (clientsLoading || instancesLoading) {
    return (
      <DashboardLayout role="admin">
        <div className="flex flex-col items-center justify-center p-20 gap-4">
          <Loader2 className="animate-spin text-primary size-10" />
          <p className="text-muted-foreground animate-pulse">Carregando ficha técnica dos clientes...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="admin">
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold font-headline text-slate-900">Gestão de Onboarding</h1>
          <p className="text-muted-foreground">
            {isSupport 
              ? "Assuma a responsabilidade técnica de clientes aprovados pelo comercial." 
              : "Acompanhe o início da jornada técnica dos seus clientes."}
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
                                  <span className="flex items-center gap-1 font-bold text-primary"><Zap className="size-3" /> {client.activeProduct}</span>
                                </div>
                              </div>
                              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Aguardando Técnico</Badge>
                            </div>

                            <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-3 rounded-lg border">
                              <div className="space-y-1">
                                <p className="text-muted-foreground uppercase font-black text-[9px] tracking-widest">Colaborador (Contato)</p>
                                <p className="font-bold flex items-center gap-1.5"><FileText className="size-3 text-slate-400" /> {client.displayName}</p>
                                <p className="text-slate-500 flex items-center gap-1.5"><Mail className="size-3 text-slate-400" /> {client.email}</p>
                              </div>
                              <div className="space-y-1">
                                <p className="text-muted-foreground uppercase font-black text-[9px] tracking-widest">Aprovação Comercial</p>
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
                    <p className="text-muted-foreground">Não há novas fichas de clientes aprovados aguardando suporte.</p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="my" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                {myOnboardings.length > 0 ? (
                  myOnboardings.map((inst) => (
                    <Card key={inst.id} className="hover:border-primary/40 transition-all overflow-hidden">
                      <CardHeader className="bg-slate-50 p-4 border-b">
                        <div className="flex justify-between items-center">
                          <Badge className="bg-primary text-[9px] uppercase">Em Execução Técnica</Badge>
                          <span className="text-[10px] text-muted-foreground font-bold">Iniciado {new Date(inst.startedAt).toLocaleDateString()}</span>
                        </div>
                      </CardHeader>
                      <CardContent className="p-6 space-y-6">
                        <div className="space-y-1">
                          <h4 className="font-bold text-xl">{inst.institutionName}</h4>
                          <p className="text-sm text-muted-foreground flex items-center gap-2">
                            <Briefcase className="size-3.5" /> Ativação: <strong>{inst.productId}</strong>
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            className="flex-1 rounded-xl font-bold border-2 text-xs"
                            onClick={() => handleViewFicha(inst.clientId)}
                          >
                            Visualizar Ficha
                          </Button>
                          <Button className="flex-1 rounded-xl font-bold text-xs">Avançar Etapa</Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="col-span-full p-20 text-center border-2 border-dashed rounded-3xl">
                    <p className="text-muted-foreground">Você ainda não assumiu nenhum cliente para ativação.</p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        ) : (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Monitoramento de Ativação</CardTitle>
              <CardDescription>Acompanhe se o time de suporte já iniciou o processo técnico de seus clientes.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Instituição</TableHead>
                    <TableHead>Produto</TableHead>
                    <TableHead>Status Ativação</TableHead>
                    <TableHead>Analista Responsável</TableHead>
                    <TableHead className="text-right">Acompanhar</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {commercialOverview.length > 0 ? commercialOverview.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-bold">{item.institutionName}</span>
                          <span className="text-[10px] text-muted-foreground">{item.cnpj}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs font-medium">{item.activeProduct}</TableCell>
                      <TableCell>
                        <Badge variant={item.activationStatus === 'assumido' ? 'default' : 'secondary'} className="text-[10px] uppercase">
                          {item.activationStatus === 'assumido' ? 'Em Atendimento' : 'Aguardando Suporte'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-xs">
                          {item.techId ? (
                            <><UserCheck className="size-3.5 text-emerald-500" /> <span className="font-medium text-slate-700">Analista Vinculado</span></>
                          ) : (
                            <span className="text-muted-foreground italic">Pendente</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" className="text-slate-400 hover:text-primary"><ArrowRight className="size-4" /></Button>
                      </TableCell>
                    </TableRow>
                  )) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">Nenhum cliente aprovado para ativação.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Diálogo da Ficha Cadastral */}
      <Dialog open={isFichaOpen} onOpenChange={setIsFichaOpen}>
        <DialogContent className="max-w-2xl overflow-hidden rounded-3xl p-0">
          <DialogHeader className="p-8 bg-slate-900 text-white relative">
            <div className="flex items-center gap-4 mb-2">
              <div className="size-12 rounded-2xl bg-primary flex items-center justify-center">
                <Building2 className="size-6" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-headline">Ficha Cadastral OnFlow</DialogTitle>
                <DialogDescription className="text-slate-400">Dados técnicos e institucionais do cliente.</DialogDescription>
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
                <Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Colaborador Responsável</Label>
                <p className="font-bold text-slate-900">{selectedClientForFicha?.displayName || '-'}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">E-mail Corporativo</Label>
                <p className="text-slate-700 flex items-center gap-2"><Mail className="size-3.5 text-slate-400" /> {selectedClientForFicha?.email || '-'}</p>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-primary/5 border border-primary/10 flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-[10px] uppercase font-bold text-primary tracking-widest">Produto Ativo</Label>
                <div className="flex items-center gap-2 font-black text-xl text-primary">
                  <Zap className="size-5 fill-current" />
                  {selectedClientForFicha?.activeProduct || 'Não atribuído'}
                </div>
              </div>
              <div className="text-right space-y-1">
                <Label className="text-[10px] uppercase font-bold text-primary tracking-widest">ID RTM</Label>
                <p className="font-mono font-black text-lg bg-white px-3 py-1 rounded-lg border border-primary/20 shadow-sm">
                  {selectedClientForFicha?.clientCode || 'Pendente'}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-xs font-black uppercase text-slate-400 tracking-[0.2em] border-b pb-2">Histórico Operacional</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground flex items-center gap-2"><Info className="size-3" /> Cadastro Criado em</span>
                  <span className="font-bold">{selectedClientForFicha?.createdAt ? new Date(selectedClientForFicha.createdAt).toLocaleString() : '-'}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground flex items-center gap-2"><UserCheck className="size-3" /> Aprovado Comercial em</span>
                  <span className="font-bold">{selectedClientForFicha?.approvedAt ? new Date(selectedClientForFicha.approvedAt).toLocaleString() : '-'}</span>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="p-6 bg-slate-50 border-t">
            <Button className="w-full gap-2 font-bold" onClick={() => setIsFichaOpen(false)}>
              Fechar Ficha Técnica
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}