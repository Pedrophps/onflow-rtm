
"use client";

import { DashboardLayout } from "@/components/dashboard-layout";
import { useCollection, useFirestore, useUser, useDoc } from "@/firebase";
import { collection, query, where, doc, updateDoc } from "firebase/firestore";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserProfile } from "@/lib/types";
import { UserCheck, ShieldAlert, Search, Filter, MoreHorizontal, CheckCircle2, XCircle, Building2 } from "lucide-react";
import { useState, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import { useSearchParams } from "next/navigation";
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export default function ClientsAdminPage() {
  const db = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  
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

  const openApprovalDialog = (client: UserProfile) => {
    setSelectedClient(client);
    setClientCode("");
    setActiveProduct("");
    setIsDialogOpen(true);
  };

  const handleApprove = () => {
    if (!selectedClient?.id) return;
    
    const clientRef = doc(db, "users", selectedClient.id);
    const updateData = {
      status: 'approved',
      clientCode: clientCode,
      activeProduct: activeProduct,
      approvedAt: new Date().toISOString()
    };

    updateDoc(clientRef, updateData)
      .catch(async (error) => {
        const permissionError = new FirestorePermissionError({
          path: clientRef.path,
          operation: 'update',
          requestResourceData: updateData,
        });
        errorEmitter.emit('permission-error', permissionError);
      });

    toast({
      title: "Cliente Aprovado!",
      description: `O acesso de ${selectedClient.displayName} foi liberado com o código ${clientCode}.`
    });
    
    setIsDialogOpen(false);
  };

  const handleReject = (client: UserProfile) => {
    if (!client.id) return;
    const clientRef = doc(db, "users", client.id);
    updateDoc(clientRef, { status: 'rejected' })
      .catch(async () => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: clientRef.path,
          operation: 'update'
        }));
      });
    toast({ title: "Cliente Rejeitado", variant: "destructive" });
  };

  return (
    <DashboardLayout role="admin">
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <h1 className="text-3xl font-bold font-headline">Gestão de Clientes</h1>
            <p className="text-muted-foreground">Valide o acesso e atribua recursos às novas instituições.</p>
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input placeholder="Buscar por CNPJ ou Nome..." className="pl-10 w-full md:w-64" />
            </div>
            <Button variant="outline" size="icon"><Filter className="size-4" /></Button>
          </div>
        </div>

        {currentView === 'comercial' && (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold flex items-center gap-2 text-amber-600 uppercase tracking-widest">
                <ShieldAlert className="size-4" /> Aguardando Validação Comercial ({pendingClients.length})
              </h3>
            </div>
            
            {pendingClients.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {pendingClients.map((client) => (
                  <Card key={client.id} className="border-amber-200 bg-amber-50/30 shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-base">{client.displayName}</CardTitle>
                          <CardDescription className="font-medium text-amber-700">{client.institutionName}</CardDescription>
                        </div>
                        <Building2 className="size-5 text-amber-400" />
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="text-[11px] space-y-1 bg-white p-2 rounded-lg border border-amber-100">
                        <p className="text-muted-foreground">CNPJ: <span className="text-foreground font-mono">{client.cnpj}</span></p>
                        <p className="text-muted-foreground">E-mail: <span className="text-foreground">{client.email}</span></p>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          className="flex-1 gap-2" 
                          onClick={() => openApprovalDialog(client)}
                        >
                          <UserCheck className="size-4" /> Aprovar Acesso
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-destructive hover:bg-destructive/10" 
                          onClick={() => handleReject(client)}
                        >
                          <XCircle className="size-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center border-2 border-dashed rounded-xl bg-muted/20 text-muted-foreground">
                <CheckCircle2 className="size-8 mx-auto mb-2 opacity-20" />
                <p className="text-sm font-medium">Nenhum cliente aguardando aprovação.</p>
              </div>
            )}
          </section>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Base de Instituições</CardTitle>
            <CardDescription>Visualização completa de todos os usuários do tipo cliente.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Instituição / CNPJ</TableHead>
                  <TableHead>Responsável</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Código RTM</TableHead>
                  <TableHead>Produto</TableHead>
                  <TableHead className="text-right">Opções</TableHead>
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
                    <TableCell className="text-sm">{client.displayName}</TableCell>
                    <TableCell>
                      <Badge 
                        variant={client.status === 'approved' ? 'default' : client.status === 'rejected' ? 'destructive' : 'secondary'} 
                        className={client.status === 'approved' ? 'bg-emerald-500 hover:bg-emerald-600' : ''}
                      >
                        {client.status === 'approved' ? 'Ativo' : client.status === 'rejected' ? 'Bloqueado' : 'Pendente'}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{client.clientCode || "-"}</TableCell>
                    <TableCell className="text-xs font-medium">{client.activeProduct || "-"}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon"><MoreHorizontal className="size-4" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
                {!loading && clients.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                      Nenhum registro encontrado.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Aprovação de Nova Instituição</DialogTitle>
            <DialogDescription>
              Configure os dados de integração para <strong>{selectedClient?.institutionName}</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="code" className="text-xs uppercase font-bold text-muted-foreground">Código de Identificação (RTM ID)</Label>
              <Input 
                id="code" 
                placeholder="Ex: RTM-8890-SP" 
                value={clientCode} 
                onChange={(e) => setClientCode(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="product" className="text-xs uppercase font-bold text-muted-foreground">Produto para Ativação</Label>
              <Select onValueChange={setActiveProduct} value={activeProduct}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o serviço contratado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="RSFN">Rede RSFN</SelectItem>
                  <SelectItem value="SWIFT">Mensageria SWIFT</SelectItem>
                  <SelectItem value="PIX">Integração PIX</SelectItem>
                  <SelectItem value="MESA">Mesa de Operações</SelectItem>
                  <SelectItem value="DREX">Ambiente DREX</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Voltar</Button>
            <Button disabled={!clientCode || !activeProduct} onClick={handleApprove}>
              Confirmar e Ativar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
