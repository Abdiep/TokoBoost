import { NextRequest, NextResponse } from "next/server";
import midtransClient from "midtrans-client";

// Lakukan validasi environment variables di awal
const serverKey = process.env.MIDTRANS_SERVER_KEY;
const clientKey = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY;

if (!serverKey || !clientKey) {
  throw new Error("Midtrans server key or client key is not set in .env.local");
}

let snap = new midtransClient.Snap({
  isProduction: true, // Diatur ke true untuk produksi
  serverKey: serverKey,
  clientKey: clientKey,
});

export async function POST(req: NextRequest) {
  try {
    const { plan, user } = await req.json();

    if (!plan || !user) {
      return NextResponse.json(
        { error: "Data plan dan user dibutuhkan." },
        { status: 400 }
      );
    }

    const orderId = `KREDIT-${plan.name.toUpperCase()}-${Date.now()}`;

    const parameter = {
      transaction_details: {
        order_id: orderId,
        gross_amount: plan.price,
      },
      item_details: [{
        id: `credit-${plan.name}`,
        price: plan.price,
        quantity: 1,
        name: `Paket Kredit ${plan.name} (${plan.credits} Kredit)`,
      }],
      customer_details: {
        first_name: user.firstName || "Guest",
        last_name: user.lastName || "User",
        email: user.email || "guest@example.com",
        phone: user.phone || "081234567890",
      },
    };

    const transaction = await snap.createTransaction(parameter);
    const token = transaction.token;

    return NextResponse.json({ token, orderId });

  } catch (error: any) {
    console.error("Midtrans API Error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
