import { db } from "@/lib/db";

/**
 * A student may take a test if it is published and either free or covered by a
 * purchase of its parent test series. The owning teacher always has access.
 */
export const loadTestForTaker = async (testId: string, userId: string) => {
  const test = await db.test.findUnique({
    where: { id: testId },
    include: {
      testChapter: {
        include: { testSeries: { select: { id: true, userId: true, isPublished: true } } },
      },
    },
  });

  if (!test) return { test: null, canTake: false, isOwner: false };

  const isOwner = test.testChapter.testSeries.userId === userId;
  if (isOwner) return { test, canTake: true, isOwner };

  if (!test.isPublished) return { test, canTake: false, isOwner };

  if (test.isFree) return { test, canTake: true, isOwner };

  const purchase = await db.testSeriesPurchase.findUnique({
    where: {
      userId_testSeriesId: { userId, testSeriesId: test.testChapter.testSeries.id },
    },
  });

  return { test, canTake: !!purchase, isOwner };
};
