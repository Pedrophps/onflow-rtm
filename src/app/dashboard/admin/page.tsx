
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
  Briefcase
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  const { user } = useUser();
  const db = useFirestore();
  
  const userRef = useMemo(() => (user ? doc(db, "users", user.uid) : null), [user, db]);
  const { data: profile, loading: profileLoading } = useDoc<UserProfile>(userRef);

  // Determina a visão atual: 1. URL (maior prioridade) | 2. Banco de Dados | 3. Default
  const currentView = searchParams.get('view') || profile?.adminType || 'suporte';

  // Se o carregamento terminou e REALMENTE não temos adminType gravado no banco nem na URL, vai para seleção
  useEffect(() => {
    if (!profileLoading && profile && profile.role === 'admin' && !profile.adminType && !searchParams.get('view')) {
      router.replace('/dashboard/admin/select-profile');
    }
  }, [profile, profileLoading, router, searchParams]);

  const handleTabChange = (value: string) => {
    router.push(`/dashboard/admin?view=${value}`);
  };

  return (
    <DashboardLayout role="admin">
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold font-headline">Painel de Controle</h1>
            <p className="text-muted-foreground">Monitore o progresso global de onboarding dos seus clientes.</p>
          </div>
          
          <Tabs value={currentView} onValueChange={handleTabChange} className="w-full md:w-auto">
            <TabsList className="grid w-full grid-cols-2 bg-muted/50 p-1">
              <TabsTrigger value="suporte" className="gap-2">
                <Headset className="size-4" /> Suporte
              </TabsTrigger>
              <TabsTrigger value="comercial" className="gap-2">
                <Briefcase className="size-4" /> Comercial
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="border-l-4 border-l-primary shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {currentView === 'suporte' ? 'Chamados Ativos' : 'Novas Leads'}
              </CardTitle>
              <Users className="size-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{currentView === 'suporte' ? '128' : '45'}</div>
              <p className="text-xs text-emerald-600 flex items-center mt-1">
                <TrendingUp className="size-3 mr-1" /> +12% desde o mês passado
              </p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-emerald-500 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Concluídos</CardTitle>
              <CheckCircle2 className="size-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">84</div>
              <Progress value={65.6} className="h-1 mt-3" />
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-amber-500 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Em Progresso</CardTitle>
              <Clock className="size-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">32</div>
              <p className="text-xs text-muted-foreground mt-1">Média de 14 dias para conclusão</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-destructive shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Aguardando Revisão</CardTitle>
              <AlertCircle className="size-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12</div>
              <p className="text-xs text-destructive font-medium mt-1">Requer atenção imediata</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-8 md:grid-cols-7">
          <Card className="md:col-span-4">
            <CardHeader>
              <CardTitle className="text-lg">
                {currentView === 'suporte' ? 'Fluxo de Atendimento' : 'Conversão Comercial'}
              </CardTitle>
              <CardDescription>Métricas dos últimos 6 meses para a equipe {currentView}.</CardDescription>
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

          <Card className="md:col-span-3">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Atividade Recente</CardTitle>
                <Button variant="ghost" size="icon"><MoreHorizontal className="size-4" /></Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {[
                { name: "Empresa ABC", task: currentView === 'suporte' ? "Enviou Contrato Social" : "Nova Proposta Enviada", time: "Há 10 min", status: "em_revisao" },
                { name: "João Pereira", task: "Concluiu etapa de Boas Vindas", time: "Há 45 min", status: "concluida" },
                { name: "Tech Solutions", task: currentView === 'suporte' ? "Aguardando upload de Logo" : "Lead em Negociação", time: "Há 2 horas", status: "pendente" },
                { name: "Maria Clara", task: "Enviou comprovante de residência", time: "Há 4 horas", status: "em_revisao" },
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
