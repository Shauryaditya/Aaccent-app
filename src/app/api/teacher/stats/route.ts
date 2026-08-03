import { auth } from "@clerk/nextjs";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

// Aggregate overview for the teacher dashboard.
export async function GET() {
  try {
    const { userId } = auth();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    const [courses, testSeries, coursePurchases, testSeriesPurchases, openGoals, recentSubmissions] =
      await Promise.all([
        db.course.findMany({
          where: { userId },
          select: {
            id: true,
            title: true,
            price: true,
            isPublished: true,
            _count: { select: { purchases: true } },
          },
        }),
        db.testSeries.findMany({
          where: { userId },
          select: {
            id: true,
            price: true,
            isPublished: true,
            _count: { select: { testSeriesPurchase: true } },
          },
        }),
        db.purchase.findMany({
          where: { course: { userId } },
          select: { userId: true, course: { select: { price: true } } },
        }),
        db.testSeriesPurchase.findMany({
          where: { testSeries: { userId } },
          select: { userId: true, testSeries: { select: { price: true } } },
        }),
        db.goal.count({ where: { teacherId: userId, isCompleted: false } }),
        db.testSubmission.findMany({
          where: { testChapter: { testSeries: { userId } } },
          include: { testChapter: { include: { testSeries: { select: { id: true, title: true } } } } },
          orderBy: { createdAt: "desc" },
          take: 5,
        }),
      ]);

    const [pendingTestSubmissions, pendingChapterSubmissions] = await Promise.all([
      db.testSubmission.count({
        where: { testChapter: { testSeries: { userId } }, status: "SUBMITTED" },
      }),
      db.chapterSubmission.count({
        where: { chapter: { course: { userId } }, status: "SUBMITTED" },
      }),
    ]);

    const studentIds = new Set<string>();
    coursePurchases.forEach((purchase) => studentIds.add(purchase.userId));
    testSeriesPurchases.forEach((purchase) => studentIds.add(purchase.userId));

    const courseRevenue = coursePurchases.reduce(
      (total, purchase) => total + (purchase.course.price || 0),
      0
    );
    const testSeriesRevenue = testSeriesPurchases.reduce(
      (total, purchase) => total + (purchase.testSeries.price || 0),
      0
    );

    const topCourses = courses
      .map((course) => ({
        id: course.id,
        title: course.title,
        enrollments: course._count.purchases,
      }))
      .sort((a, b) => b.enrollments - a.enrollments)
      .slice(0, 5);

    return NextResponse.json({
      totals: {
        courses: courses.length,
        publishedCourses: courses.filter((course) => course.isPublished).length,
        testSeries: testSeries.length,
        publishedTestSeries: testSeries.filter((series) => series.isPublished).length,
        students: studentIds.size,
        pendingSubmissions: pendingTestSubmissions + pendingChapterSubmissions,
        openGoals,
      },
      revenue: {
        coursePurchases: courseRevenue,
        testSeriesPurchases: testSeriesRevenue,
        estimatedTotal: courseRevenue + testSeriesRevenue,
      },
      topCourses,
      recentSubmissions,
    });
  } catch (error) {
    console.log("[TEACHER_STATS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
