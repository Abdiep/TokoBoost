'use server';

/**
 * @fileOverview Generates three marketing captions for a product based on an image and description.
 *
 * - generateMarketingCaptions - A function that generates marketing captions.
 * - GenerateMarketingCaptionsInput - The input type for the generateMarketingCaptions function.
 * - GenerateMarketingCaptionsOutput - The return type for the generateMarketingCaptions function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateMarketingCaptionsInputSchema = z.object({
  productImage: z
    .string()
    .describe(
      "A photo of the product, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  productDescription: z.string().describe('A description of the product.'),
});
export type GenerateMarketingCaptionsInput = z.infer<
  typeof GenerateMarketingCaptionsInputSchema
>;

const GenerateMarketingCaptionsOutputSchema = z.object({
  captions: z
    .array(z.string())
    .length(3)
    .describe('Three compelling marketing captions for the product.'),
});
export type GenerateMarketingCaptionsOutput = z.infer<
  typeof GenerateMarketingCaptionsOutputSchema
>;

export async function generateMarketingCaptions(
  input: GenerateMarketingCaptionsInput
): Promise<GenerateMarketingCaptionsOutput> {
  return generateMarketingCaptionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateMarketingCaptionsPrompt',
  input: {schema: GenerateMarketingCaptionsInputSchema},
  model: 'googleai/gemini-2.5-flash-image-preview', // Standardized model
  prompt: `You are a marketing expert who specializes in writing compelling captions for the Indonesian market.

  Generate three different marketing captions for the following product, using the description and image provided.
  
  Description: {{{productDescription}}}
  Image: {{media url=productImage}}
  
  The captions should be highly engaging, persuasive, and resonate with local consumers to increase sales.
  
  IMPORTANT: Return ONLY the three captions, separated by the characters '|||'. Do not include numbering, titles, or any other text.
  
  Example format: Caption satu.|||Caption dua.|||Caption tiga.`,
});

const generateMarketingCaptionsFlow = ai.defineFlow(
  {
    name: 'generateMarketingCaptionsFlow',
    inputSchema: GenerateMarketingCaptionsInputSchema,
    outputSchema: GenerateMarketingCaptionsOutputSchema,
  },
  async input => {
    // We can't use structured output, so we parse the raw text response.
    const response = await prompt(input);
    const rawText = response.text;

    if (!rawText) {
      throw new Error('Failed to generate captions: AI returned an empty response.');
    }
    
    const captions = rawText.split('|||').map(caption => caption.trim()).filter(Boolean);

    if (captions.length < 3) {
        console.error("AI did not return 3 captions. Raw output:", rawText);
        throw new Error('Failed to parse AI response. Could not find three captions.');
    }

    return {
        captions: captions.slice(0, 3)
    };
  }
);
