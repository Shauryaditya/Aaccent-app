import { currentUser } from "@clerk/nextjs";
import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

// Mobile checkout: create a Razorpay Payment Link the app can open in a browser.
// Payment Links avoid bundling Razorpay's native SDK, so the app still runs in Expo Go.
export async function POST(req: Request) {
  try {
    const user = await currentUser();
    if (!user?.id) return new NextResponse("Unauthorized", { status: 401 });

    const email = user.emailAddresses?.[0]?.emailAddress;
    const { type, id } = await req.json();

    if (type !== "course" && type !== "testSeries") {
      return new NextResponse("type must be 'course' or 'testSeries'", { status: 400 });
    }
    if (!id) {
      return new NextResponse("id is required", { status: 400 });
    }

    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      console.error("[PAYMENT_LINK] Razorpay keys are not configured");
      return new NextResponse("Payments are not configured", { status: 503 });
    }

    let title: string;
    let price: number | null;

    if (type === "course") {
      const course = await db.course.findUnique({
        where: { id, isPublished: true },
        select: { title: true, price: true },
      });
      if (!course) return new NextResponse("Course not found", { status: 404 });

      const existing = await db.purchase.findUnique({
        where: { userId_courseId: { userId: user.id, courseId: id } },
      });
      if (existing) return new NextResponse("Already purchased", { status: 400 });

      title = course.title;
      price = course.price;
    } else {
      const series = await db.testSeries.findUnique({
        where: { id, isPublished: true },
        select: { title: true, price: true },
      });
      if (!series) return new NextResponse("Test series not found", { status: 404 });

      const existing = await db.testSeriesPurchase.findUnique({
        where: { userId_testSeriesId: { userId: user.id, testSeriesId: id } },
      });
      if (existing) return new NextResponse("Already purchased", { status: 400 });

      title = series.title;
      price = series.price;
    }

    if (!price || price <= 0) {
      return new NextResponse("This item is free — no payment required", { status: 400 });
    }

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const paymentLink = await razorpay.paymentLink.create({
      amount: Math.round(price * 100),
      currency: "INR",
      accept_partial: false,
      description: title.slice(0, 250),
      customer: {
        name: [user.firstName, user.lastName].filter(Boolean).join(" ") || "Student",
        ...(email ? { email } : {}),
      },
      notify: { sms: false, email: false },
      reminder_enable: false,
      // The app reads these back during verification to know what was bought.
      notes: {
        userId: user.id,
        type,
        itemId: id,
      },
    });

    return NextResponse.json({
      paymentLinkId: paymentLink.id,
      url: paymentLink.short_url,
      amount: price,
      title,
    });
  } catch (error: any) {
    console.error("[PAYMENT_LINK_POST]", error);
    return new NextResponse(error?.error?.description || "Internal Server Error", { status: 500 });
  }
}
