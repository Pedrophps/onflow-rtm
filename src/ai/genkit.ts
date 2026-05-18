
import { genkit } from 'genkit';
import * as openaiPlugin from 'genkitx-openai';

// Importação resiliente para garantir funcionamento no Turbopack/Next.js 15
const openai = (openaiPlugin as any).openai || (openaiPlugin as any).default?.openai || openaiPlugin;

export const ai = genkit({
  plugins: [
    openai({
      apiKey: process.env.OPENROUTER_API_KEY,
      baseURL: 'https://openrouter.ai/api/v1',
    }),
  ],
});
