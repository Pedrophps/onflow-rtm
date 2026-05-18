'use server';
/**
 * @fileOverview Agente de Processamento de E-mails do ERP.
 * Transforma e-mails de solicitação de trabalho em instâncias de onboarding no OnFlow.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ParseERPEmailInputSchema = z.object({
  emailSubject: z.string().describe('O assunto do e-mail recebido.'),
  emailBody: z.string().describe('O conteúdo textual completo do e-mail.'),
});

const ParseERPEmailOutputSchema = z.object({
  institutionName: z.string().describe('Nome da instituição financeira identificada.'),
  cnpj: z.string().describe('CNPJ da instituição (apenas números).'),
  productName: z.string().describe('Nome do produto ou serviço solicitado.'),
  confidence: z.number().describe('Nível de confiança na extração (0-1).'),
  priority: z.enum(['high', 'medium', 'low']).describe('Prioridade sugerida baseada em palavras-chave no e-mail.'),
});

export type ParseERPEmailInput = z.infer<typeof ParseERPEmailInputSchema>;
export type ParseERPEmailOutput = z.infer<typeof ParseERPEmailOutputSchema>;

const prompt = ai.definePrompt({
  name: 'parseERPEmailPrompt',
  input: { schema: ParseERPEmailInputSchema },
  output: { schema: ParseERPEmailOutputSchema },
  prompt: `Você é um assistente de triagem técnica da RTM. Seu trabalho é ler e-mails automáticos enviados pelo nosso ERP e extrair dados para criar um novo processo de onboarding.

Analise o Assunto e o Corpo do e-mail abaixo:
Assunto: {{{emailSubject}}}
Corpo: {{{emailBody}}}

Instruções:
1. Extraia o nome da Instituição (Razão Social).
2. Extraia o CNPJ (limpe caracteres especiais, mantenha apenas números).
3. Identifique o Produto solicitado (ex: SWIFT, RSFN, PIX, etc).
4. Se o e-mail contiver termos como "URGENTE", "CRÍTICO" ou "IMEDIATO", defina prioridade como 'high'.

Se não encontrar algum dado, tente inferir pelo contexto ou deixe vazio se for impossível identificar.`,
});

export async function parseERPEmail(input: ParseERPEmailInput): Promise<ParseERPEmailOutput> {
  const { output } = await prompt(input);
  if (!output) throw new Error('Falha ao processar e-mail do ERP.');
  return output;
}
