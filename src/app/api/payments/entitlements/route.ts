import { auth } from "@clerk/nextjs";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

// Everything the signed-in user has paid for, so the app can hide/show paywalls
// without a round trip per item.
export async function GET() {
  try {
    const { userId } = auth();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    const [purchases, testSeriesPurchases] = await Promise.all([
      db.purchase.findMany({ where: { userId }, select: { courseId: true } }),
      db.testSeriesPurchase.findMany({ where: { userId }, select: { testSeriesId: true } }),
    ]);

    return NextResponse.json({
      courseIds: purchases.map((purchase) => purchase.courseId),
      testSeriesIds: testSeriesPurchases.map((purchase) => purchase.testSeriesId),
    });
  } catch (error) {
    console.log("[ENTITLEMENTS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
