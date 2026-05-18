
import { NextRequest, NextResponse } from 'next/server';
import { initializeFirebase } from '@/firebase';
import { processAutomationFromEmail } from '@/lib/automation-service';

/**
 * API Operacional para integração externa (Postman/ERP).
 * Exige Bearer Token para conformidade de segurança.
 */
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    
    // Validação de Token solicitada pelo usuário
    if (!authHeader || authHeader !== 'Bearer RTM-TEST-TOKEN-2024') {
      return NextResponse.json(
        { error: 'Não autorizado. Use Header "Authorization: Bearer RTM-TEST-TOKEN-2024".' }, 
        { status: 401 }
      );
    }

    const { firestore } = initializeFirebase();
    const data = await req.json();

    if (!data.subject || !data.body) {
      return NextResponse.json(
        { error: 'Payload inválido. Campos "subject" e "body" são obrigatórios.' }, 
        { status: 400 }
      );
    }

    // Execução do serviço de automação com IA Nemotron
    const result = await processAutomationFromEmail(firestore, data.subject, data.body);

    return NextResponse.json({
      status: 'success',
      message: 'Workflow RTM iniciado com sucesso via automação de IA.',
      instanceId: result.instanceId,
      extracted: result.extracted,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('CRITICAL_API_ERROR:', error);
    return NextResponse.json({ 
      status: 'error', 
      code: 'INTERNAL_SERVER_ERROR',
      message: error.message || 'Falha técnica no processamento da automação.' 
    }, { status: 500 });
  }
}

/**
 * Handler para GET para facilitar debug de endpoint.
 */
export async function GET() {
  return NextResponse.json({
    endpoint: '/api/erp/process',
    method: 'POST',
    auth: 'Bearer Token Required',
    status: 'Operational'
  });
}
