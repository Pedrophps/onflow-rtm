
"use client";

import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Users, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  TrendingUp,
  MoreHorizontal
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

const data = [
  { name: 'Jan', value: 12 },
  { name: 'Fev', value: 18 },
  { name: 'Mar', value: 25 },
  { name: 'Abr', value: 15 },
  { name: 'Mai', value: 30 },
  { name: 'Jun', value: 42 },
];

const COLORS = ['#D32F2F', '#757575', '#E5E5E5'];

export default function AdminPage() {
  return (
    <DashboardLayout role="admin">
      <div className="space-y-8">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-bold font-headline">Painel de Controle</h1>
            <p className="text-muted-foreground">Monitore o progresso global de onboarding dos seus clientes.</p>
          </div>
          <Button>Novo Onboarding</Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="border-l-4 border-l-primary shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total de Clientes</CardTitle>
              <Users className="size-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">128</div>
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
              <CardTitle className="text-lg">Novos Onboardings por Mês</CardTitle>
              <CardDescription>Fluxo de entrada de novos clientes nos últimos 6 meses.</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E5E5" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} />
                  <RechartsTooltip 
                    cursor={{fill: 'rgba(211, 47, 47, 0.05)'}}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                  />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]} fill="#D32F2F">
                    {data.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === data.length - 1 ? '#D32F2F' : '#757575'} />
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
                { name: "Empresa ABC", task: "Enviou Contrato Social", time: "Há 10 min", status: "em_revisao" },
                { name: "João Pereira", task: "Concluiu etapa de Boas Vindas", time: "Há 45 min", status: "concluida" },
                { name: "Tech Solutions", task: "Aguardando upload de Logo", time: "Há 2 horas", status: "pendente" },
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
