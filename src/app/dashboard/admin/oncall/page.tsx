
'use client';

import { DashboardLayout } from "@/components/dashboard-layout";
import { useCollection, useFirestore, useUser, useDoc } from "@/firebase";
import { collection, query, where, doc, addDoc, updateDoc, serverTimestamp, getDocs, orderBy, limit, deleteDoc } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { 
  CalendarClock, 
  Users, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Zap, 
  Plus, 
  Loader2, 
  PhoneCall, 
  History as HistoryIcon,
  Calendar as CalendarIcon,
  ChevronRight,
  ShieldCheck,
  MessageSquare,
  XCircle,
  PlayCircle
} from "lucide-react";
import { useState, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import { UserProfile, OnCallSchedule, OnCallCheckin, OnCallNotification } from "@/lib/types";
import { format, isAfter, isBefore, parseISO, startOfDay, endOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';

export default function OnCallPage() {
  const db = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  
  const userRef = useMemo(() => (user ? doc(db, "users", user.uid) : null), [user, db]);
  const { data: profile, loading: profileLoading } = useDoc<UserProfile>(userRef);
  const isCoordinator = profile?.adminType === 'coordenador_suporte';
  const isSupport = profile?.adminType === 'suporte' || isCoordinator;

  const [activeTab, setActiveTab] = useState(isCoordinator ? "overview" : "my-oncall");
  const [isNewScheduleOpen, setIsNewScheduleOpen] = useState(false);
  const [isNewTriggerOpen, setIsNewTriggerOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form States
  const [newSchedule, setNewSchedule] = useState({
    userId: "",
    startAt: "",
    endAt: "",
    observations: ""
  });

  const [newTrigger, setNewTrigger] = useState({
    userId: "",
    reason: "",
    priority: "medium" as any,
    description: "",
    scheduleId: ""
  });

  // Data Fetching
  const usersQuery = useMemo(() => {
    if (!isSupport) return null;
    return query(collection(db, "users"), where("role", "==", "admin"));
  }, [db, isSupport]);
  const { data: adminUsers } = useCollection<UserProfile>(usersQuery);
  const supportStaff = useMemo(() => adminUsers.filter(u => u.adminType === 'suporte' || u.adminType === 'coordenador_suporte'), [adminUsers]);

  const schedulesQuery = useMemo(() => {
    if (!isSupport) return null;
    return query(collection(db, "onCallSchedules"), orderBy("startAt", "desc"));
  }, [db, isSupport]);
  const { data: allSchedules } = useCollection<OnCallSchedule>(schedulesQuery);

  const checkinsQuery = useMemo(() => {
    if (!isSupport) return null;
    return query(collection(db, "onCallCheckins"));
  }, [db, isSupport]);
  const { data: allCheckins } = useCollection<OnCallCheckin>(checkinsQuery);

  const notificationsQuery = useMemo(() => {
    if (!isSupport) return null;
    return query(collection(db, "onCallNotifications"), orderBy("sentAt", "desc"));
  }, [db, isSupport]);
  const { data: allNotifications } = useCollection<OnCallNotification>(notificationsQuery);

  // Computed Data
  const mySchedules = useMemo(() => allSchedules.filter(s => s.userId === user?.uid), [allSchedules, user]);
  const myNotifications = useMemo(() => allNotifications.filter(n => n.userId === user?.uid), [allNotifications, user]);

  const activeScheduleNow = useMemo(() => {
    const now = new Date().toISOString();
    return allSchedules.find(s => s.status === 'active' && s.startAt <= now && s.endAt >= now);
  }, [allSchedules]);

  const stats = useMemo(() => {
    const now = new Date().toISOString();
    const todaySchedules = allSchedules.filter(s => {
      const sDate = s.startAt.split('T')[0];
      const today = now.split('T')[0];
      return sDate === today;
    });

    const confirmedCount = todaySchedules.filter(s => allCheckins.some(c => c.scheduleId === s.id && c.status === 'confirmed')).length;
    
    return {
      scheduledToday: todaySchedules.length,
      confirmed: confirmedCount,
      pending: todaySchedules.length - confirmedCount,
      activeTriggers: allNotifications.filter(n => n.status !== 'finished').length
    };
  }, [allSchedules, allCheckins, allNotifications]);

  // Handlers
  const handleCreateSchedule = () => {
    if (!isCoordinator || isSubmitting) return;
    setIsSubmitting(true);

    const staff = supportStaff.find(u => u.id === newSchedule.userId);
    if (!staff) {
      setIsSubmitting(false);
      return;
    }

    const scheduleData = {
      ...newSchedule,
      userName: staff.displayName,
      status: 'active',
      createdBy: user?.uid,
      createdAt: new Date().toISOString(),
      updatedAt: serverTimestamp()
    };

    addDoc(collection(db, "onCallSchedules"), scheduleData)
      .then(() => {
        toast({ title: "Escala Criada", description: `Escala para ${staff.displayName} cadastrada com sucesso.` });
        setIsNewScheduleOpen(false);
        setNewSchedule({ userId: "", startAt: "", endAt: "", observations: "" });
      })
      .catch(async (error) => {
        const permissionError = new FirestorePermissionError({
          path: 'onCallSchedules',
          operation: 'create',
          requestResourceData: scheduleData
        } satisfies SecurityRuleContext);
        errorEmitter.emit('permission-error', permissionError);
      })
      .finally(() => setIsSubmitting(false));
  };

  const handleConfirmAvailability = (scheduleId: string) => {
    if (!user) return;
    const checkinData = {
      scheduleId,
      userId: user.uid,
      confirmedAt: new Date().toISOString(),
      status: 'confirmed'
    };

    addDoc(collection(db, "onCallCheckins"), checkinData)
      .then(() => {
        toast({ title: "Disponibilidade Confirmada", description: "Você está pronto para receber acionamentos." });
      })
      .catch(async (error) => {
        const permissionError = new FirestorePermissionError({
          path: 'onCallCheckins',
          operation: 'create',
          requestResourceData: checkinData
        } satisfies SecurityRuleContext);
        errorEmitter.emit('permission-error', permissionError);
      });
  };

  const handleCreateTrigger = () => {
    if (!isCoordinator || isSubmitting) return;
    setIsSubmitting(true);

    const schedule = allSchedules.find(s => s.id === newTrigger.scheduleId);
    if (!schedule) {
      setIsSubmitting(false);
      return;
    }

    const triggerData = {
      ...newTrigger,
      userId: schedule.userId,
      status: 'sent',
      sentAt: new Date().toISOString(),
      requestedBy: user?.displayName || user?.email
    };

    addDoc(collection(db, "onCallNotifications"), triggerData)
      .then(() => {
        toast({ title: "Colaborador Acionado", description: `Um chamado crítico foi enviado para ${schedule.userName}.` });
        setIsNewTriggerOpen(false);
        setNewTrigger({ userId: "", reason: "", priority: "medium", description: "", scheduleId: "" });
      })
      .catch(async (error) => {
        const permissionError = new FirestorePermissionError({
          path: 'onCallNotifications',
          operation: 'create',
          requestResourceData: triggerData
        } satisfies SecurityRuleContext);
        errorEmitter.emit('permission-error', permissionError);
      })
      .finally(() => setIsSubmitting(false));
  };

  const handleUpdateTriggerStatus = (notificationId: string, newState: string) => {
    const ref = doc(db, "onCallNotifications", notificationId);
    const updateData: any = { status: newState };
    if (newState === 'received') updateData.receivedAt = new Date().toISOString();
    if (newState === 'started') updateData.startedAt = new Date().toISOString();
    if (newState === 'finished') updateData.finishedAt = new Date().toISOString();

    updateDoc(ref, updateData)
      .then(() => {
        toast({ title: "Status Atualizado", description: `Acionamento movido para ${newState}.` });
      })
      .catch(async (error) => {
        const permissionError = new FirestorePermissionError({
          path: ref.path,
          operation: 'update',
          requestResourceData: updateData
        } satisfies SecurityRuleContext);
        errorEmitter.emit('permission-error', permissionError);
      });
  };

  if (profileLoading) {
    return <DashboardLayout role="admin"><div className="flex justify-center p-20"><Loader2 className="animate-spin text-primary" /></div></DashboardLayout>;
  }

  if (!isSupport) {
    return <DashboardLayout role="admin"><div className="p-20 text-center">Acesso restrito ao time de Suporte.</div></DashboardLayout>;
  }

  return (
    <DashboardLayout role="admin">
      <div className="space-y-8">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold font-headline text-foreground flex items-center gap-3">
              <CalendarClock className="size-8 text-primary" /> Módulo Sobreaviso
            </h1>
            <p className="text-muted-foreground">Gestão de escalas críticas e disponibilidade técnica 24h.</p>
          </div>
          {isCoordinator && (
            <div className="flex gap-3">
              <Button variant="outline" className="rounded-xl font-bold gap-2" onClick={() => setIsNewTriggerOpen(true)}>
                <PhoneCall className="size-4" /> Novo Acionamento
              </Button>
              <Button className="rounded-xl font-bold gap-2" onClick={() => setIsNewScheduleOpen(true)}>
                <Plus className="size-4" /> Nova Escala
              </Button>
            </div>
          )}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-muted p-1 h-12 rounded-xl">
            {isCoordinator && <TabsTrigger value="overview" className="rounded-lg px-6 gap-2">Visão Geral</TabsTrigger>}
            <TabsTrigger value="calendar" className="rounded-lg px-6 gap-2">Calendário</TabsTrigger>
            {!isCoordinator && <TabsTrigger value="my-oncall" className="rounded-lg px-6 gap-2">Meu Sobreaviso</TabsTrigger>}
            <TabsTrigger value="triggers" className="rounded-lg px-6 gap-2">
              Acionamentos {myNotifications.filter(n => n.status !== 'finished').length > 0 && (
                <Badge className="ml-1 size-5 p-0 flex items-center justify-center bg-primary">{myNotifications.filter(n => n.status !== 'finished').length}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-8 animate-in fade-in duration-500">
            <div className="grid gap-6 md:grid-cols-4">
              <StatCard label="Escalados Hoje" value={stats.scheduledToday} icon={Users} color="blue" />
              <StatCard label="Check-ins OK" value={stats.confirmed} icon={CheckCircle2} color="emerald" />
              <StatCard label="Check-ins Pendentes" value={stats.pending} icon={AlertTriangle} color="amber" />
              <StatCard label="Acionamentos Ativos" value={stats.activeTriggers} icon={Zap} color="primary" />
            </div>

            <div className="grid md:grid-cols-12 gap-8">
              <Card className="md:col-span-7 bg-card border-border shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg">Escala Atual em Curso</CardTitle>
                  <CardDescription>Colaborador responsável pelo atendimento imediato.</CardDescription>
                </CardHeader>
                <CardContent>
                  {activeScheduleNow ? (
                    <div className="flex items-center justify-between p-6 bg-primary/5 rounded-3xl border border-primary/20">
                      <div className="flex items-center gap-5">
                        <div className="size-16 rounded-2xl bg-primary flex items-center justify-center text-white shadow-lg">
                          <ShieldCheck className="size-8" />
                        </div>
                        <div>
                          <h4 className="text-xl font-black text-foreground">{activeScheduleNow.userName}</h4>
                          <p className="text-sm font-bold text-primary flex items-center gap-2">
                            <Clock className="size-3" /> {format(parseISO(activeScheduleNow.startAt), "HH:mm")} às {format(parseISO(activeScheduleNow.endAt), "HH:mm")}
                          </p>
                        </div>
                      </div>
                      <Badge className={cn(
                        "px-4 py-2 rounded-full font-black uppercase text-[10px]",
                        allCheckins.some(c => c.scheduleId === activeScheduleNow.id && c.status === 'confirmed') 
                          ? "bg-emerald-500" 
                          : "bg-amber-500 animate-pulse"
                      )}>
                        {allCheckins.some(c => c.scheduleId === activeScheduleNow.id && c.status === 'confirmed') ? "Confirmado" : "Aguardando Check-in"}
                      </Badge>
                    </div>
                  ) : (
                    <div className="p-12 text-center border-2 border-dashed rounded-3xl bg-muted/10">
                      <p className="text-sm text-muted-foreground font-medium">Ninguém escalado para o horário atual.</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="md:col-span-5 bg-card border-border shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg">Acionamentos Recentes</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {allNotifications.slice(0, 4).map(trigger => (
                    <div key={trigger.id} className="flex items-center justify-between p-4 bg-muted/20 rounded-2xl border border-border group hover:border-primary/30 transition-all">
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-foreground">
                          {allSchedules.find(s => s.userId === trigger.userId)?.userName || 'Técnico'}
                        </p>
                        <p className="text-[10px] text-muted-foreground font-medium">{trigger.reason}</p>
                      </div>
                      <Badge variant="outline" className={cn(
                        "text-[9px] uppercase font-black",
                        trigger.status === 'finished' ? "text-muted-foreground" : "text-primary border-primary/20 bg-primary/5"
                      )}>
                        {trigger.status}
                      </Badge>
                    </div>
                  ))}
                  {allNotifications.length === 0 && <p className="text-center py-6 text-xs text-muted-foreground">Nenhum acionamento enviado.</p>}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="my-oncall" className="space-y-8 animate-in slide-in-from-right duration-500">
             {mySchedules.length > 0 ? (
               <div className="grid md:grid-cols-2 gap-8">
                 {mySchedules.find(s => s.status === 'active' && isAfter(parseISO(s.endAt), new Date())) && (
                   <Card className="border-2 border-primary/20 shadow-xl overflow-hidden bg-card">
                     <CardHeader className="bg-primary/5 border-b border-primary/10">
                       <Badge className="w-fit bg-primary mb-2">Próximo Período</Badge>
                       <CardTitle className="text-2xl font-headline">Confirmação de Escala</CardTitle>
                       <CardDescription>Confirme sua disponibilidade para este turno.</CardDescription>
                     </CardHeader>
                     <CardContent className="p-8 space-y-6">
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <Label className="text-[10px] uppercase font-bold text-muted-foreground">Início do Turno</Label>
                            <p className="text-xl font-bold text-foreground">
                              {format(parseISO(mySchedules[0].startAt), "dd 'de' MMM, HH:mm", { locale: ptBR })}
                            </p>
                          </div>
                          <div className="text-right space-y-1">
                            <Label className="text-[10px] uppercase font-bold text-muted-foreground">Término</Label>
                            <p className="text-xl font-bold text-foreground">
                              {format(parseISO(mySchedules[0].endAt), "HH:mm")}
                            </p>
                          </div>
                        </div>

                        {allCheckins.some(c => c.scheduleId === mySchedules[0].id) ? (
                          <div className="p-6 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center gap-3 text-emerald-600 font-bold">
                            <CheckCircle2 className="size-5" /> Disponibilidade Confirmada
                          </div>
                        ) : (
                          <Button className="w-full h-16 rounded-2xl font-black text-lg shadow-lg gap-3" onClick={() => handleConfirmAvailability(mySchedules[0].id!)}>
                            <PlayCircle className="size-6" /> Confirmar Disponibilidade
                          </Button>
                        )}
                     </CardContent>
                   </Card>
                 )}

                 <div className="space-y-6">
                    <h3 className="text-lg font-bold flex items-center gap-2"><Zap className="size-5 text-primary" /> Acionamentos Pendentes</h3>
                    {myNotifications.filter(n => n.status !== 'finished').map(trigger => (
                      <Card key={trigger.id} className="border-l-4 border-l-primary bg-card animate-pulse">
                        <CardContent className="p-6 space-y-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <Badge variant="outline" className="text-primary border-primary/20 bg-primary/5 uppercase text-[9px] font-black mb-2">PRIORIDADE {trigger.priority}</Badge>
                              <h4 className="text-lg font-bold">{trigger.reason}</h4>
                              <p className="text-xs text-muted-foreground mt-1">{trigger.description}</p>
                            </div>
                            <span className="text-[10px] font-bold text-muted-foreground">{format(parseISO(trigger.sentAt), "HH:mm")}</span>
                          </div>
                          <div className="grid grid-cols-2 gap-3 pt-2">
                             {trigger.status === 'sent' && (
                               <Button className="w-full font-bold h-10 rounded-xl" onClick={() => handleUpdateTriggerStatus(trigger.id!, 'received')}>Confirmar Recebimento</Button>
                             )}
                             {trigger.status === 'received' && (
                               <Button className="w-full font-bold h-10 rounded-xl" onClick={() => handleUpdateTriggerStatus(trigger.id!, 'started')}>Iniciar Atendimento</Button>
                             )}
                             {trigger.status === 'started' && (
                               <Button className="w-full font-bold h-10 rounded-xl bg-emerald-600 hover:bg-emerald-700" onClick={() => handleUpdateTriggerStatus(trigger.id!, 'finished')}>Encerrar Atendimento</Button>
                             )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    {myNotifications.filter(n => n.status !== 'finished').length === 0 && (
                      <div className="p-12 text-center border-2 border-dashed rounded-3xl bg-muted/5 text-muted-foreground text-sm">
                        Nenhum acionamento ativo no momento.
                      </div>
                    )}
                 </div>
               </div>
             ) : (
               <div className="p-20 text-center border-2 border-dashed rounded-[3rem] bg-muted/5">
                 <CalendarIcon className="size-16 mx-auto text-muted-foreground/20 mb-4" />
                 <p className="text-muted-foreground font-medium">Você não possui escalas agendadas para os próximos dias.</p>
               </div>
             )}
          </TabsContent>

          <TabsContent value="calendar" className="animate-in fade-in duration-500">
            <Card className="bg-card border-border shadow-sm overflow-hidden">
               <CardHeader className="bg-muted/30 border-b flex flex-row items-center justify-between">
                 <div>
                    <CardTitle className="text-lg">Agenda de Equipe</CardTitle>
                    <CardDescription>Escalonamento mensal de suporte RTM.</CardDescription>
                 </div>
               </CardHeader>
               <CardContent className="p-0">
                  <div className="grid grid-cols-7 border-b">
                    {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(d => (
                      <div key={d} className="p-4 text-center text-[10px] font-black uppercase text-muted-foreground border-r last:border-r-0 bg-muted/10">{d}</div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 h-[600px] overflow-y-auto">
                     {Array.from({ length: 35 }).map((_, i) => {
                       const day = i - 2;
                       const isToday = day === new Date().getDate();
                       const daySchedules = allSchedules.filter(s => {
                         const d = new Date(s.startAt).getDate();
                         return d === day;
                       });

                       return (
                         <div key={i} className={cn("min-h-[120px] p-2 border-r border-b last:border-r-0 relative group hover:bg-muted/5 transition-colors", isToday && "bg-primary/5")}>
                           <span className={cn("text-xs font-bold", isToday ? "text-primary" : "text-muted-foreground")}>{day > 0 && day <= 31 ? day : ""}</span>
                           <div className="mt-2 space-y-1">
                              {daySchedules.map(s => (
                                <div key={s.id} className={cn(
                                  "text-[9px] font-bold p-1 rounded border truncate",
                                  allCheckins.some(c => c.scheduleId === s.id) ? "bg-emerald-50 border-emerald-100 text-emerald-800" : "bg-amber-50 border-amber-100 text-amber-800"
                                )}>
                                  {format(parseISO(s.startAt), "HH:mm")} • {s.userName}
                                </div>
                              ))}
                           </div>
                         </div>
                       );
                     })}
                  </div>
               </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="triggers">
             <Card>
               <CardHeader>
                 <CardTitle>Log de Acionamentos</CardTitle>
               </CardHeader>
               <CardContent>
                 <div className="space-y-4">
                    {(isCoordinator ? allNotifications : myNotifications).map(trigger => (
                      <div key={trigger.id} className="flex items-center justify-between p-5 border rounded-2xl bg-card hover:border-primary/30 transition-all">
                        <div className="flex items-center gap-4">
                           <div className={cn(
                             "size-12 rounded-xl flex items-center justify-center text-white",
                             trigger.status === 'finished' ? "bg-muted-foreground" : "bg-primary"
                           )}>
                             <Zap className="size-6" />
                           </div>
                           <div>
                              <p className="font-bold text-foreground">{trigger.reason}</p>
                              <div className="flex items-center gap-3 text-[10px] font-medium text-muted-foreground">
                                <span className="flex items-center gap-1"><Users className="size-3" /> Técnico: {allSchedules.find(s => s.userId === trigger.userId)?.userName}</span>
                                <span className="flex items-center gap-1"><Clock className="size-3" /> Enviado: {format(parseISO(trigger.sentAt), "dd/MM, HH:mm")}</span>
                              </div>
                           </div>
                        </div>
                        <div className="text-right">
                           <Badge variant={trigger.status === 'finished' ? 'secondary' : 'default'} className="uppercase text-[9px] font-black">{trigger.status}</Badge>
                        </div>
                      </div>
                    ))}
                    {(isCoordinator ? allNotifications : myNotifications).length === 0 && <p className="text-center py-20 text-muted-foreground italic">Nenhum acionamento registrado.</p>}
                 </div>
               </CardContent>
             </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={isNewScheduleOpen} onOpenChange={setIsNewScheduleOpen}>
        <DialogContent className="max-w-2xl bg-card border-border rounded-3xl p-0 overflow-hidden shadow-2xl">
          <DialogHeader className="p-8 bg-slate-950 text-white">
            <DialogTitle className="text-2xl font-headline font-bold flex items-center gap-3">
              <CalendarClock className="size-6 text-primary" /> Nova Escala de Sobreaviso
            </DialogTitle>
            <DialogDescription className="text-slate-400">Atribua um turno de disponibilidade para a equipe.</DialogDescription>
          </DialogHeader>
          <div className="p-8 grid grid-cols-2 gap-6">
            <div className="col-span-2 space-y-2">
              <Label>Colaborador Responsável</Label>
              <Select value={newSchedule.userId} onValueChange={(val) => setNewSchedule({...newSchedule, userId: val})}>
                <SelectTrigger className="h-12 bg-background border-border rounded-xl">
                  <SelectValue placeholder="Selecione o técnico..." />
                </SelectTrigger>
                <SelectContent className="bg-card">
                  {supportStaff.map(u => (
                    <SelectItem key={u.id} value={u.id!}>{u.displayName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Início do Turno</Label>
              <Input 
                type="datetime-local" 
                value={newSchedule.startAt} 
                onChange={e => setNewSchedule({...newSchedule, startAt: e.target.value})}
                className="h-12 bg-background border-border rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label>Término do Turno</Label>
              <Input 
                type="datetime-local" 
                value={newSchedule.endAt} 
                onChange={e => setNewSchedule({...newSchedule, endAt: e.target.value})}
                className="h-12 bg-background border-border rounded-xl"
              />
            </div>
            <div className="col-span-2 space-y-2">
              <Label>Observações (Opcional)</Label>
              <Textarea 
                placeholder="Detalhes sobre canais de comunicação ou áreas específicas..."
                value={newSchedule.observations}
                onChange={e => setNewSchedule({...newSchedule, observations: e.target.value})}
                className="bg-background border-border rounded-xl min-h-[100px]"
              />
            </div>
          </div>
          <DialogFooter className="p-8 bg-muted/10 border-t border-border">
            <Button variant="outline" className="rounded-xl font-bold px-8" onClick={() => setIsNewScheduleOpen(false)}>Cancelar</Button>
            <Button 
              className="rounded-xl font-bold px-8" 
              disabled={!newSchedule.userId || !newSchedule.startAt || !newSchedule.endAt || isSubmitting}
              onClick={handleCreateSchedule}
            >
              {isSubmitting && <Loader2 className="size-4 animate-spin mr-2" />}
              Salvar Escala
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isNewTriggerOpen} onOpenChange={setIsNewTriggerOpen}>
        <DialogContent className="max-w-2xl bg-card border-border rounded-3xl p-0 overflow-hidden shadow-2xl">
          <DialogHeader className="p-8 bg-slate-900 text-white">
            <DialogTitle className="text-2xl font-headline font-bold flex items-center gap-3">
              <PhoneCall className="size-6 text-primary" /> Acionamento de Técnico
            </DialogTitle>
            <DialogDescription className="text-slate-400">Envie uma notificação crítica para o técnico em turno.</DialogDescription>
          </DialogHeader>
          <div className="p-8 space-y-6">
            <div className="space-y-2">
              <Label>Técnico Escalado Disponível</Label>
              <Select value={newTrigger.scheduleId} onValueChange={(val) => setNewTrigger({...newTrigger, scheduleId: val})}>
                <SelectTrigger className="h-12 bg-background border-border rounded-xl">
                  <SelectValue placeholder="Selecione o turno ativo..." />
                </SelectTrigger>
                <SelectContent className="bg-card">
                  {allSchedules.filter(s => s.status === 'active' && isAfter(parseISO(s.endAt), new Date())).map(s => (
                    <SelectItem key={s.id} value={s.id!}>{s.userName} ({format(parseISO(s.startAt), "HH:mm")} - {format(parseISO(s.endAt), "HH:mm")})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-2">
                <Label>Motivo do Chamado</Label>
                <Input 
                  placeholder="Ex: Queda de Túnel VPN"
                  value={newTrigger.reason}
                  onChange={e => setNewTrigger({...newTrigger, reason: e.target.value})}
                  className="h-12 bg-background border-border rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label>Prioridade</Label>
                <Select value={newTrigger.priority} onValueChange={(val: any) => setNewTrigger({...newTrigger, priority: val})}>
                  <SelectTrigger className="h-12 bg-background border-border rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card">
                    <SelectItem value="low">Baixa</SelectItem>
                    <SelectItem value="medium">Média</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                    <SelectItem value="critical">Crítica</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Descrição Detalhada</Label>
              <Textarea 
                placeholder="Descreva o incidente e cliente impactado..."
                value={newTrigger.description}
                onChange={e => setNewTrigger({...newTrigger, description: e.target.value})}
                className="bg-background border-border rounded-xl min-h-[120px]"
              />
            </div>
          </div>
          <DialogFooter className="p-8 bg-muted/10 border-t border-border">
            <Button variant="outline" className="rounded-xl font-bold px-8" onClick={() => setIsNewTriggerOpen(false)}>Cancelar</Button>
            <Button 
              className="rounded-xl font-bold px-12 bg-primary hover:bg-accent" 
              disabled={!newTrigger.scheduleId || !newTrigger.reason || isSubmitting}
              onClick={handleCreateTrigger}
            >
              {isSubmitting && <Loader2 className="size-4 animate-spin mr-2" />}
              Enviar Acionamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}

function StatCard({ label, value, icon: Icon, color }: any) {
  const colorClasses: any = {
    blue: "bg-blue-500/10 border-blue-500/20 text-blue-600",
    emerald: "bg-emerald-500/10 border-emerald-500/20 text-emerald-600",
    amber: "bg-amber-500/10 border-amber-500/20 text-amber-600",
    primary: "bg-primary/10 border-primary/20 text-primary",
  };
  return (
    <Card className={cn("p-6 border-2 transition-all hover:scale-105 duration-300", colorClasses[color])}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-1">{label}</p>
          <p className="text-3xl font-black">{value}</p>
        </div>
        <div className="size-12 rounded-2xl bg-white/50 flex items-center justify-center shadow-inner">
          <Icon className="size-6" />
        </div>
      </div>
    </Card>
  );
}
