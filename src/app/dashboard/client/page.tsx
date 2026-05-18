
"use client";

import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { UserProfile, Product, OnboardingInstance } from "@/lib/types";
import { CheckCircle2, Clock, ShieldAlert, Loader2, Zap, LayoutDashboard, Building2, UserCheck, ArrowRight, Phone, AlertCircle, Save } from "lucide-react";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { useUser, useFirestore, useDoc, useCollection } from "@/firebase";
import { doc, collection, query, where, limit, updateDoc, serverTimestamp } from "firebase/firestore";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

export default function ClientDashboardPage() {
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  
  const userRef = useMemo(() => (user ? doc(db, "users", user.uid) : null), [user, db]);
  const { data: profile, loading: profileLoading } = useDoc<UserProfile>(userRef);
  
  const [isUpdatingPhone, setIsUpdatingPhone] = useState(false);
  const [newPhone, setNewPhone] = useState("");

  // Buscar Instância de Onboarding Ativa
  const instanceQuery = useMemo(() => 
    user ? query(
      collection(db, "onboardingInstances"),
      where("clientId", "==", user.uid),
      where("status", "==", "active"),
      limit(1)
    ) : null, 
  [db, user]);
  const { data: instances, loading: instanceLoading } = useCollection<OnboardingInstance>(instanceQuery);
  const instance = instances?.[0];

  // Buscar Produto
  const productRef = useMemo(() => instance?.productId ? doc(db, "products", instance.productId) : null, [db, instance]);
  const { data: product } = useDoc<Product>(productRef);

  // Buscar Total de Etapas (Simulado para o Dashboard)
  const stepsQuery = useMemo(() => 
    (instance?.productId && instance?.flowId) ? query(
      collection(db, "products", instance.productId, "activationFlows", instance.flowId, "steps")
    ) : null, 
  [db, instance]);
  const { data: steps, loading: stepsLoading } = useCollection(stepsQuery);

  const currentStepOrder = instance?.currentStepOrder || 1;
  const totalSteps = steps.length || 1;
  const progress = Math.round(((currentStepOrder - 1) / totalSteps) * 100);

  const handleUpdatePhone = async () => {
    if (!user || !newPhone) return;
    setIsUpdatingPhone(true);
    
    const clientRef = doc(db, "users", user.uid);
    try {
      await updateDoc(clientRef, {
        phoneNumber: newPhone,
        updatedAt: serverTimestamp()
      });
      toast({
        title: "Dados Atualizados",
        description: "Seu telefone de contato foi salvo com sucesso."
      });
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Erro ao salvar",
        description: "Não foi possível atualizar seus dados de contato."
      });
    } finally {
      setIsUpdatingPhone(false);
    }
  };

  if (profileLoading || instanceLoading || stepsLoading) {
    return (
      <DashboardLayout role="client">
        <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
          <Loader2 className="size-8 animate-spin text-primary" />
          <p className="text-muted-foreground font-medium text-sm">Preparando sua visão geral...</p>
        </div>
      </DashboardLayout>
    );
  }

  const isPhoneMissing = !profile?.phoneNumber;

  return (
    <DashboardLayout role="client">
      <div className="space-y-8">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold font-headline text-slate-900">Visão Geral</h1>
          <p className="text-muted-foreground">Bem-vindo ao OnFlow, {profile?.displayName}. Aqui está o resumo da sua jornada.</p>
        </div>

        {isPhoneMissing && (
          <Card className="border-l-4 border-l-amber-500 bg-amber-50 shadow-sm animate-in slide-in-from-top duration-500">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="size-12 rounded-2xl bg-amber-200/50 flex items-center justify-center text-amber-700">
                    <Phone className="size-6" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-bold text-amber-900">Ação Necessária: Contato Telefônico</h3>
                    <p className="text-xs text-amber-800/80">Para agilizar sua ativação técnica, precisamos de um telefone de contato direto.</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 w-full md:w-auto">
                  <Input 
                    placeholder="(00) 00000-0000" 
                    value={newPhone} 
                    onChange={(e) => setNewPhone(e.target.value)}
                    className="bg-white border-amber-200 w-full md:w-48"
                  />
                  <Button 
                    size="sm" 
                    className="bg-amber-600 hover:bg-amber-700 font-bold gap-2"
                    onClick={handleUpdatePhone}
                    disabled={isUpdatingPhone || !newPhone}
                  >
                    {isUpdatingPhone ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                    Salvar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-6 md:grid-cols-12">
          {/* Status Card */}
          <Card className="md:col-span-8 border-none shadow-xl bg-white overflow-hidden">
            <CardHeader className="bg-slate-50 border-b">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3 text-primary">
                  <LayoutDashboard className="size-5" />
                  <CardTitle className="text-lg">Status da Ativação</CardTitle>
                </div>
                {instance ? (
                  <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 uppercase text-[10px]">Ativação em Curso</Badge>
                ) : (
                  <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 uppercase text-[10px]">Aguardando Suporte</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-8">
              {instance ? (
                <>
                  <div className="flex flex-col md:flex-row justify-between gap-6">
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Produto Contratado</p>
                        <h2 className="text-2xl font-bold text-slate-900">{product?.name || profile?.activeProduct}</h2>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex flex-col">
                          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Etapa Atual</p>
                          <p className="text-sm font-bold text-primary">Etapa {currentStepOrder} de {totalSteps}</p>
                        </div>
                        <div className="h-8 w-px bg-slate-200" />
                        <div className="flex flex-col">
                          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Analista RTM</p>
                          <p className="text-sm font-bold text-slate-700">{instance.techName || "A definir"}</p>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-6xl font-black text-primary">{progress}%</span>
                      <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-1">Concluído</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-bold text-muted-foreground uppercase">
                      <span>Progresso Técnico</span>
                      <span>SLA Médio: 48h</span>
                    </div>
                    <Progress value={progress} className="h-3 rounded-full" />
                  </div>
                  <Button asChild className="w-full h-12 rounded-xl font-bold gap-2">
                    <Link href="/dashboard/client/activations">
                      Acessar Detalhes do Onboarding <ArrowRight className="size-4" />
                    </Link>
                  </Button>
                </>
              ) : (
                <div className="py-10 text-center space-y-4">
                  <div className="size-16 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center mx-auto">
                    <Clock className="size-8" />
                  </div>
                  <div className="space-y-1">
                    <p className="font-bold text-slate-900">Seu fluxo ainda não foi iniciado</p>
                    <p className="text-sm text-muted-foreground max-w-sm mx-auto">Nossa equipe de suporte está preparando o seu ambiente para o início da ativação técnica.</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Institutional Info */}
          <Card className="md:col-span-4 border-none shadow-xl bg-slate-900 text-white">
            <CardHeader>
              <CardTitle className="text-lg">Informações RTM</CardTitle>
              <CardDescription className="text-slate-400">Dados oficiais da sua conta institucional.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-0">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-xl bg-white/10 flex items-center justify-center text-primary">
                    <Building2 className="size-5" />
                  </div>
                  <div>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Instituição</p>
                    <p className="text-sm font-bold truncate max-w-[180px]">{profile?.institutionName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-xl bg-white/10 flex items-center justify-center text-primary">
                    <Zap className="size-5" />
                  </div>
                  <div>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">ID RTM (Client Code)</p>
                    <p className="text-sm font-mono font-bold">{profile?.clientCode || "Pendente"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-xl bg-white/10 flex items-center justify-center text-primary">
                    <Phone className="size-5" />
                  </div>
                  <div>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Contato de Emergência</p>
                    <p className="text-sm font-bold">{profile?.phoneNumber || "Não cadastrado"}</p>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-white/10 space-y-4">
                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Conformidade Cadastral</p>
                  <div className="space-y-2">
                    <CheckItem label="Aprovação Comercial" checked={profile?.status === 'approved'} />
                    <CheckItem label="Telefone de Contato" checked={!!profile?.phoneNumber} />
                    <CheckItem label="ID Atribuído" checked={!!profile?.clientCode} />
                    <CheckItem label="Instância Ativa" checked={!!instance} />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}

function CheckItem({ label, checked }: { label: string, checked: boolean }) {
  return (
    <div className="flex items-center justify-between text-[11px]">
      <span className="text-slate-300">{label}</span>
      {checked ? (
        <CheckCircle2 className="size-3.5 text-emerald-400" />
      ) : (
        <AlertCircle className="size-3.5 text-amber-400" />
      )}
    </div>
  );
}
