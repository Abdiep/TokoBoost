import { NextResponse } from 'next/server';
import midtransClient from 'midtrans-client';

export async function POST(request: Request) {
  try {
    const { plan, userEmail } = await request.json();

    if (!plan || !userEmail) {
      return NextResponse.json({ error: 'Data tidak lengkap' }, { status: 400 });
    }

    // Inisialisasi Midtrans Snap
    let snap = new midtransClient.Snap({
      isProduction: false, // Set ke true jika sudah production
      serverKey: process.env.MIDTRANS_SERVER_KEY,
      clientKey: process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY
    });

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
    // Cek apakah error dari Midtrans
    if (error instanceof Error && 'httpStatusCode' in error) {
        const midtransError = error as any;
        return NextResponse.json({ error: midtransError.ApiResponse.error_messages || 'Terjadi kesalahan pada Midtrans' }, { status: midtransError.httpStatusCode });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
