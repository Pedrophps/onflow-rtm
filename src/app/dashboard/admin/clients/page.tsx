
"use client";

import { DashboardLayout } from "@/components/dashboard-layout";
import { useCollection, useFirestore, useUser, useDoc } from "@/firebase";
import { collection, query, where, doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserProfile } from "@/lib/types";
import { UserCheck, ShieldAlert, Search, Filter, MoreHorizontal, CheckCircle2, XCircle, Building2, Loader2 } from "lucide-react";
import { useState, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useSearchParams } from "next/navigation";

export default function ClientsAdminPage() {
  const db = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  
  const userRef = useMemo(() => (user ? doc(db, "users", user.uid) : null), [user, db]);
  const { data: profile, loading: profileLoading } = useDoc<UserProfile>(userRef);
  
  // Visão comercial confirmada por banco ou URL
  const isComercial = profile?.adminType === 'comercial' || searchParams.get('view') === 'comercial';
  
  // Query de clientes (todos que possuem role "client")
  const clientsQuery = useMemo(() => query(collection(db, "users"), where("role", "==", "client")), [db]);
  const { data: clients, loading: clientsLoading } = useCollection<UserProfile>(clientsQuery);

  const [selectedClient, setSelectedClient] = useState<UserProfile | null>(null);
  const [clientCode, setClientCode] = useState("");
  const [activeProduct, setActiveProduct] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Filtro de pendentes: Status 'pending' OU falta de Código RTM OU falta de Produto
  const pendingClients = useMemo(() => {
    return clients.filter(c => c.status === 'pending' || !c.clientCode || !c.activeProduct);
  }, [clients]);

  const openApprovalDialog = (client: UserProfile) => {
    setSelectedClient(client);
    setClientCode(client.clientCode || "");
    setActiveProduct(client.activeProduct || "");
    setIsDialogOpen(true);
  };

  const handleApprove = async () => {
    if (!selectedClient?.id) return;
    
    const clientRef = doc(db, "users", selectedClient.id);
    const updateData = {
      status: 'approved',
      clientCode: clientCode,
      activeProduct: activeProduct,
      approvedAt: new Date().toISOString()
    };

    updateDoc(clientRef, updateData)
      .then(() => {
        toast({
          title: "Cliente Ativado",
          description: `O acesso de ${selectedClient.displayName} foi configurado.`
        });
        setIsDialogOpen(false);
      })
      .catch(async (error) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: clientRef.path,
          operation: 'update',
          requestResourceData: updateData,
        }));
      });
  };

  return (
    <DashboardLayout role="admin">
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <h1 className="text-3xl font-bold font-headline text-slate-900">Gestão de Clientes</h1>
            <p className="text-muted-foreground">Administração institucional RTM OnFlow.</p>
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input placeholder="Buscar por nome ou CNPJ..." className="pl-10 w-full md:w-64 bg-white" />
            </div>
            <Button variant="outline" size="icon" className="bg-white"><Filter className="size-4" /></Button>
          </div>
        </div>

        {/* ÁREA DE PENDÊNCIAS: Visível apenas para o Comercial */}
        {isComercial && (
          <section className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
            <h3 className="text-sm font-bold flex items-center gap-2 text-primary uppercase tracking-widest">
              <ShieldAlert className="size-4" /> Pendências de Ativação ({pendingClients.length})
            </h3>
            
            {clientsLoading ? (
              <div className="p-12 text-center bg-white rounded-xl border border-dashed">
                <Loader2 className="size-6 animate-spin mx-auto text-primary" />
                <p className="text-xs text-muted-foreground mt-2">Buscando pendências...</p>
              </div>
            ) : pendingClients.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {pendingClients.map((client) => (
                  <Card key={client.id} className="border-primary/20 bg-primary/5 shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <CardTitle className="text-base">{client.displayName}</CardTitle>
                          <CardDescription className="font-bold text-primary/80 truncate max-w-[180px]">{client.institutionName || "Instituição s/ Nome"}</CardDescription>
                        </div>
                        <Building2 className="size-5 text-primary/40" />
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="text-[11px] space-y-1 bg-white p-3 rounded-lg border border-primary/10">
                        <p className="text-muted-foreground">CNPJ: <span className="text-foreground font-mono font-bold">{client.cnpj || "N/A"}</span></p>
                        <p className="text-muted-foreground">E-mail: <span className="text-foreground">{client.email}</span></p>
                      </div>
                      <Button 
                        size="sm" 
                        className="w-full gap-2 font-bold" 
                        onClick={() => openApprovalDialog(client)}
                      >
                        <UserCheck className="size-4" /> Configurar Acesso
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center border-2 border-dashed rounded-xl bg-muted/20 text-muted-foreground">
                <CheckCircle2 className="size-8 mx-auto mb-2 opacity-20 text-emerald-500" />
                <p className="text-sm font-medium">Nenhum cliente aguardando ativação.</p>
              </div>
            )}
          </section>
        )}

        {/* LISTAGEM GERAL */}
        <Card className="bg-white">
          <CardHeader>
            <CardTitle className="text-lg">Base de Clientes OnFlow</CardTitle>
            <CardDescription>Visualização completa de todos os usuários corporativos.</CardDescription>
          </CardHeader>
          <CardContent>
            {clientsLoading ? (
              <div className="flex flex-col items-center justify-center py-12 gap-2">
                <Loader2 className="size-6 animate-spin text-primary" />
                <p className="text-xs text-muted-foreground font-medium">Sincronizando base...</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Instituição</TableHead>
                    <TableHead>Responsável</TableHead>
                    <TableHead>Status RTM</TableHead>
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
                          <span className="font-bold">{client.institutionName || "Não Informado"}</span>
                          <span className="text-[10px] text-muted-foreground font-mono">{client.cnpj || "-"}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm font-medium">{client.displayName}</TableCell>
                      <TableCell>
                        <Badge 
                          variant={client.status === 'approved' && client.clientCode ? 'default' : 'secondary'} 
                          className={client.status === 'approved' && client.clientCode ? 'bg-emerald-500 hover:bg-emerald-600' : ''}
                        >
                          {client.status === 'approved' && client.clientCode ? 'Ativo' : 'Pendente'}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs font-bold">{client.clientCode || "-"}</TableCell>
                      <TableCell className="text-xs font-semibold">{client.activeProduct || "-"}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => openApprovalDialog(client)}><MoreHorizontal className="size-4" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* DIÁLOGO DE ATIVAÇÃO */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCheck className="size-5 text-primary" />
              Configurar Acesso RTM
            </DialogTitle>
            <DialogDescription>
              Ative o acesso de <strong>{selectedClient?.institutionName}</strong> preenchendo os dados abaixo.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-5 py-4">
            <div className="space-y-2">
              <Label htmlFor="code" className="text-xs uppercase font-bold text-muted-foreground">ID RTM (ID do Cliente)</Label>
              <Input 
                id="code" 
                placeholder="Ex: RTM-BR-001" 
                value={clientCode} 
                onChange={(e) => setClientCode(e.target.value)}
                className="font-mono"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="product" className="text-xs uppercase font-bold text-muted-foreground">Produto Contratado</Label>
              <Select onValueChange={setActiveProduct} value={activeProduct}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o produto" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="RSFN">Rede RSFN</SelectItem>
                  <SelectItem value="SWIFT">Mensageria SWIFT</SelectItem>
                  <SelectItem value="PIX">Integração PIX</SelectItem>
                  <SelectItem value="DREX">Ambiente DREX</SelectItem>
                  <SelectItem value="CLOUD">Cloud Privada RTM</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="flex-1">Cancelar</Button>
            <Button disabled={!clientCode || !activeProduct} onClick={handleApprove} className="flex-1 font-bold">
              Salvar e Ativar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
