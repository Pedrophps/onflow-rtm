
import { NextRequest, NextResponse } from 'next/server';
import { initializeFirebase } from '@/firebase';
import { processDirectIngestion } from '@/lib/automation-service';

/**
 * API OnFlow para Ingestão Estruturada de Ativações.
 * Aberta para Power Automate / ERP (Sem Autenticação de Aplicação).
 */
export async function POST(req: NextRequest) {
  try {
    const { firestore } = initializeFirebase();
    const data = await req.json();

    // Validação de campos obrigatórios
    const requiredFields = [
      'institutionName', 
      'cnpj',
      'consultantName', 
      'email', 
      'phoneNumber', 
      'orderValue', 
      'productName'
    ];

    for (const field of requiredFields) {
      if (!data[field]) {
        return NextResponse.json(
          { error: `O campo '${field}' é obrigatório para a ativação e resolução de identidade.` }, 
          { status: 400 }
        );
      }
    }

    // Processa a ingestão direta resolvendo identidade por E-mail ou CNPJ
    const result = await processDirectIngestion(firestore, {
      institutionName: data.institutionName,
      cnpj: data.cnpj,
      consultantName: data.consultantName,
      email: data.email,
      phoneNumber: data.phoneNumber,
      orderValue: data.orderValue,
      commercialNotes: data.commercialNotes || "",
      productName: data.productName
    });

    return NextResponse.json({
      status: 'success',
      message: result.resolvedType === 'reused' 
        ? 'Ativação vinculada ao cliente existente.' 
        : 'Novo cliente cadastrado e ativação criada.',
      instanceId: result.instanceId,
      clientId: result.clientId,
      resolvedType: result.resolvedType
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
      cnpj: "00.000.000/0000-00",
      consultantName: "Nome do Consultor RTM",
      email: "contato@cliente.com.br",
      phoneNumber: "(11) 99999-9999",
      orderValue: "OV-2024-X",
      productName: "MENSAGERIA SWIFT",
      commercialNotes: "Notas adicionais aqui"
    }
  });
}
