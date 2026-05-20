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
import { Search, ShieldAlert, Building2, Loader2, MoreHorizontal, Package, Phone, FileText, CheckCircle2, Lock, UserCircle, Hash, Mail, ShieldCheck, Zap } from "lucide-react";
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
  const clientsQuery = useMemo(() => {
    if (!user) return null;
    return query(collection(db, "users"), where("role", "==", "client"));
  }, [db, user]);
  const { data: clients, loading: clientsLoading } = useCollection<UserProfile>(clientsQuery);

  // Buscar Produtos Reais
  const productsQuery = useMemo(() => {
    if (!user) return null;
    return query(collection(db, "products"));
  }, [db, user]);
  const { data: dbProducts, loading: productsLoading } = useCollection<Product>(productsQuery);

  const [selectedClient, setSelectedClient] = useState<UserProfile | null>(null);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [consultantName, setConsultantName] = useState("");
  const [orderValue, setOrderValue] = useState("");
  const [institutionName, setInstitutionName] = useState("");
  const [commercialNotes, setCommercialNotes] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const pendingClients = useMemo(() => {
    return clients.filter(c => c.status === 'pending' || !c.orderValue);
  }, [clients]);

  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);

  const openApprovalDialog = (client: UserProfile) => {
    setSelectedClient(client);
    setSelectedProductIds(client.activeProduct ? [client.activeProduct] : []);
    setPhoneNumber(client.phoneNumber || "");
    setConsultantName(client.consultantName || "");
    setOrderValue(client.orderValue || "");
    setInstitutionName(client.institutionName || client.displayName || "");
    setCommercialNotes(client.commercialNotes || "");
    setIsDialogOpen(true);
  };

  const toggleProduct = (productId: string) => {
    if (!isComercial) return;
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
      activeProduct: selectedProductIds[0] || "",
      phoneNumber: phoneNumber,
      consultantName: consultantName,
      orderValue: orderValue,
      institutionName: institutionName,
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
            institutionName: institutionName,
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
        title: "Venda Processada",
        description: `O cliente ${institutionName} (OV: ${orderValue}) foi enviado para o suporte.`
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
          <h1 className="text-3xl font-bold font-headline text-foreground">Gestão de Clientes</h1>
          <p className="text-muted-foreground">Gerencie o acesso institucional e aprovações do time Comercial.</p>
        </div>

        {isComercial && (
          <section className="space-y-4 animate-in fade-in duration-700">
            <h3 className="text-sm font-bold flex items-center gap-2 text-primary uppercase tracking-widest">
              <ShieldAlert className="size-4" /> Pendências de Aprovação ({pendingClients.length})
            </h3>
            
            {clientsLoading ? (
              <div className="p-12 text-center bg-card rounded-xl border border-dashed border-border">
                <Loader2 className="size-6 animate-spin mx-auto text-primary" />
                <p className="text-xs text-muted-foreground mt-2">Buscando instituições pendentes...</p>
              </div>
            ) : pendingClients.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {pendingClients.map((client) => (
                  <Card key={client.id} className="border-primary/20 bg-primary/5 hover:bg-primary/10 transition-all">
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
                      <div className="text-[11px] space-y-1 bg-background p-3 rounded-lg border border-border">
                        <p className="text-muted-foreground">Responsável: <span className="text-foreground font-semibold">{client.displayName}</span></p>
                        <p className="text-amber-600 font-bold uppercase tracking-tighter">Aguardando Configuração</p>
                      </div>
                      <Button size="sm" className="w-full font-bold" onClick={() => openApprovalDialog(client)}>
                        Aprovar e Configurar
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center border border-dashed rounded-xl bg-muted/20 text-muted-foreground text-sm border-border">
                Nenhuma pendência de aprovação encontrada.
              </div>
            )}
          </section>
        )}

        <Card className="bg-card border-border">
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
                  <TableRow className="border-border">
                    <TableHead>Instituição</TableHead>
                    <TableHead>Responsável</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>OV (Venda)</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clients.length > 0 ? clients.map((client) => (
                    <TableRow key={client.id} className="border-border">
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-bold text-foreground">{client.institutionName || "-"}</span>
                          <span className="text-[10px] text-muted-foreground">{client.cnpj || "-"}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-foreground opacity-80">{client.displayName}</TableCell>
                      <TableCell>
                        <Badge variant={client.status === 'approved' && client.orderValue ? 'default' : 'secondary'} className="text-[10px] uppercase">
                          {client.status === 'approved' && client.orderValue ? 'Ativo' : 'Pendente'}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-foreground">{client.orderValue || "-"}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => openApprovalDialog(client)} className="text-muted-foreground hover:text-primary transition-colors">
                          <MoreHorizontal className="size-4" />
                        </Button>
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
        <DialogContent className="max-w-3xl bg-card border-border rounded-3xl p-0 overflow-hidden">
          <DialogHeader className="p-8 bg-slate-950 text-white">
            <DialogTitle className="text-2xl font-headline font-bold flex items-center gap-3">
              <ShieldCheck className="size-6 text-primary" />
              {isComercial ? "Configuração Comercial RTM" : "Visualização de Parâmetros"}
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              {isComercial 
                ? `Capture os dados de venda para a ativação de ${selectedClient?.displayName}` 
                : `Consulta de dados institucionais para ${selectedClient?.institutionName}`}
            </DialogDescription>
          </DialogHeader>

          <div className="p-8 grid grid-cols-2 gap-6 max-h-[70vh] overflow-y-auto">
            {/* Campo: Instituição */}
            <div className="col-span-2 md:col-span-1 space-y-2">
              <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Instituição</Label>
              <div className="relative">
                <Building2 className="absolute left-3 top-3 size-4 text-muted-foreground" />
                <Input 
                  value={institutionName} 
                  onChange={(e) => setInstitutionName(e.target.value)} 
                  disabled={!isComercial}
                  className="pl-10 h-11 bg-background border-border rounded-xl"
                />
              </div>
            </div>

            {/* Campo: E-mail (Read Only) */}
            <div className="col-span-2 md:col-span-1 space-y-2 opacity-80">
              <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">E-mail de Contato</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 size-4 text-muted-foreground" />
                <Input 
                  value={selectedClient?.email || ""} 
                  disabled 
                  className="pl-10 h-11 bg-muted/50 border-border rounded-xl cursor-not-allowed"
                />
              </div>
            </div>

            {/* Campo: Consultor RTM */}
            <div className="col-span-2 md:col-span-1 space-y-2">
              <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Consultor RTM</Label>
              <div className="relative">
                <UserCircle className="absolute left-3 top-3 size-4 text-muted-foreground" />
                <Input 
                  placeholder="Nome do Executivo de Contas"
                  value={consultantName} 
                  onChange={(e) => setConsultantName(e.target.value)} 
                  disabled={!isComercial}
                  className="pl-10 h-11 bg-background border-border rounded-xl"
                />
              </div>
            </div>

            {/* Campo: Telefone */}
            <div className="col-span-2 md:col-span-1 space-y-2">
              <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Telefone</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 size-4 text-muted-foreground" />
                <Input 
                  placeholder="(00) 00000-0000"
                  value={phoneNumber} 
                  onChange={(e) => setPhoneNumber(e.target.value)} 
                  disabled={!isComercial}
                  className="pl-10 h-11 bg-background border-border rounded-xl"
                />
              </div>
            </div>

            {/* Campo: OV */}
            <div className="col-span-2 md:col-span-1 space-y-2">
              <Label className="text-xs font-bold uppercase tracking-widest text-primary font-black">OV (Ordem de Venda) *</Label>
              <div className="relative">
                <Hash className="absolute left-3 top-3 size-4 text-primary" />
                <Input 
                  placeholder="Ex: OV-2024-001"
                  value={orderValue} 
                  onChange={(e) => setOrderValue(e.target.value)} 
                  disabled={!isComercial}
                  className="pl-10 h-11 bg-background border-primary/50 focus:border-primary rounded-xl font-bold"
                />
              </div>
            </div>

            {/* Seleção de Produtos */}
            <div className="col-span-2 space-y-4 border-t border-border pt-6">
              <Label className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2">
                <Zap className="size-4" /> Produtos para Ativação
              </Label>
              <div className="grid grid-cols-2 gap-3">
                {productsLoading ? (
                  <div className="col-span-2 py-4 text-center"><Loader2 className="size-4 animate-spin mx-auto text-primary" /></div>
                ) : dbProducts.length > 0 ? dbProducts.map((prod) => (
                  <div 
                    key={prod.id} 
                    className={`flex items-center space-x-3 p-4 rounded-2xl border-2 transition-all ${isComercial ? 'cursor-pointer' : 'cursor-default'} ${selectedProductIds.includes(prod.id!) ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30 bg-muted/20'}`}
                    onClick={() => toggleProduct(prod.id!)}
                  >
                    <Checkbox checked={selectedProductIds.includes(prod.id!)} disabled={!isComercial} className="rounded-full border-primary" />
                    <div className="flex flex-col">
                      <span className="text-sm font-bold leading-none text-foreground">{prod.name}</span>
                      <span className="text-[10px] text-muted-foreground mt-1 truncate w-40">{prod.description}</span>
                    </div>
                  </div>
                )) : (
                  <div className="col-span-2 p-4 text-center text-xs text-muted-foreground italic bg-muted/20 rounded-xl border border-dashed border-border">
                    Nenhum produto cadastrado pelo suporte.
                  </div>
                )}
              </div>
            </div>

            {/* Observações Importantes */}
            <div className="col-span-2 space-y-2 border-t border-border pt-6">
              <Label className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                <FileText className="size-4 text-primary" />
                Observações Importantes
              </Label>
              <Textarea 
                value={commercialNotes} 
                onChange={(e) => setCommercialNotes(e.target.value)} 
                placeholder={isComercial ? "Insira avisos críticos, prazos regulatórios ou particularidades técnicas..." : "Nenhuma nota inserida."}
                className="min-h-[120px] bg-background border-border rounded-2xl text-sm leading-relaxed"
                disabled={!isComercial}
              />
            </div>
          </div>

          <DialogFooter className="p-8 bg-muted/20 border-t border-border flex items-center justify-between">
            {!isComercial && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground italic font-medium">
                <Lock className="size-3" /> Apenas o comercial pode editar estes parâmetros de venda.
              </div>
            )}
            <div className="flex gap-3 ml-auto">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="rounded-xl font-bold px-6 border-border hover:bg-background">
                {isComercial ? "Cancelar" : "Fechar"}
              </Button>
              {isComercial && (
                <Button 
                  disabled={!orderValue || selectedProductIds.length === 0 || isSubmitting || !institutionName} 
                  onClick={handleApprove}
                  className="rounded-xl font-bold px-8"
                >
                  {isSubmitting && <Loader2 className="size-4 animate-spin mr-2" />}
                  Confirmar Ativação
                </Button>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
