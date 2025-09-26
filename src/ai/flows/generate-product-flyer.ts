'use server';

import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import {
  GenerateProductFlyerInput,
  GenerateProductFlyerOutput,
} from './types';

export async function generateProductFlyer(
  input: GenerateProductFlyerInput
): Promise<GenerateProductFlyerOutput> {
  // NOTE: Genkit is already initialized in a central file.
  // We do not need to call genkit({...}) here.

  const {media} = await genkit.generate({
    model: 'gemini-1.5-flash-preview',
    prompt: [
      {
        text: `You are a graphic designer. Create a visually appealing product flyer.
  
    The user has provided an image of their product and a description.
    Your task is to take the user's product image, remove its background, and place it on a clean, modern, and aesthetically pleasing background that complements the product.
    
    Do not add any text to the image.
    
    Product Description: ${input.productDescription}
    Product Image:`,
      },
      {media: {url: input.productImage}},
    ],
    output: {
      format: 'media',
    },
  });

  if (!media) {
    throw new Error('Image generation failed to return media.');
  }
  return {
    imageUrl: media.url,
  };
}
