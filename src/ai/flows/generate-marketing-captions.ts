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

const CaptionWithHashtagsSchema = z.object({
    caption: z.string().describe('The marketing caption.'),
    hashtags: z.string().describe('A string of relevant hashtags, starting with #.'),
});

const GenerateMarketingCaptionsOutputSchema = z.object({
  captions: z
    .array(CaptionWithHashtagsSchema)
    .length(3)
    .describe('Three compelling marketing captions for the product, each with relevant hashtags.'),
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
  model: 'googleai/gemini-2.5-flash-image-preview',
  prompt: `You are a marketing expert for the Indonesian market.

  Generate three compelling marketing captions for the product in the image and description.
  Each caption must include relevant hashtags.
  
  Description: {{{productDescription}}}
  Image: {{media url=productImage}}
  
  Please provide the output in a valid JSON format that matches the specified schema.`,
});

const generateMarketingCaptionsFlow = ai.defineFlow(
  {
    name: 'generateMarketingCaptionsFlow',
    inputSchema: GenerateMarketingCaptionsInputSchema,
    outputSchema: GenerateMarketingCaptionsOutputSchema,
  },
  async input => {
    const response = await prompt(input);
    const output = response.output;

    if (!output?.captions || output.captions.length < 3) {
      // If the AI fails to return the correct structure, return a structured error response
      // to prevent the client from crashing.
      console.error('AI did not return 3 captions. Returning fallback.');
      return {
        captions: [
          { caption: "Gagal membuat caption 1...", hashtags: "#error" },
          { caption: "Gagal membuat caption 2...", hashtags: "#error" },
          { caption: "Gagal membuat caption 3...", hashtags: "#error" },
        ]
      };
    }
    
    return output;
  }
);