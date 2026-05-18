
import { genkit } from 'genkit';
import * as openaiPluginModule from 'genkitx-openai';

/**
 * Configuração do Genkit utilizando OpenRouter como provedor.
 * OpenRouter é 100% compatível com a API da OpenAI.
 * Modelo selecionado: nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free
 * 
 * Lida com problemas de interoperabilidade CJS/ESM no Next.js 15 (Turbopack).
 */

const openai = (openaiPluginModule as any).openai || (openaiPluginModule as any).default || openaiPluginModule;

export const ai = genkit({
  plugins: [
    openai({
      apiKey: process.env.OPENROUTER_API_KEY,
      config: {
        // Redireciona as chamadas para o endpoint do OpenRouter
        baseURL: "https://openrouter.ai/api/v1",
      }
    }),
  ],
  // Definimos o modelo específico do OpenRouter como padrão para o app
  model: 'openai/nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free',
});
