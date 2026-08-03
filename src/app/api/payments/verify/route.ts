import { auth } from "@clerk/nextjs";
import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

// Mobile checkout: confirm a Payment Link was actually paid, then grant access.
// The payment status is read straight from Razorpay, so a client cannot fake it.
export async function POST(req: Request) {
  try {
    const { userId } = auth();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    const { paymentLinkId } = await req.json();

    if (!paymentLinkId) {
      return new NextResponse("paymentLinkId is required", { status: 400 });
    }

    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      console.error("[PAYMENT_VERIFY] Razorpay keys are not configured");
      return new NextResponse("Payments are not configured", { status: 503 });
    }

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const paymentLink: any = await razorpay.paymentLink.fetch(paymentLinkId);
    const notes = paymentLink?.notes || {};

    // The link must belong to the caller — otherwise anyone could redeem someone else's payment.
    if (notes.userId !== userId) {
      return new NextResponse("This payment does not belong to you", { status: 403 });
    }

    if (paymentLink.status !== "paid") {
      return NextResponse.json({ paid: false, status: paymentLink.status });
    }

    const { type, itemId } = notes;

    if (type === "course") {
      const existing = await db.purchase.findUnique({
        where: { userId_courseId: { userId, courseId: itemId } },
      });
      if (!existing) {
        await db.purchase.create({ data: { userId, courseId: itemId } });
      }
    } else if (type === "testSeries") {
      const existing = await db.testSeriesPurchase.findUnique({
        where: { userId_testSeriesId: { userId, testSeriesId: itemId } },
      });
      if (!existing) {
        await db.testSeriesPurchase.create({ data: { userId, testSeriesId: itemId } });
      }
    } else {
      return new NextResponse("Unknown payment type", { status: 400 });
    }

    return NextResponse.json({ paid: true, status: paymentLink.status, type, itemId });
  } catch (error: any) {
    console.error("[PAYMENT_VERIFY_POST]", error);
    return new NextResponse(error?.error?.description || "Internal Server Error", { status: 500 });
  }
}
