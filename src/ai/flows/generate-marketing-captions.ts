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
  // Initialize Genkit with the Google AI plugin.
  genkit({
    plugins: [googleAI()],
    logLevel: 'debug',
    enableTracingAndMetrics: true,
  });

  const {output} = await genkit.generate({
    model: 'gemini-1.5-flash-preview',
    prompt: `You are an expert marketing copywriter. 
      Generate 3-5 engaging and persuasive marketing captions for the following product.
    
      Product Description: ${input.productDescription}
      Product Image: ${genkit.media(input.productImage)}
    
      Generate a variety of captions, including some with questions, some with a call to action, and some with emojis.
      Keep the tone enthusiastic and professional. Return the captions as a list of strings.`,
    output: {
      schema: GenerateMarketingCaptionsOutputSchema,
    },
  });

  if (!output) {
    throw new Error('Failed to generate captions.');
  }
  return output;
}
