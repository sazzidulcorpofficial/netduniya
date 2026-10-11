import { NextRequest, NextResponse } from "next/server";
import Razorpay from "razorpay";
import { getSiteSettings } from "@/lib/firestore-service";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { amount, currency = "INR", receipt, notes } = body;

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    // 1. Check Firestore siteSettings first, fallback to environment variables
    let key_id = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    let key_secret = process.env.RAZORPAY_KEY_SECRET;

    try {
      const siteSettings = await getSiteSettings();
      if (siteSettings?.razorpayKeyId?.trim()) {
        key_id = siteSettings.razorpayKeyId.trim();
      }
      if (siteSettings?.razorpayKeySecret?.trim()) {
        key_secret = siteSettings.razorpayKeySecret.trim();
      }
    } catch (err) {
      console.warn("Could not read Razorpay keys from siteSettings, using env:", err);
    }

    const isRealRazorpayKey = 
      key_id && 
      key_secret && 
      key_id.startsWith("rzp_") && 
      !key_id.includes("placeholder") && 
      !key_secret.includes("placeholder");

    if (isRealRazorpayKey) {
      const razorpay = new Razorpay({
        key_id,
        key_secret,
      });

      const options = {
        amount: Math.round(amount * 100), // amount in paise
        currency,
        receipt: receipt || `rec_${Date.now()}`,
        notes: notes || {},
      };

      const order = await razorpay.orders.create(options);
      return NextResponse.json({
        id: order.id,
        amount: order.amount,
        currency: order.currency,
        receipt: order.receipt,
        key_id,
      });
    }

    // Seamless Sandbox / Simulated order when live merchant keys are not configured
    const simulatedOrderId = `order_sim_${Date.now()}`;
    return NextResponse.json({
      id: simulatedOrderId,
      amount: Math.round(amount * 100),
      currency,
      receipt: receipt || `rec_${Date.now()}`,
      isSimulated: true,
      key_id: key_id || "rzp_test_simulated",
    });
  } catch (error: any) {
    console.error("Razorpay order creation error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create Razorpay order" },
      { status: 500 }
    );
  }
}
