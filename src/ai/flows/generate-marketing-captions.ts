
'use server';
/**
 * @fileOverview Generates three marketing captions with hashtags for a product based on an image and description.
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

const CaptionAndHashtagsSchema = z.object({
  caption: z.string().describe('A compelling marketing caption for the product.'),
  hashtags: z.string().describe('A string of relevant hashtags, separated by spaces (e.g., "#product #promo #sale").'),
});

const GenerateMarketingCaptionsOutputSchema = z.object({
  captions: z
    .array(CaptionAndHashtagsSchema)
    .length(3)
    .describe('Three compelling marketing captions for the product, each with a corresponding set of hashtags.'),
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
  output: {schema: GenerateMarketingCaptionsOutputSchema},
  model: 'googleai/gemini-pro-vision',
  prompt: `You are a marketing expert who specializes in writing compelling social media posts for the Indonesian market.

  Generate three different marketing posts for the following product, using the description and image provided.

  Description: {{{productDescription}}}
  Image: {{media url=productImage}}

  Each post must include:
  1. A compelling and persuasive caption in Indonesian.
  2. A string of relevant hashtags, separated by spaces.

  The captions and hashtags should be highly engaging, tailored to the Indonesian market, and designed to attract customers and increase sales on platforms like Instagram and Facebook.

  Return three objects in the 'captions' array, each containing a 'caption' and a 'hashtags' field.`,
});

const generateMarketingCaptionsFlow = ai.defineFlow(
  {
    name: 'generateMarketingCaptionsFlow',
    inputSchema: GenerateMarketingCaptionsInputSchema,
    outputSchema: GenerateMarketingCaptionsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    if (!output) {
      throw new Error('Failed to generate marketing captions. The AI model did not return any output.');
    }
    return output;
  }
);
