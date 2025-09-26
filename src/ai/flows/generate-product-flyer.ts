'use server';

import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import {
  GenerateProductFlyerInput,
  GenerateProductFlyerOutput,
  GenerateProductFlyerInputSchema,
  GenerateProductFlyerOutputSchema,
} from './types';

export async function generateProductFlyer(
  input: GenerateProductFlyerInput
): Promise<GenerateProductFlyerOutput> {
  const ai = genkit({
    plugins: [googleAI()],
    logLevel: 'debug',
    enableTracingAndMetrics: true,
  });

  const flyerGenerationPrompt = ai.definePrompt({
    name: 'flyerGenerationPrompt',
    model: 'googleai/gemini-1.5-flash-preview',
    input: {schema: GenerateProductFlyerInputSchema},
    prompt: `You are a graphic designer. Create a visually appealing product flyer.
  
    The user has provided an image of their product and a description.
    Your task is to take the user's product image, remove its background, and place it on a clean, modern, and aesthetically pleasing background that complements the product.
    
    Do not add any text to the image.
    
    Product Description: {{{productDescription}}}
    Product Image: {{media url=productImage}}`,
    output: {
      format: 'media',
    },
  });

  const {media} = await flyerGenerationPrompt(input);
  if (!media) {
    throw new Error('Image generation failed to return media.');
  }
  return {
    imageUrl: media.url,
  };
}