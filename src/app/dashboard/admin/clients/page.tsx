
"use client";

import { DashboardLayout } from "@/components/dashboard-layout";
import { useCollection, useFirestore, useUser, useDoc } from "@/firebase";
import { collection, query, where, doc, updateDoc } from "firebase/firestore";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserProfile } from "@/lib/types";
import { UserCheck, ShieldAlert, Search, Filter, MoreHorizontal, CheckCircle2, XCircle } from "lucide-react";
import { useState, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import { useSearchParams } from "next/navigation";

export default function ClientsAdminPage() {
  const db = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  
  // Obter o perfil do admin para saber se ele é Comercial ou Suporte
  const userRef = useMemo(() => (user ? doc(db, "users", user.uid) : null), [user, db]);
  const { data: profile } = useDoc<UserProfile>(userRef);
  
  const currentView = searchParams.get('view') || profile?.adminType;
  
  const clientsQuery = useMemo(() => query(collection(db, "users"), where("role", "==", "client")), [db]);
  const { data: clients, loading } = useCollection<UserProfile>(clientsQuery);

  const [selectedClient, setSelectedClient] = useState<UserProfile | null>(null);
  const [clientCode, setClientCode] = useState("");
  const [activeProduct, setActiveProduct] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const pendingClients = clients.filter(c => c.status === 'pending');

  const handleApprove = (client: UserProfile) => {
    if (!client.id) return;
    
    const userRef = doc(db, "users", client.id);
    updateDoc(userRef, {
      status: 'approved',
      clientCode: clientCode,
      activeProduct: activeProduct,
      approvedAt: new Date().toISOString()
    });

    toast({
      title: "Cliente Aprovado!",
      description: `O acesso de ${client.displayName} da ${client.institutionName} foi liberado.`
    });
    
    setIsDialogOpen(false);
    setClientCode("");
    setActiveProduct("");
  };

  const handleReject = (client: UserProfile) => {
    if (!client.id) return;
    const userRef = doc(db, "users", client.id);
    updateDoc(userRef, { status: 'rejected' });
    toast({ title: "Cliente Rejeitado", variant: "destructive" });
  };

  return (
    <DashboardLayout role="admin">
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <h1 className="text-3xl font-bold font-headline">Gestão de Clientes</h1>
            <p className="text-muted-foreground">Acompanhe e valide o acesso das instituições ao Hub RTM.</p>
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input placeholder="Buscar por CNPJ ou Nome..." className="pl-10 w-full md:w-64" />
            </div>
            <Button variant="outline" size="icon"><Filter className="size-4" /></Button>
          </div>
        </div>

        {/* Alerta de Pendência apenas para o Comercial */}
        {currentView === 'comercial' && pendingClients.length > 0 && (
          <section className="space-y-4 animate-in fade-in duration-500">
            <h3 className="text-sm font-bold flex items-center gap-2 text-amber-600 uppercase tracking-widest">
              <ShieldAlert className="size-4" /> Pendentes de Aprovação Comercial
            </h3>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {pendingClients.map((client) => (
                <Card key={client.id} className="border-amber-200 bg-amber-50/30 shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">{client.displayName}</CardTitle>
                    <CardDescription className="font-medium text-amber-700">{client.institutionName}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-xs space-y-1">
                      <p className="text-muted-foreground">CNPJ: <span className="text-foreground">{client.cnpj}</span></p>
                      <p className="text-muted-foreground">E-mail: <span className="text-foreground">{client.email}</span></p>
                    </div>
                    <div className="flex gap-2">
                      <Dialog open={isDialogOpen && selectedClient?.id === client.id} onOpenChange={(open) => {
                        setIsDialogOpen(open);
                        if(open) setSelectedClient(client);
                      }}>
                        <DialogTrigger asChild>
                          <Button size="sm" className="flex-1 gap-2">
                            <UserCheck className="size-4" /> Aprovar
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Validar Novo Cliente</DialogTitle>
                            <DialogDescription>
                              Atribua os parâmetros de integração para <strong>{client.institutionName}</strong>.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <div className="space-y-2">
                              <Label htmlFor="code">Código Interno do Cliente (RTM Code)</Label>
                              <Input 
                                id="code" 
                                placeholder="Ex: C885-2024" 
                                value={clientCode} 
                                onChange={(e) => setClientCode(e.target.value)}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="product">Produto / Serviço Contratado</Label>
                              <Select onValueChange={setActiveProduct}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione o serviço" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="RSFN">Conectividade RSFN</SelectItem>
                                  <SelectItem value="SWIFT">Mensageria SWIFT</SelectItem>
                                  <SelectItem value="PIX">Integração PIX</SelectItem>
                                  <SelectItem value="MESA">Mesa de Operações</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <DialogFooter>
                            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                            <Button disabled={!clientCode || !activeProduct} onClick={() => handleApprove(client)}>Confirmar Ativação</Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                      <Button variant="outline" size="sm" className="text-destructive hover:bg-destructive/10" onClick={() => handleReject(client)}>
                        <XCircle className="size-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Base Consolidada</CardTitle>
            <CardDescription>Lista de todas as instituições registradas.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Instituição</TableHead>
                  <TableHead>Responsável</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Código RTM</TableHead>
                  <TableHead>Produto</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-bold">{client.institutionName || "-"}</span>
                        <span className="text-[10px] text-muted-foreground">{client.cnpj || "-"}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{client.displayName}</TableCell>
                    <TableCell>
                      <Badge 
                        variant={client.status === 'approved' ? 'default' : client.status === 'rejected' ? 'destructive' : 'secondary'} 
                        className={client.status === 'approved' ? 'bg-emerald-500 hover:bg-emerald-600' : ''}
                      >
                        {client.status === 'approved' ? 'Ativo' : client.status === 'rejected' ? 'Rejeitado' : 'Pendente'}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{client.clientCode || "-"}</TableCell>
                    <TableCell className="text-xs">{client.activeProduct || "-"}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon"><MoreHorizontal className="size-4" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
                {!loading && clients.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                      Nenhuma instituição cadastrada.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
