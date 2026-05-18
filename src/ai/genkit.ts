
import { genkit } from 'genkit';
import * as openaiPluginModule from 'genkitx-openai';

/**
 * Lógica de importação resiliente para lidar com diferenças de exportação CJS/ESM no Next.js 15 Turbopack.
 * Garante que o plugin seja identificado corretamente como uma função de configuração.
 */
const openai = (openaiPluginModule as any).openai || (openaiPluginModule as any).default || openaiPluginModule;

export const ai = genkit({
  plugins: [
    openai({
      apiKey: process.env.OPENROUTER_API_KEY,
      baseURL: 'https://openrouter.ai/api/v1',
    }),
  ],
});
