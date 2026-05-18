'use client';

import { Button } from "@/components/ui/button";

/**
 * @fileOverview Handler de erro global para Next.js 15.
 * Obrigatório para capturar falhas no Root Layout.
 */

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body className="bg-slate-50 flex items-center justify-center min-h-screen font-sans">
        <div className="text-center space-y-4 p-6">
          <h1 className="text-2xl font-bold text-slate-900">Erro de Carregamento</h1>
          <p className="text-slate-600">A plataforma OnFlow encontrou uma dificuldade técnica temporária.</p>
          <Button onClick={() => reset()} className="rounded-full font-bold">
            Tentar Novamente
          </Button>
        </div>
      </body>
    </html>
  );
}
