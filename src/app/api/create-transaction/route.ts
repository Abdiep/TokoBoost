import { NextResponse } from 'next/server';


export async function POST(request: Request) {
  try {
    const body = await request.json();
    const plan = body.plan;
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

    // const token = await snap.createTransactionToken(parameter);

    // return NextResponse.json({ token });
    // NOTE: The above lines are commented out as `snap` is not defined.
    // This will need to be configured with the Midtrans client library.
    // For now, returning a success response to prevent crashes.
    return NextResponse.json({ message: "Endpoint created, but payment gateway is not configured." });


  } catch (error) {
    console.error("API Error:", error);
    if (error instanceof Error && 'httpStatusCode' in error) {
        const midtransError = error as any;
        return NextResponse.json({ error: midtransError.ApiResponse.error_messages || 'Terjadi kesalahan pada Midtrans' }, { status: midtransError.httpStatusCode });
    }
    // Generic error for parsing issues or other unexpected errors
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
