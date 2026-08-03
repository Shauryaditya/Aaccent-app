import { auth, clerkClient } from "@clerk/nextjs";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

// Teacher: full progress report for one of their enrolled students.
export async function GET(req: Request, { params }: { params: { studentId: string } }) {
  try {
    const { userId } = auth();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    const studentId = params.studentId;

    // The teacher may only inspect students enrolled in something they own.
    const [coursePurchases, testSeriesPurchases] = await Promise.all([
      db.purchase.findMany({
        where: { userId: studentId, course: { userId } },
        include: {
          course: {
            select: {
              id: true,
              title: true,
              imageUrl: true,
              chapters: { where: { isPublished: true }, select: { id: true } },
            },
          },
        },
      }),
      db.testSeriesPurchase.findMany({
        where: { userId: studentId, testSeries: { userId } },
        select: { testSeriesId: true },
      }),
    ]);

    if (coursePurchases.length === 0 && testSeriesPurchases.length === 0) {
      return new NextResponse("Student not enrolled with this teacher", { status: 403 });
    }

    const chapterIds = coursePurchases.flatMap((purchase) =>
      purchase.course.chapters.map((chapter) => chapter.id)
    );

    const [progressRows, goals, testSubmissions, chapterSubmissions] = await Promise.all([
      chapterIds.length
        ? db.userProgress.findMany({
            where: { userId: studentId, chapterId: { in: chapterIds }, isCompleted: true },
            select: { chapterId: true },
          })
        : Promise.resolve([]),
      db.goal.findMany({
        where: { studentId, teacherId: userId },
        include: {
          course: { select: { id: true, title: true, imageUrl: true } },
          testSeries: { select: { id: true, title: true, imageUrl: true } },
        },
        orderBy: { dueDate: "asc" },
      }),
      db.testSubmission.findMany({
        where: { userId: studentId, testChapter: { testSeries: { userId } } },
        include: { testChapter: { include: { testSeries: { select: { id: true, title: true } } } } },
        orderBy: { createdAt: "desc" },
      }),
      db.chapterSubmission.findMany({
        where: { userId: studentId, chapter: { course: { userId } } },
        include: { chapter: { include: { course: { select: { id: true, title: true } } } } },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    const completedChapterIds = new Set(progressRows.map((row) => row.chapterId));

    const courses = coursePurchases.map((purchase) => {
      const totalChapters = purchase.course.chapters.length;
      const completedChapters = purchase.course.chapters.filter((chapter) =>
        completedChapterIds.has(chapter.id)
      ).length;

      return {
        courseId: purchase.course.id,
        title: purchase.course.title,
        imageUrl: purchase.course.imageUrl,
        totalChapters,
        completedChapters,
        percentage: totalChapters ? Math.round((completedChapters / totalChapters) * 100) : 0,
      };
    });

    const profile = await db.studentProfile.findUnique({ where: { userId: studentId } });

    let student = {
      id: studentId,
      name: profile?.name || "Student",
      email: "",
      imageUrl: undefined as string | undefined,
      grade: profile?.grade ?? null,
    };

    try {
      const clerkUser = await clerkClient.users.getUser(studentId);
      student = {
        id: studentId,
        name:
          profile?.name ||
          (clerkUser.firstName
            ? `${clerkUser.firstName} ${clerkUser.lastName || ""}`.trim()
            : clerkUser.username || "Student"),
        email: clerkUser.emailAddresses?.[0]?.emailAddress || "",
        imageUrl: clerkUser.imageUrl,
        grade: profile?.grade ?? null,
      };
    } catch (error) {
      console.error("[STUDENT_PROGRESS_GET] Clerk lookup failed:", error);
    }

    const submissionsPending =
      testSubmissions.filter((submission) => submission.status === "SUBMITTED").length +
      chapterSubmissions.filter((submission) => submission.status === "SUBMITTED").length;

    return NextResponse.json({
      student,
      courses,
      goals,
      testSubmissions,
      chapterSubmissions,
      stats: {
        coursesEnrolled: coursePurchases.length,
        testSeriesEnrolled: testSeriesPurchases.length,
        goalsCompleted: goals.filter((goal) => goal.isCompleted).length,
        goalsTotal: goals.length,
        submissionsPending,
      },
    });
  } catch (error) {
    console.log("[STUDENT_PROGRESS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
