
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
import { UserCheck, ShieldAlert, Search, Filter, MoreHorizontal, CheckCircle2, XCircle, Building2, Loader2 } from "lucide-react";
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
  const { data: profile, loading: profileLoading } = useDoc<UserProfile>(userRef);
  
  // Define a visão baseada no perfil salvo ou parâmetro da URL
  const currentView = profile?.adminType || searchParams.get('view');
  
  const clientsQuery = useMemo(() => query(collection(db, "users"), where("role", "==", "client")), [db]);
  const { data: clients, loading: clientsLoading } = useCollection<UserProfile>(clientsQuery);

  const [selectedClient, setSelectedClient] = useState<UserProfile | null>(null);
  const [clientCode, setClientCode] = useState("");
  const [activeProduct, setActiveProduct] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const pendingClients = useMemo(() => clients.filter(c => c.status === 'pending'), [clients]);

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
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: clientRef.path,
          operation: 'update',
          requestResourceData: updateData,
        }));
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

  if (profileLoading && !currentView) {
    return (
      <DashboardLayout role="admin">
        <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
          <Loader2 className="size-8 animate-spin text-primary" />
          <p className="text-muted-foreground font-medium">Carregando permissões...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="admin">
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <h1 className="text-3xl font-bold font-headline">Gestão de Clientes</h1>
            <p className="text-muted-foreground">Administração de instituições e controle de acessos.</p>
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input placeholder="Buscar instituição..." className="pl-10 w-full md:w-64 bg-white" />
            </div>
            <Button variant="outline" size="icon" className="bg-white"><Filter className="size-4" /></Button>
          </div>
        </div>

        {/* ÁREA EXCLUSIVA DO COMERCIAL PARA APROVAÇÕES */}
        {currentView === 'comercial' && (
          <section className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold flex items-center gap-2 text-amber-600 uppercase tracking-widest">
                <ShieldAlert className="size-4" /> Pendências Comercial ({pendingClients.length})
              </h3>
            </div>
            
            {pendingClients.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {pendingClients.map((client) => (
                  <Card key={client.id} className="border-amber-200 bg-amber-50/30 shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <CardTitle className="text-base">{client.displayName}</CardTitle>
                          <CardDescription className="font-bold text-amber-700">{client.institutionName}</CardDescription>
                        </div>
                        <Building2 className="size-5 text-amber-400" />
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="text-[11px] space-y-1 bg-white p-3 rounded-lg border border-amber-100">
                        <p className="text-muted-foreground">CNPJ: <span className="text-foreground font-mono font-bold">{client.cnpj}</span></p>
                        <p className="text-muted-foreground">E-mail: <span className="text-foreground">{client.email}</span></p>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          className="flex-1 gap-2 font-bold" 
                          onClick={() => openApprovalDialog(client)}
                        >
                          <UserCheck className="size-4" /> Aprovar
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-destructive hover:bg-destructive/10 border-destructive/20" 
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
                <p className="text-sm font-medium">Nenhuma instituição aguardando validação comercial.</p>
              </div>
            )}
          </section>
        )}

        {/* LISTAGEM GERAL DE CLIENTES */}
        <Card className="bg-white">
          <CardHeader>
            <CardTitle className="text-lg">Base de Instituições Conectadas</CardTitle>
            <CardDescription>Visualização completa de todos os usuários corporativos.</CardDescription>
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
                    <TableCell className="text-sm font-medium">{client.displayName}</TableCell>
                    <TableCell>
                      <Badge 
                        variant={client.status === 'approved' ? 'default' : client.status === 'rejected' ? 'destructive' : 'secondary'} 
                        className={client.status === 'approved' ? 'bg-emerald-500 hover:bg-emerald-600' : ''}
                      >
                        {client.status === 'approved' ? 'Ativo' : client.status === 'rejected' ? 'Bloqueado' : 'Pendente'}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs font-bold">{client.clientCode || "-"}</TableCell>
                    <TableCell className="text-xs font-semibold">{client.activeProduct || "-"}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon"><MoreHorizontal className="size-4" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
                {!clientsLoading && clients.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center text-muted-foreground italic">
                      Nenhuma instituição encontrada na base de dados.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCheck className="size-5 text-primary" />
              Aprovação Institucional
            </DialogTitle>
            <DialogDescription>
              Insira os dados técnicos para habilitar o acesso de <strong>{selectedClient?.institutionName}</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-5 py-4">
            <div className="space-y-2">
              <Label htmlFor="code" className="text-xs uppercase font-bold text-muted-foreground tracking-tight">Código de Identificação (RTM ID)</Label>
              <Input 
                id="code" 
                placeholder="Ex: RTM-8890-SP" 
                value={clientCode} 
                onChange={(e) => setClientCode(e.target.value)}
                className="font-mono"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="product" className="text-xs uppercase font-bold text-muted-foreground tracking-tight">Produto para Ativação</Label>
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
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="flex-1">Cancelar</Button>
            <Button disabled={!clientCode || !activeProduct} onClick={handleApprove} className="flex-1 font-bold">
              Validar e Ativar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
