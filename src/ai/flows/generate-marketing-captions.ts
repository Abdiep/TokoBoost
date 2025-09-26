'use server';

import {ai} from '@/ai/genkit';
import {
  GenerateMarketingCaptionsInput,
  GenerateMarketingCaptionsOutput,
  GenerateMarketingCaptionsInputSchema,
  GenerateMarketingCaptionsOutputSchema,
} from './types';
import {googleAI} from '@genkit-ai/googleai';

const marketingCaptionPrompt = ai.definePrompt(
  {
    name: 'marketingCaptionPrompt',
    model: googleAI('gemini-1.5-flash-preview'),
    input: {schema: GenerateMarketingCaptionsInputSchema},
    output: {schema: GenerateMarketingCaptionsOutputSchema},
    prompt: `You are an expert marketing copywriter. 
    Generate 3-5 engaging and persuasive marketing captions for the following product.
  
    Product Description: {{{productDescription}}}
    Product Image: {{media url=productImage}}
  
    Generate a variety of captions, including some with questions, some with a call to action, and some with emojis.
    Keep the tone enthusiastic and professional. Return the captions as a list of strings.`,
  },
);

const generateMarketingCaptionsFlow = ai.defineFlow(
  {
    name: 'generateMarketingCaptionsFlow',
    inputSchema: GenerateMarketingCaptionsInputSchema,
    outputSchema: GenerateMarketingCaptionsOutputSchema,
  },
  async (input) => {
    const response = await marketingCaptionPrompt(input);
    return response.output!;
  }
);

export async function generateMarketingCaptions(
  input: GenerateMarketingCaptionsInput
): Promise<GenerateMarketingCaptionsOutput> {
  return generateMarketingCaptionsFlow(input);
}
