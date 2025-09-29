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
  model: 'googleai/gemini-2.5-flash-image-preview',
  prompt: `You are a marketing expert for the Indonesian market.

  Generate three marketing captions for the product in the image and description.
  
  Description: {{{productDescription}}}
  Image: {{media url=productImage}}
  
  Return ONLY three lines. Each line must contain one caption and its hashtags, separated by '|||'.
  Example:
  Caption satu|||#hashtag1 #hashtag2
  Caption dua|||#hashtag3 #hashtag4
  Caption tiga|||#hashtag5 #hashtag6
  
  Do not include numbering, titles, or any other text.`,
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
    
    const lines = rawText.split('\n').map(line => line.trim()).filter(Boolean);

    const captions = lines.slice(0, 3).map(line => {
        const parts = line.split('|||');
        if (parts.length !== 2) {
            console.warn(`Parsing failed for line: "${line}". Treating entire line as caption.`);
            return { caption: line, hashtags: '' };
        }
        return {
            caption: parts[0].trim(),
            hashtags: parts[1].trim()
        };
    });

    // If AI returns fewer than 3 captions, fill the rest with placeholder content
    // to prevent the frontend from breaking while still showing partial results.
    while (captions.length < 3) {
      captions.push({ caption: "Gagal membuat caption...", hashtags: "#error" });
    }

    return {
        captions: captions
    };
  }
);
