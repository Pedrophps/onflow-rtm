
'use server';
/**
 * @fileOverview Fluxo de IA para extração de dados de e-mails ERP via OpenRouter.
 * Utiliza o modelo NVIDIA Nemotron Reasoning para máxima precisão.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ParseERPEmailInputSchema = z.object({
  emailSubject: z.string(),
  emailBody: z.string(),
});
export type ParseERPEmailInput = z.infer<typeof ParseERPEmailInputSchema>;

const ParseERPEmailOutputSchema = z.object({
  institutionName: z.string(),
  cnpj: z.string(),
  productName: z.string(),
  confidence: z.number(),
  priority: z.enum(['high', 'medium', 'low']),
  summary: z.string(),
  requesterName: z.string(),
  requesterEmail: z.string(),
  hasAttachmentMention: z.boolean(),
  detectedKeywords: z.array(z.string()),
});
export type ParseERPEmailOutput = z.infer<typeof ParseERPEmailOutputSchema>;

export async function parseERPEmail(input: ParseERPEmailInput): Promise<ParseERPEmailOutput> {
  return parseERPEmailFlow(input);
}

const parseERPEmailFlow = ai.defineFlow(
  {
    name: 'parseERPEmailFlow',
    inputSchema: ParseERPEmailInputSchema,
    outputSchema: ParseERPEmailOutputSchema,
  },
  async (input) => {
    const response = await ai.generate({
      model: 'openai/nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free',
      prompt: `Você é um analista sênior da RTM especializado em triagem técnica.
Extraia dados estruturados deste e-mail de ERP.

ASSUNTO: ${input.emailSubject}
CORPO: ${input.emailBody}

INSTRUÇÕES RÍGIDAS:
1. Retorne os dados estritamente conforme o esquema de saída solicitado.
2. NÃO inclua markdown, comentários, explicações ou texto adicional.
3. Retorne APENAS o JSON compatível com o schema.`,
    });

    const text = response.text;
    try {
      // Limpeza robusta para garantir JSON puro mesmo com modelos de reasoning que as vezes taggeiam a saída
      const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
      return JSON.parse(cleanJson);
    } catch (e) {
      console.error('Falha ao parsear JSON da IA (OpenRouter):', text);
      throw new Error('A IA não retornou um formato JSON válido. Resposta: ' + text);
    }
  }
);
