import {z} from 'zod';

export const GenerateMarketingCaptionsInputSchema = z.object({
  productDescription: z
    .string()
    .describe('A description of the product to generate captions for.'),
  productImage: z
    .string()
    .describe(
      'A product image, as a data URI that must include a MIME type and use Base64 encoding.'
    ),
});
export type GenerateMarketingCaptionsInput = z.infer<
  typeof GenerateMarketingCaptionsInputSchema
>;

export const GenerateMarketingCaptionsOutputSchema = z.object({
  captions: z
    .array(z.string())
    .describe('A list of 3-5 marketing captions for the product.'),
});
export type GenerateMarketingCaptionsOutput = z.infer<
  typeof GenerateMarketingCaptionsOutputSchema
>;

export const GenerateProductFlyerInputSchema = z.object({
  productDescription: z
    .string()
    .describe('A description of the product to generate a flyer for.'),
  productImage: z
    .string()
    .describe(
      'A product image, as a data URI that must include a MIME type and use Base64 encoding.'
    ),
});
export type GenerateProductFlyerInput = z.infer<
  typeof GenerateProductFlyerInputSchema
>;

export const GenerateProductFlyerOutputSchema = z.object({
  imageUrl: z
    .string()
    .describe(
      'The generated flyer image, as a data URI that must include a MIME type and use Base64 encoding.'
    ),
});
export type GenerateProductFlyerOutput = z.infer<
  typeof GenerateProductFlyerOutputSchema
>;
