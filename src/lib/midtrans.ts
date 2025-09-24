import midtransClient from 'midtrans-client';

// Inisialisasi Midtrans Snap
export const snap = new midtransClient.Snap({
    isProduction: false, // Ganti ke true saat production
    serverKey: process.env.MIDTRANS_SERVER_KEY,
    clientKey: process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY
});
