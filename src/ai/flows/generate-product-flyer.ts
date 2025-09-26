'use server';

import {ai} from '../genkit';
import {
  GenerateProductFlyerInput,
  GenerateProductFlyerOutput,
} from './types';

export async function generateProductFlyer(
  input: GenerateProductFlyerInput
): Promise<GenerateProductFlyerOutput> {
  const {media} = await ai.generate({
    model: 'googleai/gemini-1.5-flash-preview',
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
