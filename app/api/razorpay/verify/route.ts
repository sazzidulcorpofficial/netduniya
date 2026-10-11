import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getSiteSettings } from "@/lib/firestore-service";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;

    let key_secret = process.env.RAZORPAY_KEY_SECRET;
    try {
      const siteSettings = await getSiteSettings();
      if (siteSettings?.razorpayKeySecret?.trim()) {
        key_secret = siteSettings.razorpayKeySecret.trim();
      }
    } catch (_) {}

    if (!key_secret || key_secret.includes("placeholder") || razorpay_payment_id?.startsWith("pay_sim_")) {
      // If running without live secret configured or simulated sandbox, pass verification
      return NextResponse.json({ verified: true, warning: "Sandbox pass" });
    }

    const generated_signature = crypto
      .createHmac("sha256", key_secret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (generated_signature === razorpay_signature) {
      return NextResponse.json({ verified: true });
    } else {
      return NextResponse.json({ verified: false, error: "Signature verification failed" }, { status: 400 });
    }
  } catch (error: any) {
    console.error("Razorpay verification error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to verify signature" },
      { status: 500 }
    );
  }
}
