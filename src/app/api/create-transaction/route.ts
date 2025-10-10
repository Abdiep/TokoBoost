import { NextRequest, NextResponse } from "next/server";
import midtransClient from "midtrans-client";

// Lakukan validasi environment variables di awal
const serverKey = process.env.MIDTRANS_SERVER_KEY;
const clientKey = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY;

if (!serverKey || !clientKey) {
  // Jangan lempar error di sini agar aplikasi tidak crash, cukup log dan return error di handler
  console.error("Midtrans server key or client key is not set in .env");
}

let snap: midtransClient.Snap;
// Inisialisasi snap hanya jika kedua kunci ada.
// isProduction harusnya true untuk lingkungan produksi, bukan false.
if (serverKey && clientKey) {
    snap = new midtransClient.Snap({
      isProduction: true, 
      serverKey: serverKey,
      clientKey: clientKey,
    });
}


export async function POST(req: NextRequest) {
  // Validasi sekali lagi di dalam handler untuk memastikan snap terinisialisasi
  if (!snap) {
    return NextResponse.json(
      { error: "Konfigurasi server Midtrans tidak lengkap." },
      { status: 500 }
    );
  }

  try {
    const { plan, user } = await req.json();

    if (!plan || !user) {
      return NextResponse.json(
        { error: "Data plan dan user dibutuhkan." },
        { status: 400 }
      );
    }

    // Buat order ID yang unik
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
        merchant_name: "TokoBoost AI"
      }],
      customer_details: {
        first_name: user.firstName || "Guest",
        last_name: user.lastName || "",
        email: user.email || "guest@example.com",
        phone: user.phone || "081234567890",
      },
       "callbacks": {
        "finish": `${req.nextUrl.origin}/`
      }
    };

    const transaction = await snap.createTransaction(parameter);
    const token = transaction.token;

    return NextResponse.json({ token, orderId });

  } catch (error: any) {
    console.error("Midtrans API Error:", error.message);
    // Mengembalikan pesan error yang lebih spesifik dari Midtrans jika ada
    const errorMessage = error.ApiResponse ? error.ApiResponse.error_messages.join(', ') : error.message;
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
