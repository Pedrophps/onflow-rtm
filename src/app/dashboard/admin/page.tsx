
'use client';

import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  Users, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Headset,
  Briefcase,
  Loader2,
  ShieldCheck,
  Zap,
  CalendarClock,
  ArrowUpRight,
  Activity,
  BarChart3
} from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";
import { useSearchParams, useRouter } from "next/navigation";
import { useUser, useFirestore, useDoc, useCollection } from "@/firebase";
import { collection, query, where, doc } from "firebase/firestore";
import { useMemo, useEffect } from "react";
import { UserProfile, OnboardingInstance, OnCallSchedule } from "@/lib/types";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

export default function AdminPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, loading: userLoading } = useUser();
  const db = useFirestore();
  
  const userRef = useMemo(() => (user ? doc(db, "users", user.uid) : null), [user, db]);
  const { data: profile, loading: profileLoading } = useDoc<UserProfile>(userRef);

  const currentView = profile?.adminType || searchParams.get('view');

  // Busca de Dados Reais para o Compilado
  const { data: allClients, loading: clientsLoading } = useCollection<UserProfile>(
    query(collection(db, "users"), where("role", "==", "client"))
  );

  const { data: allInstances, loading: instancesLoading } = useCollection<OnboardingInstance>(
    collection(db, "onboardingInstances")
  );

  const { data: allSchedules } = useCollection<OnCallSchedule>(
    collection(db, "onCallSchedules")
  );

  useEffect(() => {
    if (!userLoading && !profileLoading) {
      if (!user) {
        router.push('/login');
        return;
      }
      if (!profile?.adminType && !searchParams.get('view')) {
        router.push('/dashboard/admin/select-profile');
      }
    }
  }, [profile, profileLoading, user, userLoading, router, searchParams]);

  // Cálculos do Compilado
  const stats = useMemo(() => {
    const pendingComm = allClients.filter(c => c.status === 'pending').length;
    const activeActivations = allInstances.filter(i => i.status === 'active').length;
    const pendingActivations = allInstances.filter(i => i.status === 'pending').length;
    const completedActivations = allInstances.filter(i => i.status === 'completed').length;
    const blocked = allInstances.filter(i => i.operationalStatus === 'bloqueado').length;

    return {
      totalClients: allClients.length,
      pendingCommercial: pendingComm,
      inProgress: activeActivations,
      queue: pendingActivations,
      completed: completedActivations,
      alerts: blocked + pendingComm
    };
  }, [allClients, allInstances]);

  const activeTech = useMemo(() => {
    const now = new Date().toISOString();
    return allSchedules.find(s => s.status === 'active' && s.startAt <= now && s.endAt >= now);
  }, [allSchedules]);

  const distributionData = [
    { name: 'Em Fila', value: stats.queue, color: 'hsl(var(--primary))' },
    { name: 'Execução', value: stats.inProgress, color: '#3b82f6' },
    { name: 'Concluído', value: stats.completed, color: '#10b981' },
    { name: 'Bloqueado', value: stats.alerts, color: '#ef4444' },
  ];

  if (userLoading || profileLoading || clientsLoading || instancesLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background gap-4">
        <Loader2 className="size-8 animate-spin text-primary" />
        <p className="text-muted-foreground font-bold text-xs uppercase tracking-widest">Sincronizando Centro de Comando...</p>
      </div>
    );
  }

  return (
    <DashboardLayout role="admin">
      <div className="space-y-8">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b pb-6">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold font-headline text-slate-900 dark:text-white">Dashboard OnFlow</h1>
            <div className="flex items-center gap-2 text-primary font-black text-[10px] uppercase tracking-widest">
              {currentView === 'suporte' ? (
                <><Headset className="size-3" /><span>Operação: Suporte Técnico</span></>
              ) : currentView === 'coordenador_suporte' ? (
                <><ShieldCheck className="size-3" /><span>Gestão: Coordenação Master</span></>
              ) : (
                <><Briefcase className="size-3" /><span>Negócios: Gestão Comercial</span></>
              )}
            </div>
          </div>
          <div className="text-right">
             <p className="text-[10px] font-bold text-muted-foreground uppercase">Data da Extração</p>
             <p className="text-xs font-mono font-bold text-foreground">{format(new Date(), "dd/MM/yyyy HH:mm")}</p>
          </div>
        </header>

        {/* Linha 1: Indicadores Mestre */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <SummaryCard 
            label="Base de Clientes" 
            value={stats.totalClients} 
            icon={Users} 
            trend={stats.pendingCommercial > 0 ? `${stats.pendingCommercial} novos leads` : "Base estável"}
            color="blue"
          />
          <SummaryCard 
            label="Ativações em Curso" 
            value={stats.inProgress} 
            icon={Zap} 
            trend={`${stats.queue} na fila de espera`}
            color="primary"
          />
          <SummaryCard 
            label="Entregas (Total)" 
            value={stats.completed} 
            icon={CheckCircle2} 
            trend="Jornadas finalizadas"
            color="emerald"
          />
          <SummaryCard 
            label="Incidentes/Bloqueios" 
            value={stats.alerts} 
            icon={AlertCircle} 
            trend="Requer atenção imediata"
            color="red"
            isAlert={stats.alerts > 0}
          />
        </div>

        <div className="grid md:grid-cols-12 gap-8">
          {/* Coluna 1: Gráfico de Composição */}
          <Card className="md:col-span-7 bg-card border-border shadow-sm overflow-hidden">
            <CardHeader className="bg-muted/30 border-b">
              <div className="flex items-center gap-2">
                <BarChart3 className="size-4 text-primary" />
                <CardTitle className="text-sm font-bold uppercase tracking-widest">Vazão de Onboarding</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-8 h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={distributionData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                  <XAxis dataKey="name" fontSize={10} fontWeight="bold" axisLine={false} tickLine={false} />
                  <YAxis fontSize={10} axisLine={false} tickLine={false} />
                  <RechartsTooltip 
                    cursor={{ fill: 'rgba(0,0,0,0.02)' }}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                  />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={50}>
                    {distributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Coluna 2: Informação Dinâmica */}
          <div className="md:col-span-5 space-y-6">
            {/* Widget Sobreaviso */}
            <Card className="bg-slate-900 text-white border-none shadow-xl overflow-hidden relative group">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <Badge className="bg-white/20 text-white border-none text-[8px] uppercase font-black">Escala 24h</Badge>
                  <CalendarClock className="size-4 text-primary animate-pulse" />
                </div>
                <CardTitle className="text-lg font-headline">Sobreaviso RTM</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {activeTech ? (
                  <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/10">
                    <div className="size-12 rounded-full bg-primary flex items-center justify-center font-black text-lg">
                      {activeTech.userName.charAt(0)}
                    </div>
                    <div>
                      <p className="text-xs font-black uppercase text-primary tracking-widest">Analista no Turno</p>
                      <p className="text-lg font-bold">{activeTech.userName}</p>
                      <p className="text-[10px] text-slate-400 font-mono">Turno até: {format(new Date(activeTech.endAt), "HH:mm")}</p>
                    </div>
                  </div>
                ) : (
                  <div className="p-6 text-center border border-dashed border-white/20 rounded-2xl">
                    <p className="text-sm text-slate-400">Nenhum técnico em escala ativa agora.</p>
                  </div>
                )}
                <button 
                  onClick={() => router.push('/dashboard/admin/oncall')}
                  className="w-full py-3 bg-white text-slate-900 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-200 transition-colors"
                >
                  Ver Escala Completa
                </button>
              </CardContent>
              <div className="absolute -bottom-6 -right-6 size-24 bg-primary/10 rounded-full blur-2xl group-hover:bg-primary/20 transition-all"></div>
            </Card>

            {/* Widget Status Institucional */}
            <Card className="border-border bg-card shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                  <Activity className="size-3 text-emerald-500" /> Saúde do Ecossistema
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center text-sm border-b border-dashed pb-2">
                  <span className="text-muted-foreground">Clientes Ativos (Faturando)</span>
                  <span className="font-bold text-emerald-600">{allClients.filter(c => c.institutionalStatus === 'ativo').length}</span>
                </div>
                <div className="flex justify-between items-center text-sm border-b border-dashed pb-2">
                  <span className="text-muted-foreground">Aguardando Comercial</span>
                  <span className="font-bold text-amber-600">{stats.pendingCommercial}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Novas Ativações (Últ. 30 dias)</span>
                  <span className="font-bold text-primary">{allInstances.length}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

function SummaryCard({ label, value, icon: Icon, trend, color, isAlert }: any) {
  const colorMap: any = {
    blue: "text-blue-600 bg-blue-50/50 border-blue-100",
    primary: "text-primary bg-primary/5 border-primary/10",
    emerald: "text-emerald-600 bg-emerald-50/50 border-emerald-100",
    red: "text-red-600 bg-red-50 border-red-100",
  };

  return (
    <Card className={cn(
      "border-2 shadow-sm transition-all hover:scale-[1.02] cursor-default",
      colorMap[color],
      isAlert && "animate-pulse"
    )}>
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className={cn(
            "p-2 rounded-xl bg-white shadow-sm",
            isAlert && "bg-white text-red-600"
          )}>
            <Icon className="size-5" />
          </div>
          <ArrowUpRight className="size-4 opacity-20" />
        </div>
        <div className="space-y-1">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 leading-none">{label}</p>
          <p className="text-3xl font-black text-foreground">{value}</p>
          <p className="text-[10px] font-bold opacity-70 mt-2 truncate">{trend}</p>
        </div>
      </CardContent>
    </Card>
  );
}
