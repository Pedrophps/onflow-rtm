import { NextRequest, NextResponse } from 'next/server';
import { initializeFirebase } from '@/firebase';
import { processAutomationFromEmail } from '@/lib/automation-service';

/**
 * API simplificada para integração com Power Automate / ERP.
 * Recebe dados estruturados ou conteúdo de e-mail para automação.
 */
export async function POST(req: NextRequest) {
  try {
    const { firestore } = initializeFirebase();
    const data = await req.json();

    // Validação de entrada: Requer ou (subject+body) ou (institutionName+cnpj)
    const hasEmailData = data.subject && data.body;
    const hasDirectData = data.institutionName && data.cnpj;

    if (!hasEmailData && !hasDirectData) {
      return NextResponse.json(
        { error: 'Payload incompleto. Envie (subject e body) para processamento IA ou (institutionName e cnpj) para dados diretos.' }, 
        { status: 400 }
      );
    }

    // Chama o serviço passando os dados disponíveis
    const result = await processAutomationFromEmail(
      firestore, 
      data.subject, 
      data.body,
      {
        institutionName: data.institutionName,
        cnpj: data.cnpj,
        productName: data.productName,
        priority: data.priority
      }
    );

    return NextResponse.json({
      status: 'success',
      message: 'Instância de ativação criada com sucesso na fila do suporte.',
      instanceId: result.instanceId,
      extracted: result.extracted
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
    description: 'API OnFlow para Ingestão de Ativações',
    endpoint: '/api/erp/process',
    auth: 'None Required',
    methods: ['POST'],
    payload_options: {
      ia_mode: { subject: "string", body: "string" },
      direct_mode: { institutionName: "string", cnpj: "string", productName: "string", priority: "low|medium|high" }
    }
  });
}
