
import { NextRequest, NextResponse } from 'next/server';
import { initializeFirebase } from '@/firebase';
import { collection, getDocs, limit, query } from 'firebase/firestore';

/**
 * API de Health Check e Monitoramento
 * Permite que sistemas externos verifiquem a saúde do OnFlow RTM.
 */
export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    
    // Validação de segurança consistente com o padrão do projeto
    if (!authHeader || authHeader !== 'Bearer RTM-TEST-TOKEN-2024') {
      return NextResponse.json(
        { error: 'Não autorizado. Token inválido.' }, 
        { status: 401 }
      );
    }

    const { firestore } = initializeFirebase();
    
    // Teste de conectividade com o Firestore
    const start = Date.now();
    const productsSnap = await getDocs(query(collection(firestore, "products"), limit(1)));
    const latency = Date.now() - start;

    // Coleta de metadados simples
    return NextResponse.json({
      status: 'operational',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      database: {
        connected: true,
        latency: `${latency}ms`
      },
      environment: process.env.NODE_ENV,
      services: {
        ai_engine: 'openrouter/owl-alpha',
        auth: 'firebase-auth'
      }
    });

  } catch (error: any) {
    console.error('HEALTH_CHECK_ERROR:', error);
    return NextResponse.json({ 
      status: 'degraded', 
      message: error.message || 'Falha na verificação de saúde.' 
    }, { status: 500 });
  }
}
