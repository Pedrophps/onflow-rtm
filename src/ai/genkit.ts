
import { genkit } from 'genkit';
import * as openaiPlugin from 'genkitx-openai';

/**
 * @fileOverview Configuração central do Genkit.
 * Resolve problemas de interoperabilidade CJS/ESM no Turbopack do Next.js 15.
 */

// Lógica de extração do plugin para evitar "TypeError: openai is not a function"
const getOpenAI = (plugin: any) => {
  if (typeof plugin === 'function') return plugin;
  if (plugin?.openai && typeof plugin.openai === 'function') return plugin.openai;
  if (plugin?.default?.openai && typeof plugin.default.openai === 'function') return plugin.default.openai;
  return plugin;
};

const openai = getOpenAI(openaiPlugin);

export const ai = genkit({
  plugins: [
    openai({
      apiKey: process.env.OPENROUTER_API_KEY,
      baseURL: 'https://openrouter.ai/api/v1',
    }),
  ],
});
