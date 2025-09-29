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
  model: 'googleai/gemini-2.5-flash-image-preview', // Standardized model
  prompt: `You are a marketing expert who specializes in writing compelling captions for the Indonesian market.

  Generate three different marketing captions for the following product, using the description and image provided. For each caption, also provide a list of relevant hashtags.
  
  Description: {{{productDescription}}}
  Image: {{media url=productImage}}
  
  The captions should be highly engaging, persuasive, and resonate with local consumers to increase sales. Each caption must be paired with its own relevant hashtags.
  
  IMPORTANT: Return ONLY the three pairs of caption and hashtags. Use the exact format:
  Caption satu|||#hashtag1 #hashtag2
  Caption dua|||#hashtag3 #hashtag4
  Caption tiga|||#hashtag5 #hashtag6
  
  Do not include numbering, titles, or any other text. Each line must contain one caption and its corresponding hashtags, separated by '|||'.`,
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

    if (lines.length < 3) {
        console.error("AI did not return 3 lines. Raw output:", rawText);
        throw new Error('Failed to parse AI response. Could not find three caption/hashtag pairs.');
    }

    const captions = lines.slice(0, 3).map(line => {
        const parts = line.split('|||');
        if (parts.length !== 2) {
            // If parsing fails, return a default structure to avoid crashing the app
            return { caption: line, hashtags: '' };
        }
        return {
            caption: parts[0].trim(),
            hashtags: parts[1].trim()
        };
    });

    return {
        captions: captions
    };
  }
);
