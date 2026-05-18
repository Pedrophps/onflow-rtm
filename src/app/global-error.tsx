'use client';

import { useEffect } from "react";

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
    <html lang="pt-BR">
      <body style={{ 
        backgroundColor: '#F5F5F5', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        minHeight: '100vh', 
        margin: 0,
        fontFamily: 'sans-serif'
      }}>
        <div style={{ 
          textAlign: 'center', 
          padding: '40px', 
          maxWidth: '400px', 
          backgroundColor: '#FFFFFF', 
          borderRadius: '24px', 
          boxShadow: '0 10px 25px rgba(0,0,0,0.05)',
          border: '1px solid #E2E8F0'
        }}>
          <h1 style={{ fontSize: '24px', color: '#1A202C', margin: '0 0 12px' }}>Falha de Sistema</h1>
          <p style={{ fontSize: '14px', color: '#718096', lineHeight: '1.6', margin: '0 0 32px' }}>
            Ocorreu um erro crítico no portal OnFlow. Nossa equipe técnica já foi notificada para análise.
          </p>
          <button 
            onClick={() => reset()} 
            style={{ 
              width: '100%', 
              padding: '12px 24px', 
              backgroundColor: '#D32F2F', 
              color: '#FFFFFF', 
              border: 'none', 
              borderRadius: '999px', 
              fontWeight: 'bold', 
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Restaurar Sessão
          </button>
        </div>
      </body>
    </html>
  );
}
