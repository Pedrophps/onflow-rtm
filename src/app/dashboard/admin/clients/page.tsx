
"use client";

import { DashboardLayout } from "@/components/dashboard-layout";
import { useCollection, useFirestore } from "@/firebase";
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
import { UserCheck, ShieldAlert, Search, Filter, MoreHorizontal, CheckCircle2 } from "lucide-react";
import { useState, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import { useSearchParams } from "next/navigation";

export default function ClientsAdminPage() {
  const db = useFirestore();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const currentView = searchParams.get('view') || 'suporte';
  
  const clientsQuery = useMemo(() => query(collection(db, "users"), where("role", "==", "client")), [db]);
  const { data: clients, loading } = useCollection<UserProfile>(clientsQuery);

  const [selectedClient, setSelectedClient] = useState<UserProfile | null>(null);
  const [clientCode, setClientCode] = useState("");
  const [activeProduct, setActiveProduct] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const pendingClients = clients.filter(c => c.status === 'pending');
  const approvedClients = clients.filter(c => c.status === 'approved');

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
      description: `O acesso de ${client.displayName} foi liberado com sucesso.`
    });
    
    setIsDialogOpen(false);
    setClientCode("");
    setActiveProduct("");
  };

  return (
    <DashboardLayout role="admin">
      <div className="space-y-8">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-bold font-headline">Gestão de Clientes</h1>
            <p className="text-muted-foreground">Acompanhe e valide o acesso de novas instituições.</p>
          </div>
          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input placeholder="Buscar por CNPJ ou Nome..." className="pl-10 w-64" />
            </div>
            <Button variant="outline" size="icon"><Filter className="size-4" /></Button>
          </div>
        </div>

        {currentView === 'comercial' && pendingClients.length > 0 && (
          <section className="space-y-4">
            <h3 className="text-lg font-bold flex items-center gap-2 text-amber-600">
              <ShieldAlert className="size-5" /> Pendentes de Aprovação Comercial
            </h3>
            <div className="grid gap-4 md:grid-cols-2">
              {pendingClients.map((client) => (
                <Card key={client.id} className="border-amber-200 bg-amber-50/30">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-base">{client.displayName}</CardTitle>
                        <CardDescription>{client.cnpj || 'CNPJ não informado'}</CardDescription>
                      </div>
                      <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-200">Aguardando Comercial</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="flex justify-between items-center">
                    <div className="text-xs text-muted-foreground">
                      Cadastrado em: {new Date(client.createdAt).toLocaleDateString()}
                    </div>
                    <Dialog open={isDialogOpen && selectedClient?.id === client.id} onOpenChange={(open) => {
                      setIsDialogOpen(open);
                      if(open) setSelectedClient(client);
                    }}>
                      <DialogTrigger asChild>
                        <Button size="sm" className="gap-2">
                          <UserCheck className="size-4" /> Validar Acesso
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Aprovação de Cliente</DialogTitle>
                          <DialogDescription>
                            Configure os parâmetros de integração para <strong>{client.displayName}</strong>.
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
                                <SelectValue placeholder="Selecione o produto principal" />
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
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Base de Clientes</CardTitle>
            <CardDescription>Lista completa de instituições cadastradas no sistema.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Instituição</TableHead>
                  <TableHead>CNPJ</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Código RTM</TableHead>
                  <TableHead>Produto Ativo</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell className="font-medium">{client.displayName}</TableCell>
                    <TableCell>{client.cnpj || '-'}</TableCell>
                    <TableCell>
                      <Badge variant={client.status === 'approved' ? 'default' : 'secondary'} className={client.status === 'approved' ? 'bg-emerald-500' : ''}>
                        {client.status === 'approved' ? 'Ativo' : 'Pendente'}
                      </Badge>
                    </TableCell>
                    <TableCell>{client.clientCode || '-'}</TableCell>
                    <TableCell>{client.activeProduct || '-'}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon"><MoreHorizontal className="size-4" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
                {!loading && clients.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                      Nenhum cliente cadastrado ainda.
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
