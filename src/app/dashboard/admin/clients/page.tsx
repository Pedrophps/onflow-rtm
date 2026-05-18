'use client';

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
import { UserProfile, Product } from "@/lib/types";
import { Search, ShieldAlert, Building2, Loader2, MoreHorizontal, Package } from "lucide-react";
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
  const { data: profile } = useDoc<UserProfile>(userRef);
  
  const currentView = profile?.adminType || searchParams.get('view');
  const isComercial = currentView === 'comercial';
  
  // Buscar Clientes
  const clientsQuery = useMemo(() => query(collection(db, "users"), where("role", "==", "client")), [db]);
  const { data: clients, loading: clientsLoading } = useCollection<UserProfile>(clientsQuery);

  // Buscar Produtos Reais (Cadastrados pelo Suporte)
  const productsQuery = useMemo(() => query(collection(db, "products")), [db]);
  const { data: dbProducts, loading: productsLoading } = useCollection<Product>(productsQuery);

  const [selectedClient, setSelectedClient] = useState<UserProfile | null>(null);
  const [clientCode, setClientCode] = useState("");
  const [activeProduct, setActiveProduct] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

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
      approvedAt: new Date().toISOString(),
      updatedAt: serverTimestamp()
    };

    updateDoc(clientRef, updateData)
      .then(() => {
        toast({
          title: "Acesso Configurado",
          description: `O cliente ${selectedClient.institutionName} foi ativado.`
        });
        setIsDialogOpen(false);
        setSelectedClient(null);
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
        <div>
          <h1 className="text-3xl font-bold font-headline text-slate-900">Gestão de Clientes</h1>
          <p className="text-muted-foreground">Gerencie o acesso institucional e aprovações do time Comercial.</p>
        </div>

        {isComercial && (
          <section className="space-y-4 animate-in fade-in duration-700">
            <h3 className="text-sm font-bold flex items-center gap-2 text-primary uppercase tracking-widest">
              <ShieldAlert className="size-4" /> Pendências de Aprovação ({pendingClients.length})
            </h3>
            
            {clientsLoading ? (
              <div className="p-12 text-center bg-white rounded-xl border border-dashed">
                <Loader2 className="size-6 animate-spin mx-auto text-primary" />
                <p className="text-xs text-muted-foreground mt-2">Buscando instituições pendentes...</p>
              </div>
            ) : pendingClients.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {pendingClients.map((client) => (
                  <Card key={client.id} className="border-primary/20 bg-primary/5 shadow-sm hover:shadow-md transition-all">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <CardTitle className="text-base truncate max-w-[180px]">{client.institutionName || client.displayName}</CardTitle>
                          <CardDescription className="text-xs font-medium">CNPJ: {client.cnpj || "N/A"}</CardDescription>
                        </div>
                        <Building2 className="size-5 text-primary/40" />
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="text-[11px] space-y-1 bg-white p-3 rounded-lg border">
                        <p className="text-muted-foreground">Responsável: <span className="text-foreground font-semibold">{client.displayName}</span></p>
                        <p className="text-muted-foreground">Status: <span className="text-amber-600 font-bold uppercase tracking-tighter">Aguardando Configuração</span></p>
                      </div>
                      <Button size="sm" className="w-full font-bold" onClick={() => openApprovalDialog(client)}>
                        Aprovar e Configurar
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center border border-dashed rounded-xl bg-muted/20 text-muted-foreground text-sm">
                Nenhuma pendência de aprovação encontrada.
              </div>
            )}
          </section>
        )}

        <Card className="bg-white">
          <CardHeader>
            <CardTitle className="text-lg">Base de Clientes RTM</CardTitle>
            <CardDescription>Lista completa de instituições cadastradas no OnFlow.</CardDescription>
          </CardHeader>
          <CardContent>
            {clientsLoading ? (
              <div className="flex justify-center py-12"><Loader2 className="animate-spin text-primary" /></div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Instituição</TableHead>
                    <TableHead>Responsável</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>ID RTM</TableHead>
                    <TableHead>Produto</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clients.length > 0 ? clients.map((client) => (
                    <TableRow key={client.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-bold">{client.institutionName || "-"}</span>
                          <span className="text-[10px] text-muted-foreground">{client.cnpj || "-"}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs">{client.displayName}</TableCell>
                      <TableCell>
                        <Badge variant={client.status === 'approved' && client.clientCode ? 'default' : 'secondary'} className="text-[10px] uppercase">
                          {client.status === 'approved' && client.clientCode ? 'Ativo' : 'Pendente'}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{client.clientCode || "-"}</TableCell>
                      <TableCell className="text-xs">{client.activeProduct || "-"}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => openApprovalDialog(client)}><MoreHorizontal className="size-4" /></Button>
                      </TableCell>
                    </TableRow>
                  )) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Nenhum cliente cadastrado.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Configuração de Acesso RTM</DialogTitle>
            <DialogDescription>Defina os parâmetros institucionais para {selectedClient?.institutionName}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>ID RTM do Cliente</Label>
              <Input value={clientCode} onChange={(e) => setClientCode(e.target.value)} placeholder="Ex: RTM-BR-001" />
            </div>
            <div className="space-y-2">
              <Label>Produto Contratado</Label>
              <Select onValueChange={setActiveProduct} value={activeProduct}>
                <SelectTrigger>
                  <SelectValue placeholder={productsLoading ? "Carregando produtos..." : "Selecione o produto principal"} />
                </SelectTrigger>
                <SelectContent>
                  {dbProducts.length > 0 ? dbProducts.map((prod) => (
                    <SelectItem key={prod.id} value={prod.name}>
                      <div className="flex items-center gap-2">
                        <Package className="size-3 text-primary/60" />
                        {prod.name}
                      </div>
                    </SelectItem>
                  )) : (
                    <div className="p-4 text-center text-xs text-muted-foreground italic">
                      Nenhum produto cadastrado pelo suporte.
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
            <Button disabled={!clientCode || !activeProduct || productsLoading} onClick={handleApprove}>Confirmar Ativação</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
