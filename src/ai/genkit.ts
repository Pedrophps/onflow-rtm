
import { genkit } from 'genkit';
import { openAI } from 'genkitx-openai';

/**
 * Configuração central do Genkit AI utilizando OpenRouter.
 * OpenRouter é compatível com o plugin OpenAI (via genkitx-openai).
 * A chave deve ser configurada via OPENROUTER_API_KEY no .env.
 */
export const ai = genkit({
  plugins: [
    openAI({
      apiKey: process.env.OPENROUTER_API_KEY,
      baseURL: "https://openrouter.ai/api/v1",
    }),
  ],
  // Modelo padrão via OpenRouter
  model: 'openai/google/gemini-2.0-flash-001',
});
