
import { genkit } from 'genkit';
import * as openaiPlugin from 'genkitx-openai';

/**
 * @fileOverview Configuração central do Genkit.
 * Implementa padrão resiliente para extração de plugin em ambiente Next.js 15 Turbopack.
 */

// Lógica de extração robusta para evitar erro "openai is not a function"
const getOpenAI = (plugin: any) => {
  if (typeof plugin === 'function') return plugin;
  if (plugin?.openai && typeof plugin.openai === 'function') return plugin.openai;
  if (plugin?.default?.openai && typeof plugin.default.openai === 'function') return plugin.default.openai;
  if (plugin?.default && typeof plugin.default === 'function') return plugin.default;
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
