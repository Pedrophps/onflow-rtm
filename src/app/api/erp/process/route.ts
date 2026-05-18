
import { NextRequest, NextResponse } from 'next/server';
import { initializeFirebase } from '@/firebase';
import { processAutomationFromEmail } from '@/lib/automation-service';

/**
 * API para integração via Postman.
 * Requer Header: Authorization: Bearer RTM-TEST-TOKEN-2024
 */
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    
    // Validação do Token de Teste solicitado
    if (!authHeader || authHeader !== 'Bearer RTM-TEST-TOKEN-2024') {
      return NextResponse.json(
        { error: 'Não autorizado. Token RTM-TEST-TOKEN-2024 inválido ou ausente.' }, 
        { status: 401 }
      );
    }

    const { firestore } = initializeFirebase();
    const data = await req.json();

    if (!data.subject || !data.body) {
      return NextResponse.json(
        { error: 'Campos "subject" e "body" são obrigatórios no JSON.' }, 
        { status: 400 }
      );
    }

    // Dispara o serviço de automação que usa o OpenRouter (NVIDIA Reasoning)
    const result = await processAutomationFromEmail(firestore, data.subject, data.body);

    return NextResponse.json({
      status: 'success',
      message: 'IA (OpenRouter/NVIDIA) processou os dados e criou a instância.',
      instanceId: result.instanceId,
      extracted: result.extracted
    });
  } catch (error: any) {
    console.error('Erro na API OnFlow:', error);
    return NextResponse.json({ 
      status: 'error', 
      message: error.message || 'Erro interno ao processar requisição.' 
    }, { status: 500 });
  }
}
