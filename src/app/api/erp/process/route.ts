import { NextRequest, NextResponse } from 'next/server';
import { initializeFirebase } from '@/firebase';
import { processDirectIngestion } from '@/lib/automation-service';

/**
 * API OnFlow para Ingestão Estruturada de Ativações.
 * Aberta para Power Automate / ERP (Sem Autenticação de Aplicação).
 * Nota: Em ambientes de Workstation, requer autenticação do Proxy do Google.
 */
export async function POST(req: NextRequest) {
  try {
    const { firestore } = initializeFirebase();
    const data = await req.json();

    // Validação de campos obrigatórios conforme solicitado
    const requiredFields = [
      'institutionName', 
      'consultantName', 
      'email', 
      'phoneNumber', 
      'orderValue', 
      'productName'
    ];

    for (const field of requiredFields) {
      if (!data[field]) {
        return NextResponse.json(
          { error: `O campo '${field}' é obrigatório para a ativação.` }, 
          { status: 400 }
        );
      }
    }

    // Processa a ingestão direta criando Usuário + Instância
    const result = await processDirectIngestion(firestore, {
      institutionName: data.institutionName,
      cnpj: data.cnpj || "00.000.000/0001-91",
      consultantName: data.consultantName,
      email: data.email,
      phoneNumber: data.phoneNumber,
      orderValue: data.orderValue,
      commercialNotes: data.commercialNotes || "",
      productName: data.productName
    });

    return NextResponse.json({
      status: 'success',
      message: 'Ativação registrada com sucesso. O cliente já aparece na fila do Suporte.',
      instanceId: result.instanceId,
      clientId: result.clientId
    });

  } catch (error: any) {
    console.error('API_INGESTION_ERROR:', error);
    return NextResponse.json({ 
      status: 'error', 
      message: error.message || 'Falha no processamento da API.' 
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'online',
    description: 'API OnFlow - Ingestão Direta (Ativa)',
    endpoint: '/api/erp/process',
    method: 'POST',
    payload_example: {
      institutionName: "Nome da Instituição",
      consultantName: "Nome do Consultor RTM",
      email: "contato@cliente.com.br",
      phoneNumber: "(11) 99999-9999",
      orderValue: "OV-2024-X",
      productName: "MENSAGERIA SWIFT",
      commercialNotes: "Notas adicionais aqui",
      cnpj: "00.000.000/0000-00"
    },
    workstation_note: 'Se receber 401 no Postman, utilize o simulador interno em /debug/erp-simulator devido à proteção do Google Cloud.'
  });
}
