'use client';

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Critical Root Error:", error);
  }, [error]);

  return (
    <html>
      <body className="bg-slate-50 flex items-center justify-center min-h-screen font-sans antialiased">
        <div className="text-center space-y-6 p-8 max-w-md bg-white rounded-3xl shadow-xl border border-slate-100">
          <div className="size-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-slate-900">Falha de Integridade</h1>
            <p className="text-slate-500 text-sm">
              Ocorreu um erro crítico durante a renderização do portal OnFlow. Nossa equipe técnica já foi notificada.
            </p>
          </div>
          <Button 
            onClick={() => reset()} 
            className="w-full rounded-full font-bold h-12 shadow-lg shadow-primary/20"
          >
            Tentar Restaurar Sessão
          </Button>
        </div>
      </body>
    </html>
  );
}
