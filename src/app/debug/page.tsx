
'use client';

import { useState, useEffect } from 'react';
import { useAuth, useFirestore } from '@/firebase';
import { collection, getDocs, limit, query } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Loader2, Terminal, CheckCircle2, XCircle, Wifi, RefreshCw } from 'lucide-react';
import Link from 'next/link';

interface LogEntry {
  timestamp: string;
  message: string;
  type: 'info' | 'success' | 'error' | 'warning';
}

export default function DebugPage() {
  const auth = useAuth();
  const db = useFirestore();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [status, setStatus] = useState<'idle' | 'running' | 'success' | 'error'>('idle');

  const addLog = (message: string, type: LogEntry['type'] = 'info') => {
    setLogs(prev => [...prev, {
      timestamp: new Date().toLocaleTimeString(),
      message,
      type
    }]);
  };

  const runDiagnostics = async () => {
    setIsRunning(true);
    setStatus('running');
    setLogs([]);
    addLog('Iniciando diagnóstico de conexão Firebase...');

    try {
      // Teste 1: SDK Initialization
      addLog('Verificando inicialização do SDK...');
      if (auth && db) {
        addLog('SDK inicializado com sucesso.', 'success');
      } else {
        throw new Error('SDK não inicializado corretamente.');
      }

      // Teste 2: Firebase Auth
      addLog('Testando conectividade com Firebase Auth...');
      const user = auth.currentUser;
      addLog(`Estado do usuário: ${user ? 'Autenticado as ' + user.email : 'Não autenticado'}`);
      addLog('Auth Service está respondendo.', 'success');

      // Teste 3: Firestore Read
      addLog('Tentando leitura no Firestore (Coleção: users)...');
      const usersQuery = query(collection(db, 'users'), limit(1));
      const snapshot = await getDocs(usersQuery);
      addLog(`Leitura concluída. Documentos encontrados: ${snapshot.size}`, 'success');

      // Teste 4: Network Status
      addLog(`Status da rede do navegador: ${navigator.onLine ? 'Online' : 'Offline'}`, navigator.onLine ? 'info' : 'warning');

      setStatus('success');
      addLog('Diagnóstico concluído com sucesso! A conexão está estável.', 'success');
    } catch (error: any) {
      console.error(error);
      setStatus('error');
      addLog(`FALHA NO DIAGNÓSTICO: ${error.message}`, 'error');
      if (error.code === 'unavailable' || error.message.includes('offline')) {
        addLog('DICA: O Firebase reportou que o cliente está offline. Isso pode ser instabilidade temporária ou bloqueio de rede.', 'warning');
      }
    } finally {
      setIsRunning(false);
    }
  };

  useEffect(() => {
    runDiagnostics();
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 p-6 flex flex-col items-center justify-center font-mono">
      <Card className="w-full max-w-2xl bg-slate-900 border-slate-800 text-slate-50">
        <CardHeader className="border-b border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Terminal className="size-5 text-primary" />
              <CardTitle>Firebase Diagnostics v1.0</CardTitle>
            </div>
            <Badge variant={status === 'success' ? 'default' : status === 'error' ? 'destructive' : 'outline'} className="uppercase">
              {status}
            </Badge>
          </div>
          <CardDescription className="text-slate-400">
            Monitor de conectividade em tempo real para o OnFlow RTM.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <ScrollArea className="h-[400px] w-full rounded-md border border-slate-800 bg-slate-950 p-4">
            <div className="space-y-2">
              {logs.map((log, i) => (
                <div key={i} className="text-sm flex gap-2">
                  <span className="text-slate-500 shrink-0">[{log.timestamp}]</span>
                  <span className={
                    log.type === 'success' ? 'text-emerald-400' :
                    log.type === 'error' ? 'text-red-400 font-bold' :
                    log.type === 'warning' ? 'text-amber-400' : 'text-slate-300'
                  }>
                    {log.type === 'success' && <CheckCircle2 className="inline size-3 mr-1 mb-0.5" />}
                    {log.type === 'error' && <XCircle className="inline size-3 mr-1 mb-0.5" />}
                    {log.message}
                  </span>
                </div>
              ))}
              {isRunning && (
                <div className="flex items-center gap-2 text-primary animate-pulse italic">
                  <Loader2 className="size-3 animate-spin" />
                  Processando...
                </div>
              )}
            </div>
          </ScrollArea>

          <div className="flex gap-4">
            <Button 
              className="flex-1 gap-2 font-bold" 
              onClick={runDiagnostics} 
              disabled={isRunning}
            >
              <RefreshCw className={isRunning ? "animate-spin size-4" : "size-4"} />
              Refazer Testes
            </Button>
            <Button variant="outline" className="flex-1 bg-transparent border-slate-700 hover:bg-slate-800 text-slate-50" asChild>
              <Link href="/login">Voltar ao Portal</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
      <p className="mt-4 text-xs text-slate-500 uppercase tracking-widest">
        Identificando para integrar. Entender para atender.
      </p>
    </div>
  );
}
