import { NextRequest, NextResponse } from 'next/server';
import { initializeFirebase } from '@/firebase';
import { processAutomationFromEmail } from '@/lib/automation-service';

/**
 * API oficial para integração com Power Automate / ERP.
 * Recebe o conteúdo extraído de e-mails para automação de onboarding.
 */
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    
    // Segurança baseada em Token fixo para simplificar a integração com Power Automate
    if (!authHeader || authHeader !== 'Bearer RTM-TEST-TOKEN-2024') {
      return NextResponse.json(
        { error: 'Não autorizado. Use o token configurado no Power Automate.' }, 
        { status: 401 }
      );
    }

    const { firestore } = initializeFirebase();
    const data = await req.json();

    // Validação básica de entrada
    if (!data.subject || !data.body) {
      return NextResponse.json(
        { error: 'Payload incompleto. Requer "subject" e "body".' }, 
        { status: 400 }
      );
    }

    // Chama o serviço que orquestra IA + Firestore
    const result = await processAutomationFromEmail(firestore, data.subject, data.body);

    return NextResponse.json({
      status: 'success',
      message: 'Dados extraídos via IA e instância criada.',
      extracted: result.extracted,
      instanceId: result.instanceId
    });

  } catch (error: any) {
    console.error('API_INGESTION_ERROR:', error);
    return NextResponse.json({ 
      status: 'error', 
      message: error.message || 'Falha no processamento interno da API.' 
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    description: 'API OnFlow para Ingestão de E-mails via Power Automate',
    auth: 'Bearer Token Required',
    methods: ['POST']
  });
}
