import { auth } from "@clerk/nextjs";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

const loadTestForOwner = async (testId: string, userId: string) => {
  const test = await db.test.findUnique({
    where: { id: testId },
    include: { testChapter: { include: { testSeries: { select: { userId: true } } } } },
  });

  if (!test) return { test: null, isOwner: false };
  return { test, isOwner: test.testChapter.testSeries.userId === userId };
};

// Owners get the full question bank including correct answers and explanations.
// Anyone else gets the answer key stripped so the payload is safe to hand a student.
export async function GET(req: Request, { params }: { params: { testId: string } }) {
  try {
    const { userId } = auth();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    const { test, isOwner } = await loadTestForOwner(params.testId, userId);
    if (!test) return new NextResponse("Test not found", { status: 404 });
    if (!isOwner && !test.isPublished) {
      return new NextResponse("Test not found", { status: 404 });
    }

    const questions = await db.question.findMany({
      where: { testId: params.testId },
      include: { options: { orderBy: { position: "asc" } } },
      orderBy: { position: "asc" },
    });

    if (isOwner) {
      return NextResponse.json(questions);
    }

    const safeQuestions = questions.map((question) => ({
      ...question,
      explanation: null,
      options: question.options.map(({ isCorrect, ...option }) => option),
    }));

    return NextResponse.json(safeQuestions);
  } catch (error) {
    console.log("[QUESTIONS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

// Teacher: add a question (with its options) to a test they own.
export async function POST(req: Request, { params }: { params: { testId: string } }) {
  try {
    const { userId } = auth();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    const { test, isOwner } = await loadTestForOwner(params.testId, userId);
    if (!test) return new NextResponse("Test not found", { status: 404 });
    if (!isOwner) return new NextResponse("Unauthorized", { status: 403 });

    const {
      questionText,
      questionType,
      marks,
      negativeMarks,
      explanation,
      imageUrl,
      options,
    } = await req.json();

    if (!questionText) {
      return new NextResponse("questionText is required", { status: 400 });
    }

    const type = questionType || "SINGLE_CHOICE";
    const optionList: Array<{ optionText: string; isCorrect?: boolean }> = Array.isArray(options) ? options : [];

    if (type === "SINGLE_CHOICE" || type === "MULTIPLE_CHOICE" || type === "TRUE_FALSE") {
      if (optionList.length < 2) {
        return new NextResponse("Choice questions need at least two options", { status: 400 });
      }
      if (!optionList.some((option) => option.isCorrect)) {
        return new NextResponse("Mark at least one option as correct", { status: 400 });
      }
      if (type === "SINGLE_CHOICE" && optionList.filter((option) => option.isCorrect).length > 1) {
        return new NextResponse("Single choice questions allow only one correct option", { status: 400 });
      }
    }

    const lastQuestion = await db.question.findFirst({
      where: { testId: params.testId },
      orderBy: { position: "desc" },
    });

    const question = await db.question.create({
      data: {
        testId: params.testId,
        questionText,
        questionType: type,
        marks: Number(marks) || 1,
        negativeMarks: Number(negativeMarks) || 0,
        explanation: explanation || null,
        imageUrl: imageUrl || null,
        position: lastQuestion ? lastQuestion.position + 1 : 1,
        options: {
          create: optionList.map((option, index) => ({
            optionText: option.optionText,
            isCorrect: !!option.isCorrect,
            position: index + 1,
          })),
        },
      },
      include: { options: { orderBy: { position: "asc" } } },
    });

    return NextResponse.json(question);
  } catch (error) {
    console.log("[QUESTIONS_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
