
'use client';

import { useCollection, useFirestore, useUser } from "@/firebase";
import { collection, query, orderBy, limit } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, Terminal, ShieldAlert, CheckCircle2, Info, AlertTriangle, Database } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function SystemLogsPage() {
  const db = useFirestore();
  const { user } = useUser();

  const logsQuery = useMemo(() => {
    if (!user) return null;
    return query(
      collection(db, "system_logs"),
      orderBy("timestamp", "desc"),
      limit(50)
    );
  }, [db, user]);

  const { data: logs, loading } = useCollection<any>(logsQuery);

  const getLogIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle2 className="size-4 text-emerald-500" />;
      case 'error': return <ShieldAlert className="size-4 text-destructive" />;
      case 'warning': return <AlertTriangle className="size-4 text-amber-500" />;
      default: return <Info className="size-4 text-blue-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-12 font-body">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Button variant="ghost" asChild className="gap-2 -ml-4 text-muted-foreground hover:text-primary">
              <Link href="/debug/suite"><ArrowLeft className="size-4" /> Voltar ao Test Suite</Link>
            </Button>
            <h1 className="text-3xl font-bold font-headline text-slate-900 flex items-center gap-3">
              <Terminal className="size-8 text-primary" /> Auditoria de Logs do Sistema
            </h1>
            <p className="text-muted-foreground">Histórico de eventos técnicos e diagnósticos persistidos no Firestore.</p>
          </div>
          <Badge variant="outline" className="bg-white px-4 py-2 font-mono text-xs shadow-sm">
            <Database className="size-3 mr-2 text-primary" /> PERSISTÊNCIA ATIVA
          </Badge>
        </div>

        <Card className="shadow-xl border-none">
          <CardHeader className="bg-white border-b">
            <CardTitle>Registros de Auditoria</CardTitle>
            <CardDescription>Visualização dos últimos 50 eventos capturados pelo sistema.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="size-10 animate-spin text-primary" />
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Carregando Auditoria...</p>
              </div>
            ) : logs.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead className="w-10"></TableHead>
                    <TableHead>Horário</TableHead>
                    <TableHead>Mensagem</TableHead>
                    <TableHead>Contexto</TableHead>
                    <TableHead>Usuário</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id} className="hover:bg-slate-50/50 transition-colors">
                      <TableCell>{getLogIcon(log.type)}</TableCell>
                      <TableCell className="font-mono text-[10px] text-slate-500 whitespace-nowrap">
                        {log.timestamp ? format(new Date(log.timestamp), "dd/MM/yyyy HH:mm:ss", { locale: ptBR }) : "---"}
                      </TableCell>
                      <TableCell className="max-w-md">
                        <span className="text-sm font-medium text-slate-700">{log.message}</span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-[9px] uppercase font-bold bg-slate-100">{log.context || "global"}</Badge>
                      </TableCell>
                      <TableCell className="font-mono text-[10px] text-muted-foreground">
                        {log.userId?.substring(0, 8)}...
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="py-20 text-center space-y-4">
                <Database className="size-12 mx-auto text-slate-200" />
                <p className="text-muted-foreground italic">Nenhum log persistido encontrado no Firestore.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
