
import {NextRequest, NextResponse} from 'next/server';
import {generateMarketingCaptions} from '@/ai/flows/generate-marketing-captions';
import {generateProductFlyer} from '@/ai/flows/generate-product-flyer';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    // Note: productImage is no longer used by the AI flows, but we keep it in the signature
    // to avoid breaking the frontend immediately.
    const {productImage, productDescription} = body;

    if (!productDescription) {
      return NextResponse.json({error: 'Missing product description'}, {status: 400});
    }

    const input = {
      productDescription: productDescription,
    };
    
    // Run in parallel for efficiency
    const [captionResult, flyerResult] = await Promise.all([
      generateMarketingCaptions(input),
      generateProductFlyer(input),
    ]);

    return NextResponse.json({
      flyerImageUri: flyerResult.flyerImageUri,
      captions: captionResult.captions,
    });
  } catch (error) {
    console.error('API Route Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({error: 'Failed to generate AI content.', details: errorMessage}, {status: 500});
  }
}
