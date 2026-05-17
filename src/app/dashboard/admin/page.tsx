
'use client';

import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Users, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  TrendingUp,
  MoreHorizontal,
  Headset,
  Briefcase,
  Loader2
} from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer, 
  Cell
} from "recharts";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useSearchParams, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useUser, useFirestore, useDoc } from "@/firebase";
import { doc } from "firebase/firestore";
import { useMemo, useEffect } from "react";
import { UserProfile } from "@/lib/types";

const chartData = [
  { name: 'Jan', value: 12 },
  { name: 'Fev', value: 18 },
  { name: 'Mar', value: 25 },
  { name: 'Abr', value: 15 },
  { name: 'Mai', value: 30 },
  { name: 'Jun', value: 42 },
];

export default function AdminPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, loading: userLoading } = useUser();
  const db = useFirestore();
  
  const userRef = useMemo(() => (user ? doc(db, "users", user.uid) : null), [user, db]);
  const { data: profile, loading: profileLoading } = useDoc<UserProfile>(userRef);

  // Lógica de visualização: Prioriza o que está no banco, depois URL.
  const currentView = profile?.adminType || searchParams.get('view');
  const isAdminByEmail = user?.email?.endsWith('@rtm.net.br') || user?.email?.includes('admin');

  useEffect(() => {
    // Só redireciona se o carregamento do usuário e do perfil terminarem
    // E se realmente não houver adminType e nem parâmetro na URL
    if (!userLoading && !profileLoading && user) {
      if (isAdminByEmail && !profile?.adminType && !searchParams.get('view')) {
        router.replace('/dashboard/admin/select-profile');
      }
    }
  }, [profile, profileLoading, user, userLoading, router, isAdminByEmail, searchParams]);

  if (userLoading || (user && profileLoading && !currentView)) {
    return (
      <DashboardLayout role="admin">
        <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
          <Loader2 className="size-8 animate-spin text-primary" />
          <p className="text-muted-foreground font-medium text-center">Sincronizando ambiente RTM...</p>
        </div>
      </DashboardLayout>
    );
  }

  // Se for admin mas não tiver visão escolhida nem na URL nem no banco, aguarda o useEffect
  if (isAdminByEmail && !currentView) {
    return (
      <DashboardLayout role="admin">
        <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
          <Loader2 className="size-8 animate-spin text-primary" />
          <p className="text-muted-foreground font-medium text-center">Verificando permissões...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="admin">
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b pb-6">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold font-headline text-slate-900">Painel OnFlow</h1>
            <div className="flex items-center gap-2 text-primary font-medium animate-in fade-in duration-500">
              {currentView === 'suporte' ? (
                <>
                  <Headset className="size-4" />
                  <span>Ambiente: <strong>Equipe de Suporte</strong></span>
                </>
              ) : (
                <>
                  <Briefcase className="size-4" />
                  <span>Ambiente: <strong>Equipe Comercial</strong></span>
                </>
              )}
            </div>
          </div>
          
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100 text-[10px] font-bold uppercase tracking-widest">
            Conexão Segura RTM
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="border-l-4 border-l-primary shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {currentView === 'suporte' ? 'Implantações' : 'Negócios'}
              </CardTitle>
              <Users className="size-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{currentView === 'suporte' ? '128' : '45'}</div>
              <p className="text-xs text-emerald-600 flex items-center mt-1">
                <TrendingUp className="size-3 mr-1" /> +12% no mês
              </p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-emerald-500 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Finalizados</CardTitle>
              <CheckCircle2 className="size-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">84</div>
              <Progress value={65} className="h-1 mt-3" />
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-amber-500 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Em Onboarding</CardTitle>
              <Clock className="size-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">32</div>
              <p className="text-xs text-muted-foreground mt-1">SLA médio: 14 dias</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-destructive shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Bloqueados</CardTitle>
              <AlertCircle className="size-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12</div>
              <p className="text-xs text-destructive font-medium mt-1">Ação requerida</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-8 md:grid-cols-7">
          <Card className="md:col-span-4 bg-white">
            <CardHeader>
              <CardTitle className="text-lg">Fluxo Operacional</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E5E5" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} />
                  <RechartsTooltip 
                    cursor={{fill: 'rgba(211, 47, 47, 0.05)'}}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                  />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]} fill="#D32F2F">
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === chartData.length - 1 ? '#D32F2F' : '#757575'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="md:col-span-3 bg-white">
            <CardHeader>
              <CardTitle className="text-lg">Atividade Recente</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {[
                { name: "Banco Digital Beta", task: currentView === 'suporte' ? "Validando config VPN" : "ID RTM pendente", time: "Agora", status: "em_revisao" },
                { name: "Invest Corp", task: "Onboarding finalizado", time: "Há 45 min", status: "concluida" },
                { name: "Global Payments", task: "Aguardando comercial", time: "Há 2 horas", status: "pendente" },
                { name: "Tech Finance", task: "Doc. em revisão", time: "Há 4 horas", status: "em_revisao" },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-4">
                  <div className={cn(
                    "size-2 mt-1.5 rounded-full shrink-0",
                    item.status === 'em_revisao' ? 'bg-amber-500' : 
                    item.status === 'concluida' ? 'bg-emerald-500' : 'bg-slate-300'
                  )} />
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium">{item.name}</p>
                    <p className="text-xs text-muted-foreground">{item.task}</p>
                  </div>
                  <span className="text-[10px] text-muted-foreground uppercase font-semibold">{item.time}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
