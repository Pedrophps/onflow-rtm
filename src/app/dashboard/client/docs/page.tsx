"use client";

import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useUser, useFirestore, useCollection } from "@/firebase";
import { collection, query, where, orderBy } from "firebase/firestore";
import { useMemo } from "react";
import { FileText, Download, Loader2, ShieldCheck, Clock, FileSearch, ExternalLink, HardDrive } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { OnboardingInstance, StepInteraction } from "@/lib/types";

export default function ClientDocsPage() {
  const { user } = useUser();
  const db = useFirestore();

  const interactionsQuery = useMemo(() => {
    if (!user) return null;
    return query(
      collection(db, "interactions"),
      where("clientId", "==", user.uid)
    );
  }, [db, user]);

  const { data: allInteractions, loading: interactionsLoading } = useCollection<StepInteraction>(interactionsQuery);

  const instancesQuery = useMemo(() => {
    if (!user) return null;
    return query(collection(db, "onboardingInstances"), where("clientId", "==", user.uid));
  }, [db, user]);

  const { data: instances } = useCollection<OnboardingInstance>(instancesQuery);

  const productMap = useMemo(() => {
    return instances.reduce((acc, inst) => ({
      ...acc,
      [inst.id!]: inst.productName || inst.productId
    }), {} as Record<string, string>);
  }, [instances]);

  const documents = useMemo(() => {
    return allInteractions
      .filter(i => !!i.fileName)
      .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
  }, [allInteractions]);

  if (interactionsLoading) {
    return (
      <DashboardLayout role="client">
        <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
          <Loader2 className="size-8 animate-spin text-primary" />
          <p className="text-muted-foreground font-medium text-sm">Carregando biblioteca de documentos...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="client">
      <div className="space-y-8">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold font-headline text-slate-900 dark:text-white">Documentos e Evidências</h1>
          <p className="text-muted-foreground">Repositório central de arquivos enviados durante a sua ativação técnica.</p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Card className="bg-primary text-primary-foreground border-none shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold uppercase tracking-widest opacity-80">Arquivos Enviados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-black">{documents.length}</div>
              <p className="text-[10px] uppercase font-bold mt-2 opacity-70">Evidências de Conformidade</p>
            </CardContent>
          </Card>

          <Card className="bg-card border-2 border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Status Geral</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center gap-2">
              <ShieldCheck className="size-5 text-emerald-500" />
              <span className="text-lg font-bold text-foreground">Auditado</span>
            </CardContent>
          </Card>

          <Card className="bg-card border-2 border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Armazenamento</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center gap-2">
              <HardDrive className="size-5 text-blue-500" />
              <span className="text-lg font-bold text-foreground">Nuvem RTM</span>
            </CardContent>
          </Card>
        </div>

        <Card className="border-none shadow-xl bg-card overflow-hidden">
          <CardHeader className="bg-muted/30 border-b">
            <div className="flex items-center gap-2">
              <FileSearch className="size-5 text-primary" />
              <CardTitle className="text-lg">Biblioteca de Arquivos</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {documents.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/20">
                    <TableHead>Arquivo</TableHead>
                    <TableHead>Produto / Projeto</TableHead>
                    <TableHead>Data de Envio</TableHead>
                    <TableHead>Responsável</TableHead>
                    <TableHead className="text-right">Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {documents.map((doc) => (
                    <TableRow key={doc.id} className="hover:bg-muted/10 transition-colors">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="size-8 rounded-lg bg-primary/5 flex items-center justify-center text-primary">
                            <FileText className="size-4" />
                          </div>
                          <span className="font-bold text-sm text-foreground truncate max-w-[200px]">{doc.fileName}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px] uppercase font-bold border-border">
                          {productMap[doc.instanceId] || "Produto Geral"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground font-medium">
                        {doc.createdAt?.seconds 
                          ? format(doc.createdAt.seconds * 1000, "dd MMM yyyy, HH:mm", { locale: ptBR }) 
                          : "Processando..."}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-foreground opacity-80">{doc.userName}</span>
                          <span className="text-[10px] uppercase text-muted-foreground">{doc.userRole}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" asChild className="text-primary hover:text-primary hover:bg-primary/5">
                          <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer">
                            <Download className="size-4" />
                          </a>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="py-20 text-center space-y-4">
                <FileSearch className="size-12 mx-auto text-muted-foreground/20" />
                <div className="space-y-1">
                  <p className="font-bold text-foreground">Nenhum documento encontrado</p>
                  <p className="text-sm text-muted-foreground">Arquivos enviados como evidência nas etapas aparecerão aqui.</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4 pt-8">
          <h3 className="text-lg font-bold font-headline flex items-center gap-2">
            <ShieldCheck className="size-5 text-primary" /> Manuais e Termos RTM
          </h3>
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="hover:border-primary/50 transition-all cursor-pointer group border-2 border-dashed bg-card">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="size-10 rounded-xl bg-muted flex items-center justify-center text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                    <FileText className="size-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">Manual de Conectividade RSFN</p>
                    <p className="text-[10px] text-muted-foreground uppercase font-bold">PDF • 2.4 MB</p>
                  </div>
                </div>
                <ExternalLink className="size-4 text-muted-foreground opacity-30 group-hover:text-primary group-hover:opacity-100 transition-all" />
              </CardContent>
            </Card>

            <Card className="hover:border-primary/50 transition-all cursor-pointer group border-2 border-dashed bg-card">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="size-10 rounded-xl bg-muted flex items-center justify-center text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                    <FileText className="size-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">Termos de Uso OnFlow RTM</p>
                    <p className="text-[10px] text-muted-foreground uppercase font-bold">PDF • 1.1 MB</p>
                  </div>
                </div>
                <ExternalLink className="size-4 text-muted-foreground opacity-30 group-hover:text-primary group-hover:opacity-100 transition-all" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}