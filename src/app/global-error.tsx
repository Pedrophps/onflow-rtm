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
    <html>
      <head>
        <title>Erro de Sistema - OnFlow RTM</title>
      </head>
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
          <div style={{ 
            width: '64px', 
            height: '64px', 
            backgroundColor: 'rgba(211, 47, 47, 0.1)', 
            color: '#D32F2F', 
            borderRadius: '50%', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            margin: '0 auto 24px'
          }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          </div>
          <h1 style={{ fontSize: '24px', color: '#1A202C', margin: '0 0 12px' }}>Falha de Integridade</h1>
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
