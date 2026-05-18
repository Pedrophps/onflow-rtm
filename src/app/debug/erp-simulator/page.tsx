
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useFirestore, useUser } from '@/firebase';
import { processAutomationFromEmail } from '@/lib/automation-service';
import { Loader2, Mail, Zap, CheckCircle2, AlertTriangle, ArrowRight, Database, ShieldCheck, Cog, ClipboardList, Globe, Copy, Code, Lock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

export default function ERPSimulatorPage() {
  const db = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  
  const [subject, setSubject] = useState('SOLICITAÇÃO DE ATIVAÇÃO - WORKFLOW #99283');
  const [body, setBody] = useState(`Prezado Suporte RTM,

O Comercial acaba de fechar um novo contrato. Favor iniciar a ativação técnica conforme dados abaixo:

Cliente: BANCO INVESTIMENTOS ALPHA S.A.
CNPJ: 11.222.333/0001-44
Produto: MENSAGERIA SWIFT (PRODUTO PADRÃO)
Data da Venda: 20/05/2024

Este cliente possui urgência na conexão devido ao cronograma do Bacen.

Atenciosamente,
ERP OnFlow`);

  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<any>(null);

  const webhookUrl = typeof window !== 'undefined' ? `${window.location.origin}/api/webhook/erp-email` : '/api/webhook/erp-email';

  const jsonExample = JSON.stringify({
    subject: subject,
    body: body
  }, null, 2);

  const handleSimulate = async () => {
    if (!user) return;
    setIsProcessing(true);
    setResult(null);

    try {
      const automationResult = await processAutomationFromEmail(db, subject, body);
      setResult(automationResult);

      toast({
        title: "Integração Executada",
        description: "A IA processou o e-mail e a ativação já está na fila do suporte.",
      });
    } catch (error: any) {
      console.error(error);
      toast({ variant: "destructive", title: "Erro na Automação", description: error.message });
    } finally {
      setIsProcessing(false);
    }
  };

  const copyToClipboard = (text: string, title: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: title, description: "Copiado para a área de transferência." });
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8 font-body">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold font-headline text-slate-900 flex items-center gap-3">
              <Cog className="size-8 text-primary" /> Hub de Automação ERP
            </h1>
            <p className="text-muted-foreground text-sm">Passo a passo: Do E-mail recebido à fila de trabalho do Suporte.</p>
          </div>
          <Button variant="ghost" asChild><Link href="/debug/suite">Voltar ao Suite</Link></Button>
        </div>

        {/* Alerta de Autenticação para Webhook Externo */}
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex gap-4 items-start">
          <Lock className="size-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-sm font-bold text-amber-900">Nota sobre Testes Externos (Postman)</p>
            <p className="text-xs text-amber-800 leading-relaxed">
              O erro <strong>401 Unauthorized</strong> no Postman ocorre porque este ambiente de desenvolvimento é protegido por uma camada de segurança do Google. 
              Para testar agora, utilize o simulador abaixo. Em produção, o endpoint será público para o seu ERP.
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <Globe className="size-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">Endpoint Webhook</h3>
                  <p className="text-xs text-muted-foreground">URL para integração real via POST.</p>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-white p-2 px-4 rounded-xl border font-mono text-[10px] text-primary font-bold overflow-hidden">
                <span className="truncate">{webhookUrl}</span>
                <Button variant="ghost" size="icon" className="size-6 shrink-0" onClick={() => copyToClipboard(webhookUrl, "URL Copiada")}>
                  <Copy className="size-3" />
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 bg-white">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
                  <Code className="size-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">Exemplo para Postman</h3>
                  <p className="text-xs text-muted-foreground">JSON pronto para testar o POST.</p>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-slate-50 p-2 px-4 rounded-xl border font-mono text-[9px] text-slate-500 overflow-hidden">
                <span className="truncate">{"{ \"subject\": \"...\", \"body\": \"...\" }"}</span>
                <Button variant="ghost" size="icon" className="size-6 shrink-0" onClick={() => copyToClipboard(jsonExample, "JSON Copiado")}>
                  <Copy className="size-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid md:grid-cols-12 gap-8">
          <Card className="md:col-span-7 shadow-lg border-none overflow-hidden">
            <CardHeader className="bg-slate-900 text-white p-6">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm uppercase tracking-widest flex items-center gap-2">
                  <Mail className="size-4" /> Entrada de Dados (Simulada)
                </CardTitle>
                <Badge className="bg-primary/20 text-primary border-primary/20">Aguardando Webhook</Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-4 bg-white">
              <div className="space-y-2">
                <Label className="text-xs font-bold text-muted-foreground uppercase">Assunto do E-mail</Label>
                <Input value={subject} onChange={e => setSubject(e.target.value)} className="bg-slate-50 border-slate-200" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold text-muted-foreground uppercase">Corpo do E-mail Técnico</Label>
                <Textarea 
                  className="min-h-[250px] font-mono text-xs leading-relaxed bg-slate-50 border-slate-200" 
                  value={body} 
                  onChange={e => setBody(e.target.value)} 
                />
              </div>
              <Button 
                className="w-full h-14 font-bold gap-3 shadow-xl shadow-primary/20" 
                onClick={handleSimulate}
                disabled={isProcessing}
              >
                {isProcessing ? <Loader2 className="animate-spin" /> : <Zap className="size-5 fill-current" />}
                DISPARAR AUTOMAÇÃO DE INGESTÃO
              </Button>
            </CardContent>
          </Card>

          <div className="md:col-span-5 space-y-6">
            <Card className="border-2 border-dashed bg-white shadow-sm h-fit">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Database className="size-4 text-primary" /> Resultado do Processamento
                </CardTitle>
              </CardHeader>
              <CardContent>
                {result ? (
                  <div className="space-y-6 animate-in fade-in zoom-in duration-500">
                    <div className="space-y-3 p-4 rounded-2xl bg-slate-50 border">
                       <DataItem label="Instituição" value={result.extracted.institutionName} />
                       <DataItem label="CNPJ Identificado" value={result.extracted.cnpj} />
                       <DataItem label="Produto Técnico" value={result.extracted.productName} />
                       <DataItem label="Confiança IA" value={`${Math.round(result.extracted.confidence * 100)}%`} />
                       <div className="flex justify-between pt-2">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase">Prioridade</span>
                        <Badge variant={result.extracted.priority === 'high' ? 'destructive' : 'default'} className="text-[9px]">
                          {result.extracted.priority.toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-emerald-600 font-bold text-xs bg-emerald-50 p-3 rounded-xl border border-emerald-100">
                        <CheckCircle2 className="size-4" /> 
                        <span>Sucesso: Instância #{result.instanceId.substring(0,6)} criada.</span>
                      </div>
                      <Button variant="outline" className="w-full font-bold text-xs gap-2" asChild>
                        <Link href="/dashboard/admin/onboarding">
                          Ir para Fila do Suporte <ArrowRight className="size-3" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="py-24 text-center text-muted-foreground space-y-4">
                    <div className="size-16 rounded-full bg-slate-50 flex items-center justify-center mx-auto">
                      <Cog className="size-8 text-slate-200 animate-pulse" />
                    </div>
                    <p className="italic text-sm">O motor de IA está em standby...</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="p-5 rounded-2xl bg-blue-50 border border-blue-100 flex gap-4">
              <ShieldCheck className="size-6 text-blue-600 shrink-0" />
              <div className="space-y-1">
                <p className="text-xs font-bold text-blue-800 uppercase">Segurança & Auditoria</p>
                <p className="text-[10px] text-blue-700 leading-relaxed">
                  Cada processamento é registrado nos <strong>Logs do Sistema</strong>. O Suporte pode auditar a fonte (e-mail original) caso a extração precise de ajuste manual.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DataItem({ label, value }: { label: string, value: string }) {
  return (
    <div className="flex justify-between border-b border-slate-200/60 pb-2">
      <span className="text-[10px] font-bold text-muted-foreground uppercase">{label}</span>
      <span className="text-xs font-bold text-slate-700">{value}</span>
    </div>
  );
}
