
import { genkit } from 'genkit';
import { openAI } from 'genkitx-openai';

/**
 * Configuração central do Genkit AI utilizando OpenRouter.
 * O modelo padrão foi atualizado para o NVIDIA Nemotron Reasoning (Free) conforme solicitado.
 * A chave deve ser configurada via OPENROUTER_API_KEY no .env.
 */
export const ai = genkit({
  plugins: [
    openAI({
      apiKey: process.env.OPENROUTER_API_KEY,
      baseURL: "https://openrouter.ai/api/v1",
    }),
  ],
  // Modelo de raciocínio gratuito via OpenRouter
  model: 'openai/nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free',
});
