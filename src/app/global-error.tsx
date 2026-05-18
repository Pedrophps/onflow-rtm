
'use client';

import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

/**
 * @fileOverview Handler de erro global exigido pelo Next.js 15 para capturar falhas no root layout.
 */

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="pt-BR">
      <body className="font-sans antialiased bg-slate-50">
        <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center space-y-6">
          <div className="size-20 rounded-full bg-red-100 flex items-center justify-center text-red-600">
            <AlertTriangle className="size-10" />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-slate-900">Erro Crítico do Sistema</h1>
            <p className="text-slate-600 max-w-md mx-auto">
              Ocorreu uma falha inesperada na renderização da plataforma OnFlow RTM. 
              {error.message && <code className="block mt-2 p-2 bg-slate-200 rounded text-xs">{error.message}</code>}
            </p>
          </div>
          <Button onClick={() => reset()} className="px-8 font-bold rounded-full">
            Reiniciar Ambiente
          </Button>
        </div>
      </body>
    </html>
  );
}
