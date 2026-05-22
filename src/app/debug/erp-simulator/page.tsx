
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Zap, CheckCircle2, ArrowRight, Cog, Globe, ShieldCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

export default function ERPSimulatorPage() {
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    institutionName: 'BANCO INVESTIMENTOS DELTA S.A.',
    cnpj: '22.333.444/0001-55',
    consultantName: 'RICARDO OLIVEIRA (RTM)',
    email: 'onboarding@bancodelta.com.br',
    phoneNumber: '(11) 98888-7777',
    orderValue: 'OV-2024-998',
    productName: 'MENSAGERIA SWIFT',
    commercialNotes: 'Cliente prioritário vindo da migração de plataforma.'
  });

  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleSimulate = async () => {
    setIsProcessing(true);
    setResult(null);

    try {
      const response = await fetch('/api/erp/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      
      if (!response.ok) throw new Error(data.error || 'Falha na API');

      setResult(data);
      toast({
        title: "Processamento Concluído",
        description: data.resolvedType === 'reused' 
          ? "Identidade resolvida: Ativação vinculada a usuário existente."
          : "Novo cliente cadastrado com sucesso.",
      });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erro na API", description: error.message });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8 font-body">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold font-headline text-slate-900 flex items-center gap-3">
              <Cog className="size-8 text-primary" /> Simulador de Ingestão ERP
            </h1>
            <p className="text-muted-foreground text-sm">Teste a resolução de identidade (CNPJ/E-mail) via API.</p>
          </div>
          <Button variant="ghost" asChild><Link href="/">Voltar ao Início</Link></Button>
        </div>

        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex gap-4 items-start">
          <ShieldCheck className="size-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-sm font-bold text-emerald-900">Resolução de Identidade Ativa</p>
            <p className="text-xs text-emerald-800 leading-relaxed">
              O campo <strong>CNPJ</strong> e <strong>E-mail</strong> são usados para identificar se o cliente já existe. 
              Se você enviar os mesmos dados duas vezes, verá que o sistema vincula uma nova ativação ao mesmo ID de cliente.
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-12 gap-8">
          <Card className="md:col-span-7 shadow-lg border-none overflow-hidden">
            <CardHeader className="bg-slate-900 text-white p-6">
              <CardTitle className="text-sm uppercase tracking-widest flex items-center gap-2">
                <Globe className="size-4" /> Formulário de Envio (POST)
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4 bg-white">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 col-span-2">
                  <Label className="text-xs font-bold uppercase">Instituição</Label>
                  <Input value={formData.institutionName} onChange={e => setFormData({...formData, institutionName: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase text-primary">CNPJ (Chave de Identidade) *</Label>
                  <Input value={formData.cnpj} onChange={e => setFormData({...formData, cnpj: e.target.value})} className="font-bold border-primary/20" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase text-primary">E-mail (Chave de Identidade) *</Label>
                  <Input value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="font-bold border-primary/20" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase">Consultor RTM</Label>
                  <Input value={formData.consultantName} onChange={e => setFormData({...formData, consultantName: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase">OV (Ordem de Venda) *</Label>
                  <Input value={formData.orderValue} onChange={e => setFormData({...formData, orderValue: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase">Telefone</Label>
                  <Input value={formData.phoneNumber} onChange={e => setFormData({...formData, phoneNumber: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase">Produto</Label>
                  <Input value={formData.productName} onChange={e => setFormData({...formData, productName: e.target.value})} />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase">Observações Importantes</Label>
                <Textarea value={formData.commercialNotes} onChange={e => setFormData({...formData, commercialNotes: e.target.value})} />
              </div>
              <Button 
                className="w-full h-14 font-bold gap-3 shadow-lg shadow-primary/10" 
                onClick={handleSimulate}
                disabled={isProcessing}
              >
                {isProcessing ? <Loader2 className="animate-spin" /> : <Zap className="size-5 fill-current" />}
                DISPARAR CHAMADA DE API
              </Button>
            </CardContent>
          </Card>

          <div className="md:col-span-5 space-y-6">
            <Card className="border-2 border-dashed bg-white shadow-sm h-full">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold">Resposta da API</CardTitle>
              </CardHeader>
              <CardContent>
                {result ? (
                  <div className="space-y-6 animate-in fade-in zoom-in duration-500">
                    <div className="flex flex-col gap-2 p-4 rounded-xl border bg-slate-50">
                      <div className="flex items-center gap-2 text-emerald-600 font-bold text-xs uppercase">
                        <CheckCircle2 className="size-4" /> 
                        <span>Processamento OK</span>
                      </div>
                      <p className="text-[10px] font-bold text-muted-foreground">
                        TIPO: {result.resolvedType === 'reused' ? 'REUTILIZAÇÃO DE CLIENTE' : 'NOVO CADASTRO'}
                      </p>
                    </div>
                    <pre className="p-4 bg-slate-900 text-emerald-400 rounded-xl text-[10px] overflow-x-auto">
                      {JSON.stringify(result, null, 2)}
                    </pre>
                    <Button variant="outline" className="w-full font-bold text-xs gap-2" asChild>
                      <Link href="/dashboard/admin/onboarding">
                        Ver Fila do Suporte <ArrowRight className="size-3" />
                      </Link>
                    </Button>
                  </div>
                ) : (
                  <div className="py-24 text-center text-muted-foreground space-y-4">
                    <p className="italic text-sm">Aguardando disparo do formulário para validar a resolução de identidade.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
