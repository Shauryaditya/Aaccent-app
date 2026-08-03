import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
    try {
        const { userId } = auth();

        if (!userId) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const studentId = searchParams.get("studentId") || undefined;
        const isCompleted = searchParams.get("isCompleted");

        const goals = await db.goal.findMany({
            where: {
                teacherId: userId,
                ...(studentId ? { studentId } : {}),
                ...(isCompleted !== null ? { isCompleted: isCompleted === "true" } : {}),
            },
            include: {
                course: { select: { id: true, title: true, imageUrl: true } },
                testSeries: { select: { id: true, title: true, imageUrl: true } },
            },
            orderBy: {
                dueDate: "asc",
            },
        });

        return NextResponse.json(goals);
    } catch (error) {
        console.error("[TEACHER_GOALS_GET]", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
