
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

/**
 * Configuração central do Genkit utilizando o plugin oficial do Google AI.
 * Esta configuração garante máxima estabilidade e compatibilidade com o ambiente de execução.
 */
export const ai = genkit({
  plugins: [
    googleAI(),
  ],
});
