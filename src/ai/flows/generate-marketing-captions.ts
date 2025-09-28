
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
  output: {schema: GenerateMarketingCaptionsOutputSchema},
  prompt: `You are a marketing expert who specializes in writing compelling captions.

  Generate three different marketing captions for the following product, using the description and image provided.

  Description: {{{productDescription}}}
  Image: {{media url=productImage}}

  The captions should be highly engaging and persuasive, designed to attract customers and increase sales.

  Ensure that the captions are tailored to the Indonesian market and resonate with local consumers.

  Return three captions in the captions field.`,
});

const generateMarketingCaptionsFlow = ai.defineFlow(
  {
    name: 'generateMarketingCaptionsFlow',
    inputSchema: GenerateMarketingCaptionsInputSchema,
    outputSchema: GenerateMarketingCaptionsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
