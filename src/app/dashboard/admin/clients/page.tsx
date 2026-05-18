'use client';

import { DashboardLayout } from "@/components/dashboard-layout";
import { useCollection, useFirestore, useUser, useDoc } from "@/firebase";
import { collection, query, where, doc, updateDoc, serverTimestamp, addDoc, getDocs } from "firebase/firestore";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { UserProfile, Product, OnboardingInstance } from "@/lib/types";
import { Search, ShieldAlert, Building2, Loader2, MoreHorizontal, Package, Phone, FileText, CheckCircle2, Lock } from "lucide-react";
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

  // Buscar Produtos Reais
  const productsQuery = useMemo(() => query(collection(db, "products")), [db]);
  const { data: dbProducts, loading: productsLoading } = useCollection<Product>(productsQuery);

  const [selectedClient, setSelectedClient] = useState<UserProfile | null>(null);
  const [clientCode, setClientCode] = useState("");
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [commercialNotes, setCommercialNotes] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const pendingClients = useMemo(() => {
    return clients.filter(c => c.status === 'pending' || !c.clientCode);
  }, [clients]);

  const openApprovalDialog = (client: UserProfile) => {
    setSelectedClient(client);
    setClientCode(client.clientCode || "");
    setSelectedProductIds(client.activeProduct ? [client.activeProduct] : []);
    setPhoneNumber(client.phoneNumber || "");
    setCommercialNotes(client.commercialNotes || "");
    setIsDialogOpen(true);
  };

  const toggleProduct = (productId: string) => {
    if (!isComercial) return; // Suporte não pode alterar produtos
    setSelectedProductIds(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId) 
        : [...prev, productId]
    );
  };

  const handleApprove = async () => {
    if (!selectedClient?.id || isSubmitting || !isComercial) return;
    setIsSubmitting(true);
    
    const clientRef = doc(db, "users", selectedClient.id);
    const updateData = {
      status: 'approved',
      clientCode: clientCode,
      activeProduct: selectedProductIds[0] || "",
      phoneNumber: phoneNumber,
      commercialNotes: commercialNotes,
      approvedAt: new Date().toISOString(),
      updatedAt: serverTimestamp()
    };

    try {
      await updateDoc(clientRef, updateData);

      const instancesRef = collection(db, "onboardingInstances");
      const existingInstancesSnap = await getDocs(query(instancesRef, where("clientId", "==", selectedClient.id)));
      const existingProductIds = existingInstancesSnap.docs.map(d => d.data().productId);

      const newInstancesPromises = selectedProductIds
        .filter(pid => !existingProductIds.includes(pid))
        .map(pid => {
          const product = dbProducts.find(p => p.id === pid);
          return addDoc(instancesRef, {
            clientId: selectedClient.id,
            institutionName: selectedClient.institutionName || selectedClient.displayName,
            productId: pid,
            productName: product?.name || pid,
            status: 'pending',
            currentStepOrder: 1,
            startedAt: new Date().toISOString(),
            updatedAt: serverTimestamp()
          } as OnboardingInstance);
        });

      await Promise.all(newInstancesPromises);

      toast({
        title: "Acesso Configurado",
        description: `O cliente ${selectedClient.institutionName} foi ativado com ${selectedProductIds.length} produtos.`
      });
      setIsDialogOpen(false);
      setSelectedClient(null);
    } catch (error: any) {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: clientRef.path,
        operation: 'update',
        requestResourceData: updateData,
      }));
    } finally {
      setIsSubmitting(false);
    }
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
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => openApprovalDialog(client)}><MoreHorizontal className="size-4" /></Button>
                      </TableCell>
                    </TableRow>
                  )) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Nenhum cliente cadastrado.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{isComercial ? "Configuração de Acesso RTM" : "Visualização de Parâmetros"}</DialogTitle>
            <DialogDescription>
              {isComercial 
                ? `Defina os parâmetros institucionais para ${selectedClient?.institutionName}` 
                : `Consulta de dados de acesso para ${selectedClient?.institutionName}`}
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-6 py-4">
            <div className="space-y-2">
              <Label>ID RTM do Cliente</Label>
              <Input 
                value={clientCode} 
                onChange={(e) => setClientCode(e.target.value)} 
                placeholder="Ex: RTM-BR-001" 
                disabled={!isComercial}
              />
            </div>
            <div className="space-y-2">
              <Label>Telefone de Contato</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 size-4 text-muted-foreground" />
                <Input 
                  value={phoneNumber} 
                  onChange={(e) => setPhoneNumber(e.target.value)} 
                  placeholder="(00) 00000-0000" 
                  className="pl-10" 
                  disabled={!isComercial}
                />
              </div>
            </div>

            <div className="col-span-2 space-y-4 border-t pt-4">
              <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Produtos para Ativação</Label>
              <div className="grid grid-cols-2 gap-3">
                {productsLoading ? (
                  <div className="col-span-2 py-4 text-center"><Loader2 className="size-4 animate-spin mx-auto text-primary" /></div>
                ) : dbProducts.length > 0 ? dbProducts.map((prod) => (
                  <div 
                    key={prod.id} 
                    className={`flex items-center space-x-3 p-3 rounded-xl border-2 transition-all ${isComercial ? 'cursor-pointer' : 'cursor-default'} ${selectedProductIds.includes(prod.id!) ? 'border-primary bg-primary/5' : 'border-slate-100 hover:border-slate-200'}`}
                    onClick={() => toggleProduct(prod.id!)}
                  >
                    <Checkbox checked={selectedProductIds.includes(prod.id!)} disabled={!isComercial} />
                    <div className="flex flex-col">
                      <span className="text-xs font-bold leading-none">{prod.name}</span>
                      <span className="text-[10px] text-muted-foreground truncate w-40">{prod.description}</span>
                    </div>
                  </div>
                )) : (
                  <div className="col-span-2 p-4 text-center text-xs text-muted-foreground italic bg-slate-50 rounded-lg">
                    Nenhum produto cadastrado pelo suporte.
                  </div>
                )}
              </div>
            </div>

            <div className="col-span-2 space-y-2">
              <Label className="flex items-center gap-2">
                <FileText className="size-4 text-primary" />
                Informações Adicionais para o Cliente
              </Label>
              <Textarea 
                value={commercialNotes} 
                onChange={(e) => setCommercialNotes(e.target.value)} 
                placeholder={isComercial ? "Insira boas-vindas, orientações iniciais ou avisos específicos para este cliente..." : "Nenhuma nota inserida pelo comercial."}
                className="min-h-[100px]"
                disabled={!isComercial}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              {isComercial ? "Cancelar" : "Fechar"}
            </Button>
            {isComercial && (
              <Button disabled={!clientCode || selectedProductIds.length === 0 || isSubmitting} onClick={handleApprove}>
                {isSubmitting && <Loader2 className="size-4 animate-spin mr-2" />}
                Confirmar Ativação
              </Button>
            )}
            {!isComercial && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground italic">
                <Lock className="size-3" /> Apenas o comercial pode editar estes dados.
              </div>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
