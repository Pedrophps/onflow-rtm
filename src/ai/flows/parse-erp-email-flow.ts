'use server';
/**
 * @fileOverview Fluxo de IA para parsing de e-mails de ativação vindos do ERP/Comercial.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ParseERPEmailInputSchema = z.object({
  emailSubject: z.string().describe('O assunto do e-mail recebido.'),
  emailBody: z.string().describe('O conteúdo principal do e-mail.'),
});
export type ParseERPEmailInput = z.infer<typeof ParseERPEmailInputSchema>;

const ParseERPEmailOutputSchema = z.object({
  institutionName: z.string().describe('Nome da instituição financeira identificada.'),
  cnpj: z.string().describe('CNPJ da instituição formatado.'),
  productName: z.string().describe('Nome do produto RTM solicitado para ativação.'),
  priority: z.enum(['low', 'medium', 'high']).describe('Nível de urgência detectado no texto.'),
  confidence: z.number().describe('Nível de confiança da IA na extração (0 a 1).'),
});
export type ParseERPEmailOutput = z.infer<typeof ParseERPEmailOutputSchema>;

export async function parseERPEmail(input: ParseERPEmailInput): Promise<ParseERPEmailOutput> {
  return parseERPEmailFlow(input);
}

const prompt = ai.definePrompt({
  name: 'parseERPEmailPrompt',
  input: { schema: ParseERPEmailInputSchema },
  output: { schema: ParseERPEmailOutputSchema },
  prompt: `Você é um analista de operações da RTM especializado em triagem de e-mails técnicos.

Analise o e-mail abaixo e extraia as informações necessárias para abrir um ticket de onboarding.

ASSUNTO: {{{emailSubject}}}
CORPO: {{{emailBody}}}

Instruções:
1. Identifique o CNPJ. Se não encontrar explicitamente, tente deduzir se houver um código de cliente.
2. Identifique qual produto RTM está sendo vendido (ex: SWIFT, RSFN, PIX, HUB FUNDOS).
3. Determine a prioridade: Palavras como "urgente", "imediato" ou prazos regulatórios indicam prioridade 'high'.
4. Se o nome da instituição não estiver claro, use o que parecer ser a Razão Social mais provável.`,
});

const parseERPEmailFlow = ai.defineFlow(
  {
    name: 'parseERPEmailFlow',
    inputSchema: ParseERPEmailInputSchema,
    outputSchema: ParseERPEmailOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    if (!output) throw new Error('Falha ao processar e-mail via IA.');
    return output;
  }
);
