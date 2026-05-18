'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { parseERPEmail, type ParseERPEmailOutput } from '@/ai/flows/parse-erp-email-flow';
import { useFirestore, useUser } from '@/firebase';
import { collection, query, where, getDocs, addDoc, setDoc, doc, serverTimestamp } from 'firebase/firestore';
import { Loader2, Mail, Zap, CheckCircle2, AlertTriangle, ArrowRight, Database } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

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
  const [extractedData, setExtractedData] = useState<ParseERPEmailOutput | null>(null);

  const handleSimulate = async () => {
    if (!user) return;
    setIsProcessing(true);
    setExtractedData(null);

    try {
      // 1. IA extrai os dados do e-mail
      const result = await parseERPEmail({ emailSubject: subject, emailBody: body });
      setExtractedData(result);

      // 2. Busca ou Cria o Usuário/Instituição
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("cnpj", "==", result.cnpj));
      const querySnapshot = await getDocs(q);
      
      let clientId = "";
      if (querySnapshot.empty) {
        // Cria usuário pendente se não existir
        const newClientRef = doc(collection(db, "users"));
        clientId = newClientRef.id;
        await setDoc(newClientRef, {
          institutionName: result.institutionName,
          displayName: "Responsável Alpha",
          email: `contato@${result.cnpj}.com.br`,
          cnpj: result.cnpj,
          role: "client",
          status: "pending",
          createdAt: new Date().toISOString()
        });
      } else {
        clientId = querySnapshot.docs[0].id;
      }

      // 3. Cria a Instância de Onboarding
      const instancesRef = collection(db, "onboardingInstances");
      await addDoc(instancesRef, {
        clientId: clientId,
        institutionName: result.institutionName,
        productId: result.productName,
        productName: result.productName,
        status: 'pending',
        currentStepOrder: 1,
        startedAt: new Date().toISOString(),
        updatedAt: serverTimestamp(),
        origin: 'erp_email',
        priority: result.priority
      });

      // 4. Log do Sistema
      await addDoc(collection(db, "system_logs"), {
        message: `Nova ativação automática via ERP: ${result.institutionName}`,
        type: 'success',
        timestamp: new Date().toISOString(),
        userId: 'system-agent',
        context: 'erp-automation'
      });

      toast({
        title: "Integração Concluída",
        description: "A IA processou o e-mail e criou a instância de ativação.",
      });
    } catch (error: any) {
      console.error(error);
      toast({ variant: "destructive", title: "Erro na Automação", description: error.message });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8 font-body">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold font-headline text-slate-900 flex items-center gap-3">
              <Mail className="size-8 text-primary" /> Simulador de Entrada ERP
            </h1>
            <p className="text-muted-foreground">Teste como a IA transforma um e-mail desestruturado em um processo OnFlow.</p>
          </div>
          <Button variant="ghost" asChild><Link href="/debug/suite">Voltar</Link></Button>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <Card className="shadow-lg border-none">
            <CardHeader className="bg-slate-900 text-white rounded-t-xl">
              <CardTitle className="text-sm uppercase tracking-widest flex items-center gap-2">
                <Mail className="size-4" /> Conteúdo do E-mail
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-2">
                <Label>Assunto</Label>
                <Input value={subject} onChange={e => setSubject(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Corpo do E-mail</Label>
                <Textarea 
                  className="min-h-[300px] font-mono text-xs" 
                  value={body} 
                  onChange={e => setBody(e.target.value)} 
                />
              </div>
              <Button 
                className="w-full h-12 font-bold gap-2" 
                onClick={handleSimulate}
                disabled={isProcessing}
              >
                {isProcessing ? <Loader2 className="animate-spin" /> : <Zap className="size-4 fill-current" />}
                Processar e Criar Ativação
              </Button>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="border-2 border-dashed bg-white">
              <CardHeader>
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Database className="size-4 text-primary" /> Resultado da Extração (IA)
                </CardTitle>
              </CardHeader>
              <CardContent>
                {extractedData ? (
                  <div className="space-y-4 animate-in fade-in zoom-in">
                    <div className="p-4 rounded-xl bg-slate-50 space-y-3">
                      <div className="flex justify-between border-b pb-2">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase">Instituição</span>
                        <span className="text-sm font-bold">{extractedData.institutionName}</span>
                      </div>
                      <div className="flex justify-between border-b pb-2">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase">CNPJ</span>
                        <span className="text-sm font-mono font-bold text-primary">{extractedData.cnpj}</span>
                      </div>
                      <div className="flex justify-between border-b pb-2">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase">Produto</span>
                        <span className="text-sm font-bold">{extractedData.productName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase">Prioridade</span>
                        <span className={cn(
                          "text-[10px] font-black uppercase px-2 py-0.5 rounded",
                          extractedData.priority === 'high' ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"
                        )}>{extractedData.priority}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-emerald-600 font-bold text-xs">
                      <CheckCircle2 className="size-4" /> Instância criada com sucesso no Firestore
                    </div>
                  </div>
                ) : (
                  <div className="py-20 text-center text-muted-foreground italic text-sm">
                    Aguardando processamento...
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="p-6 rounded-2xl bg-primary/5 border border-primary/10 flex gap-4">
              <AlertTriangle className="size-6 text-primary shrink-0" />
              <div className="space-y-1">
                <p className="text-xs font-bold text-primary uppercase">Nota de Integração</p>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Em produção, este processo seria disparado por um <strong>Webhook Inbound</strong>. A IA garante que mesmo que o ERP mude o formato do e-mail, os dados continuem sendo extraídos corretamente.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
