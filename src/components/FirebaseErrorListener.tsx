
'use client';

import { useEffect } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import { useToast } from '@/hooks/use-toast';

export function FirebaseErrorListener() {
  const { toast } = useToast();

  useEffect(() => {
    errorEmitter.on('permission-error', (error) => {
      toast({
        variant: "destructive",
        title: "Erro de Permissão",
        description: `Você não tem permissão para realizar esta operação: ${error.context.operation} em ${error.context.path}`,
      });
    });
  }, [toast]);

  return null;
}
