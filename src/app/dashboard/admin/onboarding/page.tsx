
'use client';

import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ClipboardList, 
  Users, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  ArrowRight, 
  UserPlus, 
  Building2,
  Briefcase,
  Zap
} from "lucide-react";
import { useCollection, useFirestore, useUser, useDoc } from "@/firebase";
import { collection, query, where, doc, updateDoc, serverTimestamp, addDoc } from "firebase/firestore";
import { useMemo, useState } from "react";
import { UserProfile, OnboardingInstance, Product } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export default function OnboardingManagement() {
  const db = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState("available");

  // 1. Buscar Clientes Aprovados sem Técnico Assinado
  const clientsQuery = useMemo(() => query(
    collection(db, "users"), 
    where("role", "==", "client"),
    where("status", "==", "approved")
  ), [db]);
  const { data: approvedClients, loading: clientsLoading } = useCollection<UserProfile>(clientsQuery);

  // 2. Buscar Instâncias de Onboarding Ativas
  const instancesQuery = useMemo(() => query(
    collection(db, "onboardingInstances")
  ), [db]);
  const { data: instances, loading: instancesLoading } = useCollection<OnboardingInstance>(instancesQuery);

  // 3. Filtrar Atividades Disponíveis (Aprovados sem instância ativa ou sem techId)
  const availableActivities = useMemo(() => {
    return approvedClients.filter(client => {
      const hasInstance = instances.find(inst => inst.clientId === client.id);
      return !hasInstance || !hasInstance.techId;
    });
  }, [approvedClients, instances]);

  // 4. Filtrar Meus Onboardings
  const myOnboardings = useMemo(() => {
    return instances.filter(inst => inst.techId === user?.uid && inst.status === 'active');
  }, [instances, user]);

  const handleAssumeActivity = async (client: UserProfile) => {
    if (!user) return;

    const instanceData = {
      clientId: client.id,
      institutionName: client.institutionName || client.displayName,
      productId: client.activeProduct,
      techId: user.uid,
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
          status: 'active',
          updatedAt: serverTimestamp()
        });
      } else {
        await addDoc(collection(db, "onboardingInstances"), instanceData);
      }

      toast({
        title: "Atividade Assumida",
        description: `Você agora é o responsável técnico pela ativação da ${client.institutionName}.`,
      });
      setActiveTab("my");
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Erro ao assumir",
        description: "Não foi possível vincular o técnico a esta atividade."
      });
    }
  };

  return (
    <DashboardLayout role="admin">
      <div className="space-y-8">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-bold font-headline text-slate-900">Gestão de Onboarding</h1>
            <p className="text-muted-foreground">Assuma atividades técnico-comerciais e gerencie a jornada dos clientes.</p>
          </div>
          <div className="flex items-center gap-2 text-xs font-bold text-primary bg-primary/5 px-4 py-2 rounded-full border border-primary/10">
            <Briefcase className="size-3.5" />
            ANALISTA RESPONSÁVEL
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-slate-100 p-1 h-12 rounded-xl">
            <TabsTrigger value="available" className="rounded-lg px-8 gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <Zap className="size-4" />
              Atividades Disponíveis
              <Badge variant="secondary" className="ml-2 bg-slate-200">{availableActivities.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="my" className="rounded-lg px-8 gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <ClipboardList className="size-4" />
              Meus Onboardings
              <Badge variant="secondary" className="ml-2 bg-slate-200">{myOnboardings.length}</Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="available" className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
            <div className="grid gap-4">
              {clientsLoading || instancesLoading ? (
                <div className="flex justify-center p-20"><Loader2 className="animate-spin text-primary size-8" /></div>
              ) : availableActivities.length > 0 ? (
                availableActivities.map((client) => (
                  <Card key={client.id} className="hover:border-primary/40 transition-all border-l-4 border-l-amber-500">
                    <CardContent className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
                      <div className="flex items-start gap-4">
                        <div className="size-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
                          <Building2 className="size-6" />
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-3">
                            <h3 className="font-bold text-lg text-slate-900">{client.institutionName}</h3>
                            <Badge variant="outline" className="text-[10px] uppercase">{client.activeProduct || 'Sem Produto'}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">Validado pelo Comercial em {client.approvedAt ? new Date(client.approvedAt).toLocaleDateString() : 'N/A'}</p>
                          <div className="flex gap-4 mt-2">
                            <span className="text-[11px] font-bold text-slate-500 uppercase flex items-center gap-1">
                              <Users className="size-3" /> Resp: {client.displayName}
                            </span>
                            <span className="text-[11px] font-bold text-slate-500 uppercase flex items-center gap-1">
                              <AlertCircle className="size-3" /> Status: Aguardando Técnico
                            </span>
                          </div>
                        </div>
                      </div>
                      <Button 
                        className="gap-2 rounded-full font-bold shadow-lg shadow-primary/10 px-8"
                        onClick={() => handleAssumeActivity(client)}
                      >
                        <UserPlus className="size-4" />
                        Assumir Atividade
                      </Button>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="p-20 text-center border-2 border-dashed rounded-3xl space-y-4">
                  <CheckCircle2 className="size-12 mx-auto text-emerald-500/20" />
                  <div className="space-y-1">
                    <p className="text-lg font-bold">Tudo limpo por aqui!</p>
                    <p className="text-sm text-muted-foreground">Não há novas atividades validadas pelo comercial aguardando suporte.</p>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="my" className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
            <div className="grid gap-4 md:grid-cols-2">
              {instancesLoading ? (
                <div className="col-span-full flex justify-center p-20"><Loader2 className="animate-spin text-primary size-8" /></div>
              ) : myOnboardings.length > 0 ? (
                myOnboardings.map((inst) => (
                  <Card key={inst.id} className="hover:border-primary/40 transition-all overflow-hidden group">
                    <CardHeader className="bg-slate-50/50 border-b p-4">
                      <div className="flex justify-between items-center">
                        <Badge variant="default" className="bg-primary text-[9px] uppercase font-black">Em Execução</Badge>
                        <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-tighter">Iniciado em {new Date(inst.startedAt).toLocaleDateString()}</span>
                      </div>
                    </CardHeader>
                    <CardContent className="p-6 space-y-6">
                      <div className="space-y-2">
                        <h4 className="font-bold text-xl text-slate-900">{inst.institutionName}</h4>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Zap className="size-4 text-primary" />
                          <span>Ativação: <strong>{inst.productId}</strong></span>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex justify-between items-end">
                          <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Etapa Atual</span>
                          <span className="text-xs font-bold text-primary">Ação Requerida</span>
                        </div>
                        <div className="p-4 rounded-xl bg-slate-900 text-white flex items-center justify-between group-hover:bg-primary transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="size-8 rounded-lg bg-white/10 flex items-center justify-center font-bold text-xs">
                              {inst.currentStepOrder}
                            </div>
                            <span className="font-bold text-sm">Validar Documentação Técnica</span>
                          </div>
                          <ArrowRight className="size-5 opacity-50" />
                        </div>
                      </div>

                      <div className="flex gap-2 pt-2">
                        <Button variant="outline" className="flex-1 rounded-xl font-bold border-2 text-xs">Acompanhar Histórico</Button>
                        <Button className="flex-1 rounded-xl font-bold shadow-md text-xs">Próxima Etapa</Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="col-span-full p-20 text-center border-2 border-dashed rounded-3xl space-y-4">
                  <ClipboardList className="size-12 mx-auto text-slate-200" />
                  <div className="space-y-1">
                    <p className="text-lg font-bold">Você não assumiu nenhuma atividade ainda</p>
                    <p className="text-sm text-muted-foreground">Vá até a aba de atividades disponíveis para iniciar um novo atendimento técnico.</p>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
