"use client";

import { DashboardLayout } from "@/components/dashboard-layout";
import { useCollection, useFirestore, useUser, useDoc } from "@/firebase";
import { collection, query, addDoc, serverTimestamp, doc, orderBy, updateDoc, deleteDoc } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Product, ActivationFlow, FlowStep, UserProfile } from "@/lib/types";
import { Plus, GripVertical, ArrowLeft, Loader2, GitFork, CheckCircle2, ShieldCheck, User, Headset, HardDrive, FileEdit, Save, Rocket, Edit, Trash2, Settings2 } from "lucide-react";
import { useState, useMemo, use } from "react";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export default function FlowDetailsPage({ params }: { params: Promise<{ productId: string, flowId: string }> }) {
  const { productId, flowId } = use(params);
  const db = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const router = useRouter();
  
  const productRef = useMemo(() => (user ? doc(db, "products", productId) : null), [db, user, productId]);
  const { data: product } = useDoc<Product>(productRef);

  const flowRef = useMemo(() => (user ? doc(db, "products", productId, "activationFlows", flowId) : null), [db, user, productId, flowId]);
  const { data: flow, loading: flowLoading } = useDoc<ActivationFlow>(flowRef);

  const userRef = useMemo(() => (user ? doc(db, "users", user.uid) : null), [user, db]);
  const { data: profile } = useDoc<UserProfile>(userRef);
  const isSupport = profile?.adminType === 'suporte';

  const stepsQuery = useMemo(() => {
    if (!user) return null;
    return query(
      collection(db, "products", productId, "activationFlows", flowId, "steps"),
      orderBy("order", "asc")
    );
  }, [db, user, productId, flowId]);
  const { data: steps, loading: stepsLoading } = useCollection<FlowStep>(stepsQuery);

  // States para Fluxo
  const [isEditFlowOpen, setIsEditFlowOpen] = useState(false);
  const [editedFlow, setEditedFlow] = useState({ name: '', description: '' });

  // States para Etapas
  const [isNewStepOpen, setIsNewStepOpen] = useState(false);
  const [isEditStepOpen, setIsEditStepOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState<Partial<FlowStep>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreateStep = async () => {
    if (!user || isSubmitting) return;
    setIsSubmitting(true);
    
    const nextOrder = steps.length + 1;
    const stepData = {
      ...currentStep,
      order: nextOrder,
      status: 'active',
      type: 'upload', 
      createdAt: new Date().toISOString(),
      updatedAt: serverTimestamp()
    };

    addDoc(collection(db, "products", productId, "activationFlows", flowId, "steps"), stepData)
      .then(() => {
        toast({ title: "Etapa Adicionada" });
        setIsNewStepOpen(false);
        setCurrentStep({});
      })
      .catch(async (error) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: `products/${productId}/activationFlows/${flowId}/steps`,
          operation: 'create',
          requestResourceData: stepData,
        }));
      })
      .finally(() => setIsSubmitting(false));
  };

  const handleUpdateStep = async () => {
    if (!user || !currentStep.id || isSubmitting) return;
    setIsSubmitting(true);

    const stepRef = doc(db, "products", productId, "activationFlows", flowId, "steps", currentStep.id);
    const updateData = {
      name: currentStep.name,
      description: currentStep.description,
      responsible: currentStep.responsible,
      estimatedTimeInHours: currentStep.estimatedTimeInHours,
      required: currentStep.required,
      updatedAt: serverTimestamp()
    };

    updateDoc(stepRef, updateData)
      .then(() => {
        toast({ title: "Etapa Atualizada" });
        setIsEditStepOpen(false);
      })
      .catch((error) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: stepRef.path,
          operation: 'update',
          requestResourceData: updateData,
        }));
      })
      .finally(() => setIsSubmitting(false));
  };

  const handleDeleteStep = async (id: string) => {
    if (!isSupport) return;
    const stepRef = doc(db, "products", productId, "activationFlows", flowId, "steps", id);
    
    deleteDoc(stepRef)
      .then(() => toast({ title: "Etapa Excluída" }))
      .catch(() => toast({ variant: "destructive", title: "Erro ao excluir etapa" }));
  };

  const handleUpdateFlowMeta = async () => {
    if (!flowRef || isSubmitting) return;
    setIsSubmitting(true);

    updateDoc(flowRef, {
      ...editedFlow,
      updatedAt: serverTimestamp()
    })
    .then(() => {
      toast({ title: "Fluxo Técnico Atualizado" });
      setIsEditFlowOpen(false);
    })
    .catch((e) => toast({ variant: "destructive", title: "Erro ao atualizar fluxo" }))
    .finally(() => setIsSubmitting(false));
  };

  const handleDeleteFlow = async () => {
    if (!flowRef || !isSupport) return;
    deleteDoc(flowRef)
      .then(() => {
        toast({ title: "Fluxo Excluído Permanentemente" });
        router.push(`/dashboard/admin/products/${productId}`);
      })
      .catch(() => toast({ variant: "destructive", title: "Erro ao excluir fluxo" }));
  };

  const handleUpdateFlowStatus = async (published: boolean) => {
    if (!user || !flowRef || isSubmitting) return;
    setIsSubmitting(true);

    const updateData = {
      published,
      status: published ? 'active' : 'draft',
      updatedAt: serverTimestamp()
    };

    updateDoc(flowRef, updateData)
      .then(() => {
        toast({ 
          title: published ? "Fluxo Publicado" : "Fluxo Salvo como Rascunho"
        });
      })
      .catch(async (error) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: flowRef.path,
          operation: 'update',
          requestResourceData: updateData,
        }));
      })
      .finally(() => setIsSubmitting(false));
  };

  const openEditStep = (step: FlowStep) => {
    setCurrentStep(step);
    setIsEditStepOpen(true);
  };

  const openEditFlow = () => {
    if (flow) {
      setEditedFlow({ name: flow.name, description: flow.description });
      setIsEditFlowOpen(true);
    }
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
      <div className="space-y-8 pb-32">
        <div className="flex flex-col gap-4">
          <Button variant="ghost" asChild className="w-fit -ml-4 gap-2 text-muted-foreground hover:text-primary">
            <Link href={`/dashboard/admin/products/${productId}`}><ArrowLeft className="size-4" /> Voltar ao Produto</Link>
          </Button>
          
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <GitFork className="size-8 text-primary" />
                <h1 className="text-3xl font-bold font-headline text-slate-900">{flow.name}</h1>
                <Badge className={cn("rounded-sm", flow.published ? "bg-emerald-500" : "bg-slate-500")}>
                  {flow.published ? 'Publicado' : 'Rascunho'}
                </Badge>
                {isSupport && (
                  <Button variant="ghost" size="icon" onClick={openEditFlow} className="text-slate-400 hover:text-primary">
                    <Edit className="size-4" />
                  </Button>
                )}
              </div>
              <p className="text-muted-foreground max-w-2xl">{flow.description}</p>
            </div>
            
            <div className="flex gap-2">
               {isSupport && (
                 <>
                   <AlertDialog>
                     <AlertDialogTrigger asChild>
                       <Button variant="outline" className="text-destructive hover:bg-destructive/10 border-destructive/20 rounded-full font-bold">
                         <Trash2 className="size-4" />
                       </Button>
                     </AlertDialogTrigger>
                     <AlertDialogContent>
                       <AlertDialogHeader>
                         <AlertDialogTitle>Excluir Fluxo Técnico?</AlertDialogTitle>
                         <AlertDialogDescription>Esta ação é irreversível e removerá todas as etapas associadas a este roteiro.</AlertDialogDescription>
                       </AlertDialogHeader>
                       <AlertDialogFooter>
                         <AlertDialogCancel>Cancelar</AlertDialogCancel>
                         <AlertDialogAction onClick={handleDeleteFlow} className="bg-destructive text-white hover:bg-destructive/90">Excluir Fluxo</AlertDialogAction>
                       </AlertDialogFooter>
                     </AlertDialogContent>
                   </AlertDialog>

                   <Dialog open={isNewStepOpen} onOpenChange={setIsNewStepOpen}>
                    <DialogTrigger asChild>
                      <Button className="gap-2 rounded-full font-bold">
                        <Plus className="size-4" /> Adicionar Etapa
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Nova Etapa do Workflow</DialogTitle>
                        <DialogDescription>Defina uma ação obrigatória para a jornada.</DialogDescription>
                      </DialogHeader>
                      <StepFormFields step={currentStep} setStep={setCurrentStep} />
                      <DialogFooter>
                        <Button variant="outline" onClick={() => { setIsNewStepOpen(false); setCurrentStep({}); }}>Cancelar</Button>
                        <Button disabled={!currentStep.name || isSubmitting} onClick={handleCreateStep} className="gap-2">
                          {isSubmitting && <Loader2 className="size-4 animate-spin" />}
                          Adicionar
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                 </>
               )}
            </div>
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
                    isSupport ? "hover:border-primary cursor-grab active:cursor-grabbing" : ""
                  )}>
                    <span className="font-bold text-slate-400">{step.order}</span>
                  </div>

                  <Card className="hover:border-primary/40 transition-all shadow-sm">
                    <CardContent className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-3">
                          <h5 className="font-bold text-slate-900">{step.name}</h5>
                          {step.required && <Badge className="bg-destructive/10 text-destructive border-destructive/20 text-[8px] uppercase font-black">Obrigatório</Badge>}
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed max-w-xl">{step.description}</p>
                      </div>

                      <div className="flex items-center gap-6">
                        <div className="flex flex-col items-end gap-1">
                          <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Responsável</span>
                          <Badge variant="outline" className="gap-1.5 py-1 px-3 text-[10px] uppercase font-bold bg-slate-50 text-slate-600 border-slate-200">
                            {getResponsibleIcon(step.responsible)}
                            {step.responsible}
                          </Badge>
                        </div>
                        
                        <div className="flex flex-col items-end gap-1 border-l pl-6">
                          <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">SLA</span>
                          <span className="text-xs font-bold text-slate-900">{Number(step.estimatedTimeInHours || 0)} horas</span>
                        </div>

                        {isSupport && (
                          <div className="flex items-center gap-1 border-l pl-6">
                            <Button variant="ghost" size="icon" onClick={() => openEditStep(step)} className="size-8 text-slate-400 hover:text-primary">
                              <Edit className="size-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="size-8 text-slate-400 hover:text-destructive">
                                  <Trash2 className="size-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Excluir Etapa?</AlertDialogTitle>
                                  <AlertDialogDescription>Esta etapa será removida deste roteiro técnico. Você pode precisar reordenar as etapas restantes.</AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Voltar</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDeleteStep(step.id!)} className="bg-destructive text-white">Excluir Etapa</AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        )}
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

        {/* Dialog Edição de Fluxo */}
        <Dialog open={isEditFlowOpen} onOpenChange={setIsEditFlowOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Fluxo Técnico</DialogTitle>
              <DialogDescription>Atualize os metadados do roteiro de ativação.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Nome do Fluxo</Label>
                <Input value={editedFlow.name} onChange={e => setEditedFlow({...editedFlow, name: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Descrição da Jornada</Label>
                <Textarea value={editedFlow.description} onChange={e => setEditedFlow({...editedFlow, description: e.target.value})} className="min-h-[100px]" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditFlowOpen(false)}>Cancelar</Button>
              <Button disabled={!editedFlow.name || isSubmitting} onClick={handleUpdateFlowMeta}>
                {isSubmitting && <Loader2 className="size-4 animate-spin mr-2" />}
                Salvar Alterações
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog Edição de Etapa */}
        <Dialog open={isEditStepOpen} onOpenChange={setIsEditStepOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Editar Etapa: {currentStep.name}</DialogTitle>
              <DialogDescription>Ajuste os parâmetros técnicos desta etapa.</DialogDescription>
            </DialogHeader>
            <StepFormFields step={currentStep} setStep={setCurrentStep} />
            <DialogFooter>
              <Button variant="outline" onClick={() => { setIsEditStepOpen(false); setCurrentStep({}); }}>Cancelar</Button>
              <Button disabled={!currentStep.name || isSubmitting} onClick={handleUpdateStep}>
                {isSubmitting && <Loader2 className="size-4 animate-spin mr-2" />}
                Salvar Etapa
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

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
              Mover para Rascunho
            </Button>
            
            <Button 
              className="font-bold px-8 bg-primary hover:bg-accent"
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

function StepFormFields({ step, setStep }: { step: Partial<FlowStep>, setStep: (s: any) => void }) {
  return (
    <div className="grid grid-cols-2 gap-4 py-4">
      <div className="col-span-2 space-y-2">
        <Label>Nome da Etapa</Label>
        <Input placeholder="Ex: Configuração de Túnel VPN" value={step.name || ''} onChange={e => setStep({...step, name: e.target.value})} />
      </div>
      <div className="col-span-2 space-y-2">
        <Label>Descrição Técnica</Label>
        <Textarea placeholder="Instruções para o responsável..." value={step.description || ''} onChange={e => setStep({...step, description: e.target.value})} />
      </div>
      <div className="space-y-2">
        <Label>Perfil Responsável</Label>
        <Select value={step.responsible || 'suporte'} onValueChange={(val: any) => setStep({...step, responsible: val})}>
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
          value={step.estimatedTimeInHours || ''} 
          onChange={e => {
            const val = parseInt(e.target.value);
            setStep({...step, estimatedTimeInHours: isNaN(val) ? 0 : val});
          }} 
        />
      </div>
      <div className="flex items-center space-x-2 pt-8">
        <input 
          type="checkbox" 
          id="required-check" 
          className="size-4 accent-primary"
          checked={step.required || false}
          onChange={e => setStep({...step, required: e.target.checked})}
        />
        <Label htmlFor="required-check" className="cursor-pointer">Etapa Obrigatória</Label>
      </div>
    </div>
  );
}