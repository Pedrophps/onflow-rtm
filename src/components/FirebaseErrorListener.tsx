
'use client';

import { useEffect } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import { useToast } from '@/hooks/use-toast';
import { ToastAction } from '@/components/ui/toast';
import { Copy, Check } from 'lucide-react';

export function FirebaseErrorListener() {
  const { toast } = useToast();

  useEffect(() => {
    errorEmitter.on('permission-error', (error) => {
      // Formata os detalhes do erro para cópia
      const errorDetails = JSON.stringify({
        message: error.message,
        operation: error.context.operation,
        path: error.context.path,
        requestData: error.context.requestResourceData,
        timestamp: new Date().toISOString()
      }, null, 2);

      const handleCopy = () => {
        navigator.clipboard.writeText(errorDetails).then(() => {
          toast({
            title: "Copiado!",
            description: "Os detalhes técnicos foram copiados para a área de transferência.",
          });
        });
      };

      toast({
        variant: "destructive",
        title: "Erro de Permissão",
        description: `Acesso negado ao tentar realizar '${error.context.operation}' em: ${error.context.path}`,
        duration: 10000, // Mantém o erro por mais tempo para dar tempo de copiar
        action: (
          <ToastAction 
            altText="Copiar erro" 
            onClick={handleCopy} 
            className="gap-2 bg-white/20 hover:bg-white/30 border-white/20 text-white font-bold"
          >
            <Copy className="size-4" />
            Copiar JSON
          </ToastAction>
        ),
      });
    });
  }, [toast]);

  return null;
}
