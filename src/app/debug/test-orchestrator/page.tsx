
'use client';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function TestOrchestratorCleanup() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/dashboard/admin');
  }, [router]);
  return <div className="p-20 text-center text-muted-foreground font-mono">Ambiente de Testes Desativado. Redirecionando...</div>;
}
