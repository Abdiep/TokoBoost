import {NextRequest, NextResponse} from 'next/server';
import {generateMarketingCaptions} from '@/ai/flows/generate-marketing-captions';
import {generateProductFlyer} from '@/ai/flows/generate-product-flyer';
import {removeImageBackground} from '@/ai/flows/remove-image-background';
import {ai} from '@/ai/genkit';


async function combineImages(productImage: string, backgroundImage: string): Promise<string> {
    const {media} = await ai.generate({
      model: 'googleai/gemini-2.5-flash-image-preview',
      prompt: [
        {text: "Place the subject from the first image onto the second image. The final image should look realistic. Ensure the final image is portrait (9:16)."},
        {media: {url: productImage}},
        {media: {url: backgroundImage}},
      ],
       config: {
        responseModalities: ['TEXT', 'IMAGE'],
       },
    });

    if (!media?.url) {
        throw new Error('Failed to combine images.');
    }
    return media.url;
}


export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {productImage, productDescription} = body;

    if (!productImage || !productDescription) {
      return NextResponse.json({error: 'Missing product image or description'}, {status: 400});
    }

    // Run caption generation and the new image generation pipeline in parallel
    const [captionResult, newFlyer] = await Promise.all([
      generateMarketingCaptions({
        productImage: productImage,
        productDescription: productDescription,
      }),
      (async () => {
        // Image generation pipeline
        const [productImageNoBg, backgroundResult] = await Promise.all([
           removeImageBackground({productImage: productImage}),
           generateProductFlyer({productDescription: productDescription}),
        ]);
        
        // Combine the images
        const finalFlyerUri = await combineImages(
            productImageNoBg.productImageUri, 
            backgroundResult.backgroundImageUri
        );

        return { flyerImageUri: finalFlyerUri };
      })()
    ]);

    return NextResponse.json({
      flyerImageUri: newFlyer.flyerImageUri,
      captions: captionResult.captions,
    });
  } catch (error) {
    console.error('API Route Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({error: 'Failed to generate AI content.', details: errorMessage}, {status: 500});
  }
}
