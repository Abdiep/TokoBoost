'use server';

import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import {
  GenerateMarketingCaptionsInput,
  GenerateMarketingCaptionsOutput,
  GenerateMarketingCaptionsInputSchema,
  GenerateMarketingCaptionsOutputSchema,
} from './types';

export async function generateMarketingCaptions(
  input: GenerateMarketingCaptionsInput
): Promise<GenerateMarketingCaptionsOutput> {
  const ai = genkit({
    plugins: [googleAI()],
    logLevel: 'debug',
    enableTracingAndMetrics: true,
  });

  const marketingCaptionPrompt = ai.definePrompt({
    name: 'marketingCaptionPrompt',
    model: 'googleai/gemini-1.5-flash-preview',
    input: {schema: GenerateMarketingCaptionsInputSchema},
    output: {schema: GenerateMarketingCaptionsOutputSchema},
    prompt: `You are an expert marketing copywriter. 
      Generate 3-5 engaging and persuasive marketing captions for the following product.
    
      Product Description: {{{productDescription}}}
      Product Image: {{media url=productImage}}
    
      Generate a variety of captions, including some with questions, some with a call to action, and some with emojis.
      Keep the tone enthusiastic and professional. Return the captions as a list of strings.`,
  });

  const {output} = await marketingCaptionPrompt(input);
  if (!output) {
    throw new Error('Failed to generate captions.');
  }
  return output;
}