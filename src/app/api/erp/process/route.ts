import { NextRequest, NextResponse } from 'next/server';
import { initializeFirebase } from '@/firebase';
import { processAutomationFromEmail } from '@/lib/automation-service';

/**
 * API simplificada para integração com Power Automate / ERP.
 * Recebe o conteúdo extraído de e-mails para automação de onboarding.
 * Rota sem autenticação conforme solicitado pelo usuário.
 */
export async function POST(req: NextRequest) {
  try {
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
      message: 'Dados extraídos via IA e instância criada com sucesso.',
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
    auth: 'None Required',
    methods: ['POST']
  });
}
