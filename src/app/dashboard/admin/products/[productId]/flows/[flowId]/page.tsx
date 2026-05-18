
'use client';

import { DashboardLayout } from "@/components/dashboard-layout";
import { useCollection, useFirestore, useUser, useDoc } from "@/firebase";
import { collection, query, addDoc, serverTimestamp, doc, orderBy, updateDoc } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Product, ActivationFlow, FlowStep, UserProfile } from "@/lib/types";
import { Plus, GripVertical, ArrowLeft, Loader2, GitFork, CheckCircle2, ShieldCheck, User, Headset, HardDrive, FileEdit, Save, Rocket } from "lucide-react";
import { useState, useMemo, use } from "react";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export default function FlowDetailsPage({ params }: { params: Promise<{ productId: string, flowId: string }> }) {
  const { productId, flowId } = use(params);
  const db = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  
  const productRef = useMemo(() => doc(db, "products", productId), [db, productId]);
  const { data: product } = useDoc<Product>(productRef);

  const flowRef = useMemo(() => doc(db, "products", productId, "activationFlows", flowId), [db, productId, flowId]);
  const { data: flow, loading: flowLoading } = useDoc<ActivationFlow>(flowRef);

  const userRef = useMemo(() => (user ? doc(db, "users", user.uid) : null), [user, db]);
  const { data: profile } = useDoc<UserProfile>(userRef);
  const isSupport = profile?.adminType === 'suporte';

  const stepsQuery = useMemo(() => query(
    collection(db, "products", productId, "activationFlows", flowId, "steps"),
    orderBy("order", "asc")
  ), [db, productId, flowId]);
  const { data: steps, loading: stepsLoading } = useCollection<FlowStep>(stepsQuery);

  const [isNewStepOpen, setIsNewStepOpen] = useState(false);
  const [newStep, setNewStep] = useState<Partial<FlowStep>>({ 
    name: '', 
    description: '', 
    responsible: 'suporte', 
    type: 'upload',
    estimatedTimeInHours: 8,
    required: true 
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreateStep = async () => {
    if (!user || isSubmitting) return;
    setIsSubmitting(true);
    
    const nextOrder = steps.length + 1;
    const stepData = {
      ...newStep,
      order: nextOrder,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: serverTimestamp()
    };

    addDoc(collection(db, "products", productId, "activationFlows", flowId, "steps"), stepData)
      .then(() => {
        toast({ title: "Etapa Adicionada", description: "O fluxo foi atualizado com sucesso." });
        setIsNewStepOpen(false);
        setNewStep({ name: '', description: '', responsible: 'suporte', type: 'upload', estimatedTimeInHours: 8, required: true });
      })
      .catch(async (error) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: `products/${productId}/activationFlows/${flowId}/steps`,
          operation: 'create',
          requestResourceData: stepData,
        }));
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  };

  const handleUpdateFlowStatus = async (published: boolean) => {
    if (!user || isSubmitting) return;
    setIsSubmitting(true);

    const updateData = {
      published,
      status: published ? 'active' : 'draft',
      updatedAt: serverTimestamp()
    };

    updateDoc(flowRef, updateData)
      .then(() => {
        toast({ 
          title: published ? "Fluxo Publicado" : "Fluxo Atualizado", 
          description: published ? "O fluxo agora está disponível para novos onboardings." : "As alterações foram salvas como rascunho."
        });
      })
      .catch(async (error) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: flowRef.path,
          operation: 'update',
          requestResourceData: updateData,
        }));
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  };

  const getResponsibleIcon = (role: string) => {
    const iconClass = "size-3.5 text-slate-600";
    switch (role) {
      case 'suporte': return <Headset className={iconClass} />;
      case 'comercial': return <ShieldCheck className={iconClass} />;
      case 'cliente': return <User className={iconClass} />;
      case 'infraestrutura': return <HardDrive className={iconClass} />;
      case 'compliance': return <CheckCircle2 className={iconClass} />;
      default: return <User className={iconClass} />;
    }
  };

  if (flowLoading) return <DashboardLayout role="admin"><div className="flex justify-center p-20"><Loader2 className="size-10 animate-spin text-primary" /></div></DashboardLayout>;
  if (!flow) return <DashboardLayout role="admin"><div className="text-center p-20">Fluxo não encontrado.</div></DashboardLayout>;

  return (
    <DashboardLayout role="admin">
      <div className="space-y-8 pb-24">
        <div className="flex flex-col gap-4">
          <Button variant="ghost" asChild className="w-fit -ml-4 gap-2 text-muted-foreground hover:text-primary">
            <Link href={`/dashboard/admin/products/${productId}`}><ArrowLeft className="size-4" /> Voltar ao Produto</Link>
          </Button>
          
          <div className="flex justify-between items-end">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <GitFork className="size-8 text-primary" />
                <h1 className="text-3xl font-bold font-headline text-slate-900">{flow.name}</h1>
                <Badge className={cn("rounded-sm", flow.published ? "bg-emerald-500" : "bg-slate-500")}>
                  {flow.published ? 'Publicado' : 'Rascunho'}
                </Badge>
              </div>
              <p className="text-muted-foreground max-w-2xl">{flow.description}</p>
            </div>
            
            {isSupport && (
              <Dialog open={isNewStepOpen} onOpenChange={setIsNewStepOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2 rounded-full font-bold shadow-md">
                    <Plus className="size-4" /> Adicionar Etapa
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Nova Etapa do Workflow</DialogTitle>
                    <DialogDescription>Defina uma ação obrigatória para a jornada.</DialogDescription>
                  </DialogHeader>
                  <div className="grid grid-cols-2 gap-4 py-4">
                    <div className="col-span-2 space-y-2">
                      <Label>Nome da Etapa</Label>
                      <Input placeholder="Ex: Configuração de Túnel VPN" value={newStep.name} onChange={e => setNewStep({...newStep, name: e.target.value})} />
                    </div>
                    <div className="col-span-2 space-y-2">
                      <Label>Descrição Técnica</Label>
                      <Textarea placeholder="Instruções para o responsável..." value={newStep.description} onChange={e => setNewStep({...newStep, description: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <Label>Perfil Responsável</Label>
                      <Select value={newStep.responsible} onValueChange={(val: any) => setNewStep({...newStep, responsible: val})}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="suporte">Suporte Técnico</SelectItem>
                          <SelectItem value="comercial">Gestão Comercial</SelectItem>
                          <SelectItem value="cliente">Instituição (Cliente)</SelectItem>
                          <SelectItem value="infraestrutura">Infraestrutura</SelectItem>
                          <SelectItem value="compliance">Compliance / Auditoria</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>SLA Estimado (Horas)</Label>
                      <Input 
                        type="number" 
                        value={newStep.estimatedTimeInHours || ''} 
                        onChange={e => {
                          const val = parseInt(e.target.value);
                          setNewStep({...newStep, estimatedTimeInHours: isNaN(val) ? 0 : val});
                        }} 
                      />
                    </div>
                  </div>
                  <DialogFooter className="gap-2 sm:gap-0">
                    <Button variant="outline" onClick={() => setIsNewStepOpen(false)}>Cancelar</Button>
                    <Button disabled={!newStep.name || isSubmitting} onClick={handleCreateStep} className="gap-2 bg-primary hover:bg-primary/90">
                      {isSubmitting && <Loader2 className="size-4 animate-spin" />}
                      Adicionar
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>

        <div className="bg-white rounded-3xl border shadow-sm overflow-hidden">
          <div className="p-6 border-b bg-slate-50/50 flex justify-between items-center">
            <div className="flex items-center gap-4 text-xs font-bold text-muted-foreground uppercase tracking-widest">
              <span>Sequência de Execução</span>
              <Badge variant="outline" className="rounded-sm bg-white">{steps.length} Etapas</Badge>
            </div>
          </div>
          
          <div className="p-6 space-y-4">
            {stepsLoading ? (
              <div className="flex justify-center py-20"><Loader2 className="size-10 animate-spin text-primary" /></div>
            ) : steps.length > 0 ? (
              steps.map((step, i) => (
                <div key={step.id} className="group relative pl-12">
                  {i < steps.length - 1 && (
                    <div className="absolute left-[23px] top-10 bottom-0 w-[2px] bg-slate-100 group-last:hidden" />
                  )}
                  
                  <div className={cn(
                    "absolute left-0 top-1 size-12 rounded-2xl border-2 bg-white flex items-center justify-center transition-all z-10",
                    isSupport ? "hover:border-primary hover:shadow-md cursor-grab active:cursor-grabbing" : ""
                  )}>
                    {isSupport ? <GripVertical className="size-5 text-slate-300" /> : <span className="font-bold text-slate-400">{step.order}</span>}
                  </div>

                  <Card className="hover:border-primary/40 transition-all">
                    <CardContent className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-3">
                          <h5 className="font-bold text-slate-900">{step.name}</h5>
                          {step.required && <Badge className="bg-red-50 text-red-600 border-red-100 text-[8px] uppercase font-black">Obrigatório</Badge>}
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed max-w-xl">{step.description}</p>
                      </div>

                      <div className="flex items-center gap-6">
                        <div className="flex flex-col items-end gap-1">
                          <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Responsável</span>
                          <Badge variant="secondary" className="gap-1.5 py-1 px-3 text-[10px] uppercase font-bold bg-slate-100 text-slate-700 border-slate-200">
                            {getResponsibleIcon(step.responsible)}
                            {step.responsible}
                          </Badge>
                        </div>
                        
                        <div className="flex flex-col items-end gap-1">
                          <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Tipo</span>
                          <span className="text-xs font-medium flex items-center gap-1.5 text-slate-900">
                            <FileEdit className="size-3.5 text-primary" />
                            {step.type === 'upload' ? 'Upload' : 'Form'}
                          </span>
                        </div>

                        <div className="flex flex-col items-end gap-1 border-l pl-6">
                          <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">SLA</span>
                          <span className="text-xs font-bold text-slate-900">{Number(step.estimatedTimeInHours || 0)} horas</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ))
            ) : (
              <div className="text-center py-20 space-y-4">
                <div className="size-16 rounded-full bg-slate-50 flex items-center justify-center mx-auto">
                  <Plus className="size-8 text-slate-200" />
                </div>
                <div className="space-y-1">
                  <p className="font-bold">Nenhuma etapa definida</p>
                  <p className="text-sm text-muted-foreground">Adicione a primeira ação para estruturar este fluxo.</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Rodapé de Ações do Fluxo */}
        {isSupport && (
          <div className="fixed bottom-0 right-0 left-0 md:left-64 bg-white/80 backdrop-blur-lg border-t p-4 px-10 flex justify-end items-center gap-4 z-50">
            <div className="mr-auto hidden md:block">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Status Atual</p>
              <div className="flex items-center gap-2">
                <div className={cn("size-2 rounded-full", flow.published ? "bg-emerald-500 animate-pulse" : "bg-slate-400")} />
                <span className="text-xs font-bold">{flow.published ? 'Fluxo Ativo para Clientes' : 'Aguardando Publicação'}</span>
              </div>
            </div>
            
            <Button 
              variant="outline" 
              className="font-bold border-2" 
              onClick={() => handleUpdateFlowStatus(false)}
              disabled={isSubmitting}
            >
              {isSubmitting && <Loader2 className="size-4 animate-spin mr-2" />}
              Salvar Rascunho
            </Button>
            
            <Button 
              className="font-bold px-8 shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90"
              onClick={() => handleUpdateFlowStatus(true)}
              disabled={isSubmitting}
            >
              {isSubmitting && <Loader2 className="size-4 animate-spin mr-2" />}
              Publicar Fluxo
            </Button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
