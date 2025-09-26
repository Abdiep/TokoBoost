'use server';

import {ai} from '@/ai/genkit';
import {
  GenerateProductFlyerInput,
  GenerateProductFlyerOutput,
  GenerateProductFlyerInputSchema,
  GenerateProductFlyerOutputSchema,
} from './types';
import {googleAI} from '@genkit-ai/googleai';

const flyerGenerationPrompt = ai.definePrompt({
  name: 'flyerGenerationPrompt',
  model: googleAI('gemini-1.5-flash-preview'),
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

const generateProductFlyerFlow = ai.defineFlow(
  {
    name: 'generateProductFlyerFlow',
    inputSchema: GenerateProductFlyerInputSchema,
    outputSchema: GenerateProductFlyerOutputSchema,
  },
  async (input) => {
    const response = await flyerGenerationPrompt(input);
    const imagePart = response.output();
    if (!imagePart) {
      throw new Error('Image generation failed.');
    }
    return {
      imageUrl: imagePart.url,
    };
  }
);

export async function generateProductFlyer(
  input: GenerateProductFlyerInput
): Promise<GenerateProductFlyerOutput> {
  return generateProductFlyerFlow(input);
}
