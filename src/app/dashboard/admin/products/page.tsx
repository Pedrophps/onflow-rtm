
'use client';

import { DashboardLayout } from "@/components/dashboard-layout";
import { useCollection, useFirestore, useUser, useDoc } from "@/firebase";
import { collection, query, addDoc, serverTimestamp, doc } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Product, UserProfile } from "@/lib/types";
import { Plus, Package, ArrowRight, Loader2, Info } from "lucide-react";
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

  const productsQuery = useMemo(() => query(collection(db, "products")), [db]);
  const { data: products, loading: productsLoading } = useCollection<Product>(productsQuery);

  const [isNewProductOpen, setIsNewProductOpen] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: '', description: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreateProduct = async () => {
    if (!user || isSubmitting) return;
    setIsSubmitting(true);
    
    try {
      await addDoc(collection(db, "products"), {
        ...newProduct,
        status: 'draft',
        published: false,
        createdAt: new Date().toISOString(),
        updatedAt: serverTimestamp(),
        createdBy: user.uid,
        visibility: { suporte: true, comercial: true }
      });
      
      toast({ title: "Produto Criado", description: "O novo produto foi registrado como rascunho." });
      setIsNewProductOpen(false);
      setNewProduct({ name: '', description: '' });
    } catch (e) {
      toast({ variant: "destructive", title: "Erro ao criar", description: "Verifique suas permissões de suporte." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout role="admin">
      <div className="space-y-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold font-headline text-slate-900">Catálogo de Produtos</h1>
            <p className="text-muted-foreground">Gerencie os ativos financeiros e seus fluxos de ativação.</p>
          </div>
          
          {isSupport && (
            <Dialog open={isNewProductOpen} onOpenChange={setIsNewProductOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2 rounded-full font-bold shadow-md">
                  <Plus className="size-4" /> Novo Produto
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Novo Produto RTM</DialogTitle>
                  <DialogDescription>Cadastre um novo serviço financeiro no ecossistema.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Nome do Produto</Label>
                    <Input placeholder="Ex: Mensageria SWIFT" value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label>Descrição Curta</Label>
                    <Textarea placeholder="Finalidade do produto no mercado..." value={newProduct.description} onChange={e => setNewProduct({...newProduct, description: e.target.value})} />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsNewProductOpen(false)}>Cancelar</Button>
                  <Button disabled={!newProduct.name || isSubmitting} onClick={handleCreateProduct}>
                    {isSubmitting && <Loader2 className="size-4 animate-spin mr-2" />}
                    Criar Produto
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {!isSupport && (
          <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-100 rounded-xl text-blue-800 text-sm">
            <Info className="size-5 text-blue-600" />
            <p>Seu perfil de <strong>Comercial</strong> permite apenas a visualização dos produtos e fluxos configurados pelo Suporte.</p>
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {productsLoading ? (
            <div className="col-span-full flex justify-center py-20"><Loader2 className="size-10 animate-spin text-primary" /></div>
          ) : products.length > 0 ? (
            products.map((product) => (
              <Card key={product.id} className="group hover:border-primary/50 transition-all bg-white shadow-sm overflow-hidden flex flex-col">
                <CardHeader className="pb-3 border-b bg-slate-50/50">
                  <div className="flex justify-between items-start mb-2">
                    <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                      <Package className="size-5" />
                    </div>
                    <Badge variant={product.published ? "default" : "secondary"} className="uppercase text-[10px] font-bold">
                      {product.published ? "Publicado" : "Draft"}
                    </Badge>
                  </div>
                  <CardTitle className="text-xl">{product.name}</CardTitle>
                </CardHeader>
                <CardContent className="pt-4 flex-1 flex flex-col justify-between space-y-4">
                  <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed italic">
                    {product.description || "Sem descrição disponível."}
                  </p>
                  <Button asChild variant="outline" className="w-full rounded-full gap-2 border-2 hover:bg-primary hover:text-white transition-all group-hover:border-primary">
                    <Link href={`/dashboard/admin/products/${product.id}`}>
                      Configurar Fluxos <ArrowRight className="size-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="col-span-full p-20 text-center border-2 border-dashed rounded-3xl space-y-4">
              <Package className="size-12 mx-auto text-muted-foreground/20" />
              <div className="space-y-1">
                <p className="text-lg font-bold">Nenhum produto cadastrado</p>
                <p className="text-sm text-muted-foreground">Inicie o catálogo definindo o primeiro serviço crítico.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
