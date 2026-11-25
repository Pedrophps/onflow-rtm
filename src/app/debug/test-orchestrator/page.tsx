
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
  ClipboardList
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

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 p-8 font-mono">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Link href="/" className="text-xs text-slate-500 hover:text-primary flex items-center gap-1">
              <ArrowLeft className="size-3" /> VOLTAR AO INÍCIO
            </Link>
            <h1 className="text-3xl font-bold flex items-center gap-3 text-white">
              <Beaker className="size-8 text-primary" /> Test Orchestrator <span className="text-slate-700 text-sm font-normal">v1.0.0</span>
            </h1>
            <p className="text-slate-400 text-sm">Validação automatizada de regras de negócio e infraestrutura Firebase.</p>
          </div>
          <Button 
            onClick={runAllTests} 
            disabled={isRunning}
            className="bg-primary hover:bg-primary/90 text-white font-black px-8 h-14 rounded-2xl gap-3 shadow-2xl transition-all hover:scale-105 active:scale-95"
          >
            {isRunning ? <Loader2 className="animate-spin" /> : <Play className="size-5 fill-current" />}
            DISPARAR SUÍTE DE TESTES
          </Button>
        </div>

        <div className="grid md:grid-cols-12 gap-8">
          {/* Lista de Testes */}
          <div className="md:col-span-5 space-y-4">
            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-4">Pipeline de Execução</h2>
            {results.length === 0 && !isRunning && (
              <div className="p-12 text-center border-2 border-dashed border-slate-800 rounded-3xl opacity-50">
                 <ClipboardList className="size-8 mx-auto mb-4 text-slate-700" />
                 <p className="text-xs">Aguardando comando do orquestrador...</p>
              </div>
            )}
            
            <div className="space-y-3">
              {results.map((test) => (
                <Card 
                  key={test.id} 
                  className={cn(
                    "bg-slate-900/50 border-slate-800 cursor-pointer hover:border-primary/50 transition-all overflow-hidden",
                    selectedTest === test.id && "border-primary bg-primary/5"
                  )}
                  onClick={() => setSelectedTest(test.id)}
                >
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "size-10 rounded-xl flex items-center justify-center",
                        test.status === 'success' ? "bg-emerald-500/10 text-emerald-400" : 
                        test.status === 'failed' ? "bg-red-500/10 text-red-400" : "bg-slate-800 text-slate-500"
                      )}>
                        {test.status === 'success' ? <CheckCircle2 className="size-5" /> : 
                         test.status === 'failed' ? <XCircle className="size-5" /> : <Loader2 className="size-5 animate-spin" />}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-200">{test.name}</p>
                        <p className="text-[9px] text-slate-500 uppercase font-black">{test.status}</p>
                      </div>
                    </div>
                    <ChevronRight className={cn("size-4 text-slate-700", selectedTest === test.id && "text-primary")} />
                  </CardContent>
                </Card>
              ))}
              {isRunning && results.length === 0 && (
                <div className="space-y-4">
                   {[1,2,3,4,5].map(i => (
                     <div key={i} className="h-16 bg-slate-900/20 border border-slate-800/50 rounded-2xl animate-pulse" />
                   ))}
                </div>
              )}
            </div>
          </div>

          {/* Console de Saída */}
          <div className="md:col-span-7 flex flex-col gap-6">
            <Card className="bg-slate-950 border-slate-800 shadow-2xl flex-1 overflow-hidden flex flex-col border-2">
              <CardHeader className="bg-slate-900/50 border-b border-slate-800 flex flex-row items-center justify-between p-4">
                <div className="flex items-center gap-2">
                  <Terminal className="size-4 text-emerald-500" />
                  <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-300">Live Test Logs</CardTitle>
                </div>
                {selectedResult && (
                  <Badge variant="outline" className="text-[9px] uppercase border-slate-700 text-slate-400">
                    ID: {selectedResult.id}
                  </Badge>
                )}
              </CardHeader>
              <CardContent className="p-0 flex-1 flex flex-col">
                <div className="flex-1 overflow-y-auto p-6 font-mono text-[11px] leading-relaxed space-y-1">
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
                          <p className="font-bold mb-1">STDOUT_ERROR:</p>
                          <p>{selectedResult.error}</p>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-slate-600 italic space-y-3 opacity-30">
                      <Terminal className="size-12" />
                      <p>Selecione um teste para visualizar a saída detalhada.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="p-6 bg-slate-900/40 border border-slate-800 rounded-3xl flex gap-4 items-start">
               <ShieldCheck className="size-6 text-primary shrink-0" />
               <div className="space-y-1">
                 <p className="text-xs font-bold text-slate-200">Protocolo de Segurança Ativo</p>
                 <p className="text-[10px] text-slate-500 leading-relaxed">
                   Todos os testes utilizam usuários efêmeros com prefixo <code className="bg-slate-800 px-1 rounded text-primary">test-*</code>. 
                   O sistema de limpeza automática remove os registros do Auth e Firestore imediatamente após a validação do cenário.
                 </p>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
