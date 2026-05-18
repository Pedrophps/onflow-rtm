import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

/**
 * Configuração central do Genkit AI.
 * O plugin googleAI utiliza o modelo Gemini 1.5 Flash por padrão.
 * As chaves podem ser configuradas via GEMINI_API_KEY ou GOOGLE_GENAI_API_KEY no .env.
 */
export const ai = genkit({
  plugins: [
    googleAI({
      apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_GENAI_API_KEY || process.env.GOOGLE_API_KEY,
    }),
  ],
  model: 'googleai/gemini-1.5-flash',
});
