
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
import { Product, ActivationFlow, UserProfile } from "@/lib/types";
import { Plus, GitFork, ArrowRight, Loader2, Package, ArrowLeft, Clock } from "lucide-react";
import { useState, useMemo, use } from "react";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function ProductDetailsPage({ params }: { params: Promise<{ productId: string }> }) {
  const { productId } = use(params);
  const db = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const router = useRouter();
  
  const productRef = useMemo(() => (user ? doc(db, "products", productId) : null), [db, user, productId]);
  const { data: product, loading: productLoading } = useDoc<Product>(productRef);

  const userRef = useMemo(() => (user ? doc(db, "users", user.uid) : null), [user, db]);
  const { data: profile } = useDoc<UserProfile>(userRef);
  const isSupport = profile?.adminType === 'suporte';

  const flowsQuery = useMemo(() => {
    if (!user) return null;
    return query(collection(db, "products", productId, "activationFlows"));
  }, [db, user, productId]);
  const { data: flows, loading: flowsLoading } = useCollection<ActivationFlow>(flowsQuery);

  const [isNewFlowOpen, setIsNewFlowOpen] = useState(false);
  const [newFlow, setNewFlow] = useState({ name: '', description: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreateFlow = async () => {
    if (!user || isSubmitting) return;
    setIsSubmitting(true);
    
    try {
      await addDoc(collection(db, "products", productId, "activationFlows"), {
        ...newFlow,
        productId,
        active: true,
        published: false,
        status: 'draft',
        version: 1,
        createdAt: new Date().toISOString(),
        updatedAt: serverTimestamp(),
        createdBy: user.uid
      });
      
      toast({ title: "Fluxo Criado", description: "O novo fluxo de ativação foi registrado como rascunho." });
      setIsNewFlowOpen(false);
      setNewFlow({ name: '', description: '' });
    } catch (e) {
      toast({ variant: "destructive", title: "Erro ao criar", description: "Acesso negado. Apenas o suporte pode criar fluxos." });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (productLoading) return <DashboardLayout role="admin"><div className="flex justify-center p-20"><Loader2 className="size-10 animate-spin text-primary" /></div></DashboardLayout>;
  if (!product) return <DashboardLayout role="admin"><div className="text-center p-20">Produto não encontrado.</div></DashboardLayout>;

  return (
    <DashboardLayout role="admin">
      <div className="space-y-8">
        <div className="flex flex-col gap-4">
          <Button variant="ghost" asChild className="w-fit -ml-4 gap-2 text-muted-foreground hover:text-primary">
            <Link href="/dashboard/admin/products"><ArrowLeft className="size-4" /> Voltar ao Catálogo</Link>
          </Button>
          
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-6">
              <div className="size-16 rounded-2xl bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/20">
                <Package className="size-8" />
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-3xl font-bold font-headline text-slate-900">{product.name}</h1>
                </div>
                <p className="text-muted-foreground">{product.description}</p>
              </div>
            </div>
            
            {isSupport && (
              <Dialog open={isNewFlowOpen} onOpenChange={setIsNewFlowOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2 rounded-full font-bold shadow-md">
                    <Plus className="size-4" /> Novo Fluxo
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Novo Fluxo de Ativação</DialogTitle>
                    <DialogDescription>Defina uma jornada de onboarding para este produto.</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Nome do Fluxo</Label>
                      <Input placeholder="Ex: Onboarding Direto SPI" value={newFlow.name} onChange={e => setNewFlow({...newFlow, name: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <Label>Descrição da Jornada</Label>
                      <Textarea placeholder="Descreva os pré-requisitos e objetivos deste fluxo..." value={newFlow.description} onChange={e => setNewFlow({...newFlow, description: e.target.value})} />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsNewFlowOpen(false)}>Cancelar</Button>
                    <Button disabled={!newFlow.name || isSubmitting} onClick={handleCreateFlow}>
                      {isSubmitting && <Loader2 className="size-4 animate-spin mr-2" />}
                      Criar Fluxo
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          <div className="md:col-span-4 space-y-6">
            <Card className="bg-slate-900 text-white border-none shadow-xl">
              <CardHeader>
                <CardTitle className="text-sm font-bold uppercase tracking-widest opacity-60">Status de Ativos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center border-b border-white/10 pb-4">
                  <span className="text-xs">Fluxos Totais</span>
                  <span className="text-2xl font-bold">{flows.length}</span>
                </div>
                <div className="flex justify-between items-center border-b border-white/10 pb-4">
                  <span className="text-xs">Clientes Ativos</span>
                  <span className="text-2xl font-bold">12</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs">Versão do Produto</span>
                  <span className="text-2xl font-bold">v1.0.4</span>
                </div>
              </CardContent>
            </Card>

            <div className="p-6 rounded-2xl bg-amber-50 border border-amber-100 flex gap-4">
              <Clock className="size-5 text-amber-600 shrink-0" />
              <div className="space-y-1">
                <p className="text-xs font-bold text-amber-800 uppercase tracking-tighter">Nota de Arquitetura</p>
                <p className="text-[11px] text-amber-700 leading-relaxed">
                  Fluxos são templates. Ao iniciar um onboarding para um cliente, uma instância fixa deste fluxo será gerada para fins de auditoria.
                </p>
              </div>
            </div>
          </div>

          <div className="md:col-span-8 space-y-4">
            <h3 className="text-sm font-bold flex items-center gap-2 text-primary uppercase tracking-widest">
              <GitFork className="size-4" /> Fluxos de Ativação Disponíveis
            </h3>
            
            <div className="grid gap-4">
              {flowsLoading ? (
                <div className="flex justify-center py-10"><Loader2 className="size-8 animate-spin text-primary" /></div>
              ) : flows.length > 0 ? (
                flows.map((flow) => (
                  <Card key={flow.id} className="hover:border-primary transition-all cursor-pointer bg-white group" onClick={() => router.push(`/dashboard/admin/products/${productId}/flows/${flow.id}`)}>
                    <CardContent className="p-6 flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-3">
                          <h4 className="font-bold text-lg">{flow.name}</h4>
                          <Badge variant="outline" className="text-[9px] uppercase">v{flow.version}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-1">{flow.description}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right hidden sm:block">
                          <p className="text-[10px] font-bold text-muted-foreground uppercase">Status</p>
                          <p className="text-xs font-bold text-emerald-600">{flow.published ? 'Ativo' : 'Rascunho'}</p>
                        </div>
                        <div className="size-10 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all">
                          <ArrowRight className="size-5" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="p-20 text-center border-2 border-dashed rounded-3xl bg-muted/20">
                  <GitFork className="size-10 mx-auto text-muted-foreground/30 mb-4" />
                  <p className="text-sm font-medium text-muted-foreground">Nenhum fluxo definido para este produto.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
