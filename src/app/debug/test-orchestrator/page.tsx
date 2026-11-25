
'use client';

import { useState } from 'react';
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
  Zap
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
    const tester = new RegistrationTester();
    try {
      const finalResults = await tester.runSuite();
      setResults(finalResults);
    } catch (error) {
      console.error("Erro na execução da suíte:", error);
    } finally {
      setIsRunning(false);
    }
  };

  const selectedResult = results.find(r => r.id === selectedTest);

  const stats = {
    total: results.length,
    success: results.filter(r => r.status === 'success').length,
    failed: results.filter(r => r.status === 'failed').length
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
              <Beaker className="size-8 text-primary" /> OnFlow Tester <span className="text-slate-700 text-sm font-normal">v2.0.0</span>
            </h1>
            <p className="text-slate-400 text-sm">Orquestrador de validação de Fluxos de Cadastro e Resolução de Identidade.</p>
          </div>
          <Button 
            onClick={runAllTests} 
            disabled={isRunning}
            className="bg-primary hover:bg-primary/90 text-white font-black px-8 h-14 rounded-2xl gap-3 shadow-2xl transition-all hover:scale-105 active:scale-95"
          >
            {isRunning ? <Loader2 className="animate-spin" /> : <Play className="size-5 fill-current" />}
            EXECUTAR BATERIA COMPLETA
          </Button>
        </div>

        {results.length > 0 && (
          <div className="grid grid-cols-3 gap-4">
             <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800 text-center">
                <p className="text-[10px] text-slate-500 font-black uppercase mb-1">Testes Totais</p>
                <p className="text-2xl font-black">{stats.total}</p>
             </div>
             <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                <p className="text-[10px] text-emerald-500 font-black uppercase mb-1">Sucesso</p>
                <p className="text-2xl font-black text-emerald-400">{stats.success}</p>
             </div>
             <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-center">
                <p className="text-[10px] text-red-500 font-black uppercase mb-1">Falhas</p>
                <p className="text-2xl font-black text-red-400">{stats.failed}</p>
             </div>
          </div>
        )}

        <div className="grid md:grid-cols-12 gap-8">
          <div className="md:col-span-5 space-y-4">
            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-4">Pipeline de Execução</h2>
            
            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
              {results.map((test) => (
                <Card 
                  key={test.id} 
                  className={cn(
                    "bg-slate-900/30 border-slate-800 cursor-pointer hover:border-primary/50 transition-all overflow-hidden",
                    selectedTest === test.id && "border-primary bg-primary/5"
                  )}
                  onClick={() => setSelectedTest(test.id)}
                >
                  <CardContent className="p-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "size-8 rounded-lg flex items-center justify-center",
                        test.status === 'success' ? "bg-emerald-500/10 text-emerald-400" : 
                        test.status === 'failed' ? "bg-red-500/10 text-red-400" : "bg-slate-800 text-slate-500"
                      )}>
                        {test.status === 'success' ? <CheckCircle2 className="size-4" /> : 
                         test.status === 'failed' ? <XCircle className="size-4" /> : <Loader2 className="size-4 animate-spin" />}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-200">{test.name}</p>
                        <p className="text-[8px] text-slate-500 uppercase font-black">
                           {test.id.startsWith('t1') || test.id.startsWith('t6') ? 'Identidade' : 'Cadastro'}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className={cn("size-3 text-slate-700", selectedTest === test.id && "text-primary")} />
                  </CardContent>
                </Card>
              ))}
              {isRunning && results.length === 0 && (
                <div className="space-y-4">
                   {[1,2,3,4,5,6].map(i => (
                     <div key={i} className="h-14 bg-slate-900/20 border border-slate-800/50 rounded-xl animate-pulse" />
                   ))}
                </div>
              )}
            </div>
          </div>

          <div className="md:col-span-7 flex flex-col gap-6">
            <Card className="bg-slate-950 border-slate-800 shadow-2xl flex-1 overflow-hidden flex flex-col border-2 rounded-3xl">
              <CardHeader className="bg-slate-900/50 border-b border-slate-800 flex flex-row items-center justify-between p-4">
                <div className="flex items-center gap-2">
                  <Terminal className="size-4 text-emerald-500" />
                  <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-300">Live Execution Logs</CardTitle>
                </div>
                {selectedResult && (
                  <Badge variant="outline" className="text-[9px] uppercase border-slate-700 text-slate-400 font-mono">
                    REF: {selectedResult.id}
                  </Badge>
                )}
              </CardHeader>
              <CardContent className="p-0 flex-1 flex flex-col">
                <div className="flex-1 overflow-y-auto p-6 font-mono text-[10px] leading-relaxed space-y-1">
                  {selectedResult ? (
                    <>
                      {selectedResult.logs.map((log, i) => (
                        <div key={i} className="text-slate-300 flex gap-3 group">
                          <span className="text-slate-600 select-none opacity-30">{(i+1).toString().padStart(2, '0')}</span>
                          <span>{log}</span>
                        </div>
                      ))}
                      {selectedResult.error && (
                        <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400">
                          <p className="font-bold mb-1 flex items-center gap-2"><XCircle className="size-3" /> STDOUT_EXCEPTION:</p>
                          <p className="opacity-80">{selectedResult.error}</p>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-slate-600 italic space-y-3 opacity-30">
                      <Zap className="size-12" />
                      <p className="text-sm">Selecione um processo para depuração detalhada.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-5 bg-slate-900/40 border border-slate-800 rounded-3xl flex gap-3 items-start">
                 <ShieldCheck className="size-5 text-primary shrink-0" />
                 <div className="space-y-1">
                   <p className="text-[10px] font-bold text-slate-200 uppercase tracking-tighter">Security Sandbox</p>
                   <p className="text-[9px] text-slate-500 leading-tight">
                     Dados temporários são purgados via <code className="bg-slate-800 px-1 rounded">deleteDoc</code> após cada cenário.
                   </p>
                 </div>
              </div>
              <div className="p-5 bg-slate-900/40 border border-slate-800 rounded-3xl flex gap-3 items-start">
                 <Fingerprint className="size-5 text-emerald-500 shrink-0" />
                 <div className="space-y-1">
                   <p className="text-[10px] font-bold text-slate-200 uppercase tracking-tighter">Identity Resolver</p>
                   <p className="text-[9px] text-slate-500 leading-tight">
                     Validação do mecanismo de cascata: E-mail &gt; CNPJ &gt; Nome.
                   </p>
                 </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
