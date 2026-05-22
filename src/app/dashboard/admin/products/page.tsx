'use client';

import { DashboardLayout } from "@/components/dashboard-layout";
import { useCollection, useFirestore, useUser, useDoc } from "@/firebase";
import { collection, query, addDoc, serverTimestamp, doc, deleteDoc, updateDoc } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Product, UserProfile } from "@/lib/types";
import { Plus, Package, ArrowRight, Loader2, Info, Trash2, Edit } from "lucide-react";
import { useState, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";

export default function ProductsPage() {
  const db = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  
  const userRef = useMemo(() => (user ? doc(db, "users", user.uid) : null), [user, db]);
  const { data: profile } = useDoc<UserProfile>(userRef);
  const isSupport = profile?.adminType === 'suporte';

  const productsQuery = useMemo(() => {
    if (!user) return null;
    return query(collection(db, "products"));
  }, [db, user]);
  const { data: products, loading: productsLoading } = useCollection<Product>(productsQuery);

  const [isNewProductOpen, setIsNewProductOpen] = useState(false);
  const [isEditProductOpen, setIsEditProductOpen] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<Partial<Product>>({ name: '', description: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreateProduct = async () => {
    if (!user || isSubmitting) return;
    setIsSubmitting(true);
    
    try {
      await addDoc(collection(db, "products"), {
        name: currentProduct.name,
        description: currentProduct.description,
        status: 'draft',
        published: false,
        createdAt: new Date().toISOString(),
        updatedAt: serverTimestamp(),
        createdBy: user.uid,
        visibility: { suporte: true, comercial: true }
      });
      
      toast({ title: "Produto Criado", description: "O novo produto foi registrado como rascunho." });
      setIsNewProductOpen(false);
      setCurrentProduct({ name: '', description: '' });
    } catch (e) {
      toast({ variant: "destructive", title: "Erro ao criar", description: "Verifique suas permissões de suporte." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateProduct = async () => {
    if (!user || !currentProduct.id || isSubmitting) return;
    setIsSubmitting(true);

    const productRef = doc(db, "products", currentProduct.id);
    try {
      await updateDoc(productRef, {
        name: currentProduct.name,
        description: currentProduct.description,
        updatedAt: serverTimestamp()
      });
      toast({ title: "Produto Atualizado", description: "As alterações foram salvas com sucesso." });
      setIsEditProductOpen(false);
    } catch (e) {
      toast({ variant: "destructive", title: "Erro ao atualizar", description: "Não foi possível salvar as alterações." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!user || !isSupport) return;
    
    const productRef = doc(db, "products", productId);
    try {
      await deleteDoc(productRef);
      toast({ title: "Produto Excluído", description: "O serviço foi removido do catálogo com sucesso." });
    } catch (error) {
      toast({ variant: "destructive", title: "Erro ao excluir", description: "Não foi possível remover o produto." });
    }
  };

  const openEdit = (product: Product) => {
    setCurrentProduct(product);
    setIsEditProductOpen(true);
  };

  return (
    <DashboardLayout role="admin">
      <div className="space-y-8">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold font-headline text-slate-900 dark:text-white">Catálogo de Produtos</h1>
            <p className="text-muted-foreground">Gerencie os ativos financeiros e seus fluxos de ativação.</p>
          </div>
          
          {isSupport && (
            <Dialog open={isNewProductOpen} onOpenChange={setIsNewProductOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2 rounded-full font-bold shadow-md hover:scale-105 transition-transform" onClick={() => setCurrentProduct({ name: '', description: '' })}>
                  <Plus className="size-4" /> Novo Produto
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-card text-card-foreground border-border">
                <DialogHeader>
                  <DialogTitle>Novo Produto RTM</DialogTitle>
                  <DialogDescription>Cadastre um novo serviço financeiro no ecossistema.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Nome do Produto</Label>
                    <Input placeholder="Ex: Mensageria SWIFT" value={currentProduct.name} onChange={e => setCurrentProduct({...currentProduct, name: e.target.value})} className="bg-background focus:border-primary/50" />
                  </div>
                  <div className="space-y-2">
                    <Label>Descrição Curta</Label>
                    <Textarea placeholder="Finalidade do produto no mercado..." value={currentProduct.description} onChange={e => setCurrentProduct({...currentProduct, description: e.target.value})} className="bg-background min-h-[100px] focus:border-primary/50" />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsNewProductOpen(false)} className="hover:text-primary transition-colors">Cancelar</Button>
                  <Button disabled={!currentProduct.name || isSubmitting} onClick={handleCreateProduct} className="hover:opacity-90 transition-opacity">
                    {isSubmitting && <Loader2 className="size-4 animate-spin mr-2" />}
                    Criar Produto
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {!isSupport && (
          <div className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-xl text-blue-800 dark:text-blue-300 text-sm animate-in fade-in slide-in-from-top duration-500">
            <Info className="size-5 text-blue-600 dark:text-blue-400" />
            <p>Seu perfil de <strong>Comercial</strong> permite apenas a visualização dos produtos e fluxos configurados pelo Suporte.</p>
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {productsLoading ? (
            <div className="col-span-full flex justify-center py-20"><Loader2 className="size-10 animate-spin text-primary" /></div>
          ) : products.length > 0 ? (
            products.map((product) => (
              <Card key={product.id} className="group hover:border-primary/50 hover:bg-primary/5 transition-all bg-card shadow-sm overflow-hidden flex flex-col border-border duration-300">
                <CardHeader className="pb-3 border-b bg-muted/30 group-hover:bg-muted/10 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all duration-300">
                      <Package className="size-5" />
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={product.published ? "default" : "secondary"} className="uppercase text-[10px] font-bold">
                        {product.published ? "Publicado" : "Draft"}
                      </Badge>
                      {isSupport && (
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors" onClick={() => openEdit(product)}>
                            <Edit className="size-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
                                <Trash2 className="size-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="bg-card text-card-foreground border-border">
                              <AlertDialogHeader>
                                <AlertDialogTitle>Excluir Produto?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Esta ação removerá o produto <strong>{product.name}</strong> e todos os fluxos de ativação associados a ele. Esta ação não pode ser desfeita.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel className="hover:bg-muted">Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteProduct(product.id!)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors">
                                  Excluir Produto
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      )}
                    </div>
                  </div>
                  <CardTitle className="text-xl text-card-foreground group-hover:text-primary transition-colors">{product.name}</CardTitle>
                </CardHeader>
                <CardContent className="pt-4 flex-1 flex flex-col justify-between space-y-4">
                  <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed italic group-hover:text-foreground/80 transition-colors">
                    {product.description || "Sem descrição disponível."}
                  </p>
                  <Button asChild variant="outline" className="w-full rounded-full gap-2 border-2 hover:bg-primary hover:text-white hover:border-primary transition-all duration-300">
                    <Link href={`/dashboard/admin/products/${product.id}`}>
                      Configurar Fluxos <ArrowRight className="size-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="col-span-full p-20 text-center border-2 border-dashed rounded-3xl space-y-4 bg-muted/10 border-border">
              <Package className="size-12 mx-auto text-muted-foreground/20" />
              <div className="space-y-1">
                <p className="text-lg font-bold text-foreground">Nenhum produto cadastrado</p>
                <p className="text-sm text-muted-foreground">Inicie o catálogo definindo o primeiro serviço crítico.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <Dialog open={isEditProductOpen} onOpenChange={setIsEditProductOpen}>
        <DialogContent className="bg-card text-card-foreground border-border">
          <DialogHeader>
            <DialogTitle>Editar Produto RTM</DialogTitle>
            <DialogDescription>Atualize os metadados do serviço financeiro.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nome do Produto</Label>
              <Input value={currentProduct.name} onChange={e => setCurrentProduct({...currentProduct, name: e.target.value})} className="bg-background focus:border-primary/50" />
            </div>
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea value={currentProduct.description} onChange={e => setCurrentProduct({...currentProduct, description: e.target.value})} className="bg-background min-h-[100px] focus:border-primary/50" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditProductOpen(false)} className="hover:text-primary transition-colors">Cancelar</Button>
            <Button disabled={!currentProduct.name || isSubmitting} onClick={handleUpdateProduct} className="hover:opacity-90 transition-opacity">
              {isSubmitting && <Loader2 className="size-4 animate-spin mr-2" />}
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
