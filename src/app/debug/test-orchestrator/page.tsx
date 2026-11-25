
'use client';

import { useState, useMemo } from 'react';
import { RegistrationTester, TestResult } from '@/lib/tests/registration-tester';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Beaker, 
  Play, 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  ShieldCheck, 
  Terminal, 
  ArrowLeft,
  ChevronRight,
  ClipboardList,
  Fingerprint,
  Zap,
  Briefcase,
  Headset,
  Flag,
  FileWarning
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export default function TestOrchestratorPage() {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);
  const [selectedTest, setSelectedTest] = useState<string | null>(null);

  const runAllTests = async () => {
    setIsRunning(true);
    setResults([]);
    setSelectedTest(null);
    const tester = new RegistrationTester();
    try {
      const finalResults = await tester.runSuite();
      setResults(finalResults);
    } catch (error) {
      console.error("Erro fatal na execução da suíte:", error);
    } finally {
      setIsRunning(false);
    }
  };

  const selectedResult = results.find(r => r.id === selectedTest);

  const stats = useMemo(() => ({
    total: results.length,
    success: results.filter(r => r.status === 'success').length,
    failed: results.filter(r => r.status === 'failed').length
  }), [results]);

  const categories = {
    cadastro: { icon: ClipboardList, label: "Fluxos de Cadastro" },
    identidade: { icon: Fingerprint, label: "Resolução de Identidade" },
    comercial: { icon: Briefcase, label: "Gestão Comercial" },
    suporte: { icon: Headset, label: "Operações de Suporte" },
    conclusao: { icon: Flag, label: "Ciclo de Conclusão" },
    produtos: { icon: Zap, label: "Produtos & Templates" },
    seguranca: { icon: ShieldCheck, label: "Segurança (RBAC)" },
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 p-8 font-mono">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Link href="/" className="text-xs text-slate-500 hover:text-primary flex items-center gap-1">
              <ArrowLeft className="size-3" /> VOLTAR AO INÍCIO
            </Link>
            <h1 className="text-3xl font-bold flex items-center gap-3 text-white">
              <Beaker className="size-8 text-primary" /> OnFlow Operational QA <span className="text-slate-700 text-sm font-normal">v4.5.0</span>
            </h1>
            <p className="text-slate-400 text-sm">Orquestrador de validação de Missão Crítica para a Infraestrutura RTM.</p>
          </div>
          <Button 
            onClick={runAllTests} 
            disabled={isRunning}
            className="bg-primary hover:bg-primary/90 text-white font-black px-8 h-14 rounded-2xl gap-3 shadow-2xl transition-all"
          >
            {isRunning ? <Loader2 className="animate-spin" /> : <Play className="size-5 fill-current" />}
            DISPARAR BATERIA OPERACIONAL
          </Button>
        </div>

        {results.length > 0 && (
          <div className="grid grid-cols-3 gap-4 animate-in fade-in zoom-in duration-500">
             <div className="p-6 rounded-3xl bg-slate-900/50 border border-slate-800 text-center shadow-inner">
                <p className="text-[10px] text-slate-500 font-black uppercase mb-1 tracking-widest">Testes Totais</p>
                <p className="text-3xl font-black">{stats.total}</p>
             </div>
             <div className="p-6 rounded-3xl bg-emerald-500/5 border border-emerald-500/20 text-center">
                <p className="text-[10px] text-emerald-500 font-black uppercase mb-1 tracking-widest">Sucesso</p>
                <p className="text-3xl font-black text-emerald-400">{stats.success}</p>
             </div>
             <div className="p-6 rounded-3xl bg-red-500/5 border border-red-500/20 text-center">
                <p className="text-[10px] text-red-500 font-black uppercase mb-1 tracking-widest">Falhas</p>
                <p className="text-3xl font-black text-red-400">{stats.failed}</p>
             </div>
          </div>
        )}

        <div className="grid md:grid-cols-12 gap-8">
          <div className="md:col-span-5 space-y-6">
            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Pipeline de Execução</h2>
            
            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
              {Object.entries(categories).map(([key, config]) => {
                const catTests = results.filter(r => r.category === key);
                if (catTests.length === 0 && results.length > 0) return null;

                return (
                  <div key={key} className="space-y-2">
                    <div className="flex items-center gap-2 px-2">
                      <config.icon className="size-3 text-slate-500" />
                      <span className="text-[9px] font-black uppercase text-slate-500 tracking-tighter">{config.label}</span>
                    </div>
                    {catTests.map((test) => (
                      <Card 
                        key={test.id} 
                        className={cn(
                          "bg-slate-900/30 border-slate-800 cursor-pointer hover:border-primary/50 transition-all group",
                          selectedTest === test.id && "border-primary bg-primary/10 ring-1 ring-primary/20"
                        )}
                        onClick={() => setSelectedTest(test.id)}
                      >
                        <CardContent className="p-3 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "size-8 rounded-xl flex items-center justify-center transition-colors",
                              test.status === 'success' ? "bg-emerald-500/10 text-emerald-400" : 
                              test.status === 'failed' ? "bg-red-500/10 text-red-400" : "bg-slate-800 text-slate-600"
                            )}>
                              {test.status === 'success' ? <CheckCircle2 className="size-4" /> : 
                               test.status === 'failed' ? <XCircle className="size-4" /> : <Loader2 className="size-4 animate-spin" />}
                            </div>
                            <p className="text-xs font-bold text-slate-300 group-hover:text-white">{test.name}</p>
                          </div>
                          <ChevronRight className={cn("size-3 text-slate-700", selectedTest === test.id && "text-primary")} />
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                );
              })}

              {isRunning && results.length === 0 && (
                <div className="space-y-3">
                   {[1,2,3,4,5,6].map(i => (
                     <div key={i} className="h-14 bg-slate-900/20 border border-slate-800/50 rounded-2xl animate-pulse" />
                   ))}
                </div>
              )}
            </div>
          </div>

          <div className="md:col-span-7 flex flex-col gap-6">
            <Card className="bg-slate-950 border-slate-800 shadow-2xl flex-1 overflow-hidden flex flex-col border-2 rounded-[2rem]">
              <CardHeader className="bg-slate-900/50 border-b border-slate-800 flex flex-row items-center justify-between p-5">
                <div className="flex items-center gap-3">
                  <Terminal className="size-5 text-emerald-500" />
                  <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-400">System Runtime STDOUT</CardTitle>
                </div>
                {selectedResult && (
                  <Badge variant="outline" className="text-[9px] uppercase border-slate-700 text-primary font-mono px-3">
                    TX_ID: {selectedResult.id}
                  </Badge>
                )}
              </CardHeader>
              <CardContent className="p-0 flex-1 flex flex-col">
                <div className="flex-1 overflow-y-auto p-8 font-mono text-[11px] leading-relaxed space-y-1 scroll-smooth">
                  {selectedResult ? (
                    <>
                      {selectedResult.logs.map((log, i) => (
                        <div key={i} className="text-slate-300 flex gap-4 group hover:bg-white/5 py-0.5">
                          <span className="text-slate-700 select-none opacity-50 w-6">{(i+1).toString().padStart(2, '0')}</span>
                          <span>{log}</span>
                        </div>
                      ))}
                      {selectedResult.error && (
                        <div className="mt-6 p-5 bg-red-500/5 border border-red-500/20 rounded-2xl text-red-400 animate-in slide-in-from-top-2">
                          <p className="font-bold mb-2 flex items-center gap-2 text-xs uppercase tracking-widest">
                            <FileWarning className="size-4" /> Exception_Caught:
                          </p>
                          <p className="opacity-80 italic leading-relaxed">{selectedResult.error}</p>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center p-12 text-slate-600 italic space-y-6">
                      <Terminal className="size-16 opacity-5" />
                      <div className="space-y-2">
                        <p className="text-sm font-bold text-slate-500">Monitor de Execução OnFlow</p>
                        <p className="text-[10px] max-w-xs leading-relaxed uppercase tracking-tighter opacity-70">
                          Aguardando disparo da bateria de testes. A validação ocorre em tempo real contra o backend de produção.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="p-6 bg-primary/5 border border-primary/20 rounded-[2rem] flex gap-5 items-start">
               <ShieldCheck className="size-6 text-primary shrink-0 mt-1" />
               <div className="space-y-1">
                 <p className="text-xs font-black text-slate-200 uppercase tracking-widest">Governança Técnica RTM</p>
                 <p className="text-[10px] text-slate-400 leading-relaxed italic">
                   Os testes de concorrência e RBAC validam a resiliência do sistema sob estresse. Falhas identificadas aqui representam riscos críticos de conformidade (CVM/BC) e devem ser sanadas imediatamente.
                 </p>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
