
import { NextRequest, NextResponse } from 'next/server';
import { initializeFirebase } from '@/firebase';
import { processAutomationFromEmail } from '@/lib/automation-service';

/**
 * Endpoint de Webhook para integração com ERP ou Inbound Email services.
 * Espera um JSON contendo { subject, body }.
 */
export async function POST(req: NextRequest) {
  try {
    const { firestore } = initializeFirebase();
    const data = await req.json();

    if (!data.subject || !data.body) {
      return NextResponse.json({ error: 'Assunto e corpo do e-mail são obrigatórios.' }, { status: 400 });
    }

    const result = await processAutomationFromEmail(firestore, data.subject, data.body);

    return NextResponse.json({
      status: 'success',
      message: 'E-mail processado e ativação criada.',
      instanceId: result.instanceId,
      extracted: result.extracted
    });
  } catch (error: any) {
    console.error('Erro no Webhook de E-mail:', error);
    return NextResponse.json({ 
      status: 'error', 
      message: error.message || 'Falha interna ao processar automação.' 
    }, { status: 500 });
  }
}
