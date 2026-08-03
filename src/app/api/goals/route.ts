import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
    try {
        const { userId } = auth();

        if (!userId) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { title, description, dueDate, studentId, courseId, testSeriesId } = await req.json();

        if (!title || !dueDate || !studentId) {
            return new NextResponse("Missing required fields", { status: 400 });
        }

        if (!courseId && !testSeriesId) {
            return new NextResponse("Either courseId or testSeriesId is required", { status: 400 });
        }

        if (courseId && testSeriesId) {
            return new NextResponse("Provide only one of courseId or testSeriesId", { status: 400 });
        }

        if (courseId) {
            const course = await db.course.findUnique({
                where: { id: courseId, userId },
            });

            if (!course) {
                return new NextResponse("Course not found or unauthorized", { status: 404 });
            }

            const purchase = await db.purchase.findUnique({
                where: { userId_courseId: { userId: studentId, courseId } },
            });

            if (!purchase) {
                return new NextResponse("Student not enrolled in this course", { status: 403 });
            }
        } else {
            const testSeries = await db.testSeries.findUnique({
                where: { id: testSeriesId, userId },
            });

            if (!testSeries) {
                return new NextResponse("Test series not found or unauthorized", { status: 404 });
            }

            const purchase = await db.testSeriesPurchase.findUnique({
                where: { userId_testSeriesId: { userId: studentId, testSeriesId } },
            });

            if (!purchase) {
                return new NextResponse("Student not enrolled in this test series", { status: 403 });
            }
        }

        const goal = await db.goal.create({
            data: {
                title,
                description,
                dueDate: new Date(dueDate),
                studentId,
                teacherId: userId,
                courseId: courseId || null,
                testSeriesId: testSeriesId || null,
            },
            include: {
                course: { select: { id: true, title: true, imageUrl: true } },
                testSeries: { select: { id: true, title: true, imageUrl: true } },
            },
        });

        return NextResponse.json(goal);
    } catch (error) {
        console.error("[GOALS_POST]", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
