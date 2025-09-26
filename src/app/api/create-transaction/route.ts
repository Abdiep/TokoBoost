import { NextResponse } from 'next/server';
import { snap } from '@/lib/midtrans';

export async function POST(request: Request) {
  let plan;
  try {
    const body = await request.json();
    plan = body.plan;
    const userEmail = body.userEmail;

    if (!plan || !userEmail) {
      return NextResponse.json({ error: 'Data tidak lengkap' }, { status: 400 });
    }

    let parameter = {
      "transaction_details": {
        "order_id": `TOKBOOST-${plan.name}-${Date.now()}`,
        "gross_amount": plan.price
      },
      "credit_card": {
        "secure": true
      },
      "customer_details": {
        "email": userEmail,
      },
      "item_details": [
        {
            "id": `CREDIT-${plan.name}`,
            "price": plan.price,
            "quantity": 1,
            "name": `Paket Kredit ${plan.name} (${plan.credits} Kredit)`
        }
      ]
    };

    const token = await snap.createTransactionToken(parameter);

    return NextResponse.json({ token });

  } catch (error) {
    console.error("Midtrans API Error:", error);
    if (error instanceof Error && 'httpStatusCode' in error) {
        const midtransError = error as any;
        return NextResponse.json({ error: midtransError.ApiResponse.error_messages || 'Terjadi kesalahan pada Midtrans' }, { status: midtransError.httpStatusCode });
    }
    // Generic error if plan is not defined or another error occurs
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
