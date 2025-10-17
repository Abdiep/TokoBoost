'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit'; // Menggunakan import dari genkit seperti di checkpoint-mu

const GenerateProductFlyerInputSchema = z.object({
  productImage: z
    .string()
    .describe(
      "A photo of the product, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  productDescription: z.string().describe('The product description.'),
});
export type GenerateProductFlyerInput = z.infer<typeof GenerateProductFlyerInputSchema>;

// --- PERUBAHAN 1: Skema Output diubah menjadi array berisi 2 gambar ---
const GenerateProductFlyerOutputSchema = z.object({
  flyerImageUris: z
    .array(z.string())
    .length(2)
    .describe('An array of two generated product flyer images.'),
});
export type GenerateProductFlyerOutput = z.infer<typeof GenerateProductFlyerOutputSchema>;

// Fungsi wrapper ini tetap sama
export async function generateProductFlyer(input: GenerateProductFlyerInput): Promise<GenerateProductFlyerOutput> {
  return generateProductFlyerFlow(input);
}

// --- MENGGUNAKAN STRUKTUR ai.defineFlow YANG SAMA PERSIS DENGAN CHECKPOINT-MU ---
const generateProductFlyerFlow = ai.defineFlow(
  {
    name: 'generateProductFlyerFlow',
    inputSchema: GenerateProductFlyerInputSchema,
    outputSchema: GenerateProductFlyerOutputSchema,
  },
  async (input) => {
    
    // --- PERUBAHAN 2: Membuat 2 template prompt yang berbeda ---
    const prompts = [
      // Prompt 1: Gaya Lifestyle (Sesuai kodemu yang berhasil)
      `
        **CRITICAL INSTRUCTIONS:**
        1.  You are an AI image editor. Your only task is to edit the provided image.
        2.  **IDENTIFY THE MAIN SUBJECT** of the image. The main subject is the product itself.
        3.  **DO NOT CHANGE, ALTER, OR REDRAW THE MAIN SUBJECT.** It must be preserved exactly as it is in the original image.
        4.  **COMPLETELY REMOVE THE ORIGINAL BACKGROUND** and replace it with a new one.
        5.  The new background must be hyper-realistic, fresh, sharp, and clear with soft and dramatic lighting. It should be suitable for e-commerce and social media for small enterprises (UMKM) in Indonesia, based on the product description: "${input.productDescription}".
        6.  If Background dark, make it bright.
        7.  If the object in the image is a hand, make sure it is removed and keep the focus on the object.
        8.  If the object is food or drink, make it look attractive to enjoy. Make sure you focus on the object, and ignore it if the description mentions the name of a place or city.
        9.  If the object is shoes, sandals, slippers, high heels, bags, or the like, use the model of wearing them and combine it with appropriate clothing or accessories.
        10. If the object is clothing, make sure you use a model and combine it with appropriate clothing or accessories.
        11. If the object is underwear such as panties, bras, lingeries, and the like, make sure the image is visualized without a model but still visualized elegantly and luxuriously.
        12. If the object is accessories that are worn, such as: hats, beanies, helmets, glasses, earrings, necklaces, bracelets and the like, use model of wearing them elegantly and attractively.
        13. If the object is kitchen equipments and utensils, use a model to demonstrate how to use it, focus and zoom in on the object.
        14. If the object is an automotive spare part or accessory, visualize it according to the automotive type.
        15. The final image must be in a portrait aspect ratio (9:16).
        16. **DO NOT ADD ANY TEXT** to the final image.
      `,

      // Prompt 2: Fokus ke Produk (dengan model)
      `Using the provided image as a strong visual reference, create a completely new photograph. A model is still present, but the shot is a medium close-up that focuses heavily on the product: "${input.productDescription}". The background should be soft-focus (bokeh) and non-distracting. The lighting must highlight the product's details and texture. The final image must be portrait (9:16). DO NOT ADD ANY TEXT.`
    ];

    // --- PERUBAHAN 3: Menjalankan 2 Panggilan AI secara bersamaan ---
    const generationPromises = prompts.map((promptText) =>
      ai.generate({
        model: 'googleai/gemini-2.5-flash-image-preview',
        prompt: [
          { media: { url: input.productImage } },
          { text: promptText },
        ],
        config: { responseModalities: ['IMAGE'] },
      })
    );

    const results = await Promise.all(generationPromises);

    const flyerImageUris = results.map((result, index) => {
      // Menggunakan ?.media?.url untuk keamanan jika media tidak ada
      const mediaUrl = result.media?.url;
      if (!mediaUrl) {
        throw new Error(`Failed to generate image for prompt #${index + 1}.`);
      }
      return mediaUrl;
    });

    return { flyerImageUris };
  }
);