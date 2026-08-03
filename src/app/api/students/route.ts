import { auth, clerkClient } from "@clerk/nextjs";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

// Teacher: roster of every student enrolled in one of their courses or test series.
// Optionally scoped to a single course/test series so goal assignment can filter.
export async function GET(req: Request) {
  try {
    const { userId } = auth();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get("courseId") || undefined;
    const testSeriesId = searchParams.get("testSeriesId") || undefined;

    const studentIds = new Set<string>();

    if (!testSeriesId) {
      const purchases = await db.purchase.findMany({
        where: {
          course: { userId },
          ...(courseId ? { courseId } : {}),
        },
        select: { userId: true },
      });
      purchases.forEach((purchase) => studentIds.add(purchase.userId));
    }

    if (!courseId) {
      const testPurchases = await db.testSeriesPurchase.findMany({
        where: {
          testSeries: { userId },
          ...(testSeriesId ? { testSeriesId } : {}),
        },
        select: { userId: true },
      });
      testPurchases.forEach((purchase) => studentIds.add(purchase.userId));
    }

    const ids = Array.from(studentIds);

    if (ids.length === 0) {
      return NextResponse.json([]);
    }

    // Prisma-side profile data is optional, Clerk holds the canonical name/email.
    const profiles = await db.studentProfile.findMany({
      where: { userId: { in: ids } },
    });
    const profileByUserId = new Map(profiles.map((profile) => [profile.userId, profile]));

    let students: Array<{ id: string; name: string; email: string; imageUrl?: string; grade?: string | null }> = [];

    try {
      const users = await clerkClient.users.getUserList({ userId: ids, limit: 100 });
      students = users.map((user) => ({
        id: user.id,
        name:
          profileByUserId.get(user.id)?.name ||
          (user.firstName ? `${user.firstName} ${user.lastName || ""}`.trim() : user.username || "Student"),
        email: user.emailAddresses?.[0]?.emailAddress || "",
        imageUrl: user.imageUrl,
        grade: profileByUserId.get(user.id)?.grade ?? null,
      }));
    } catch (error) {
      console.error("[STUDENTS_GET] Clerk lookup failed:", error);
      students = ids.map((id) => ({
        id,
        name: profileByUserId.get(id)?.name || "Student",
        email: "",
        grade: profileByUserId.get(id)?.grade ?? null,
      }));
    }

    students.sort((a, b) => a.name.localeCompare(b.name));

    return NextResponse.json(students);
  } catch (error) {
    console.log("[STUDENTS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
