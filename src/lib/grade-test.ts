import { QuestionType } from "@prisma/client";

type OptionLike = {
  id: string;
  optionText: string;
  isCorrect: boolean;
};

type QuestionLike = {
  id: string;
  questionType: QuestionType;
  marks: number;
  negativeMarks: number;
  options: OptionLike[];
};

/** Answers are stored as a single string; multi-select uses a comma separated list. */
export const parseSelected = (selectedAnswer?: string | null): string[] =>
  (selectedAnswer ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

/**
 * Numerical questions have no dedicated column in the schema, so the expected value is
 * kept as the `optionText` of a single option flagged correct.
 */
const isNumericalMatch = (expected: string, given: string) => {
  const expectedValue = Number(expected);
  const givenValue = Number(given);

  if (Number.isNaN(expectedValue) || Number.isNaN(givenValue)) {
    return expected.trim().toLowerCase() === given.trim().toLowerCase();
  }

  // Tolerance keeps floating point answers like 0.1+0.2 from being marked wrong.
  return Math.abs(expectedValue - givenValue) < 1e-6;
};

export const isAnswerCorrect = (question: QuestionLike, selectedAnswer?: string | null) => {
  const selected = parseSelected(selectedAnswer);
  if (selected.length === 0) return false;

  const correctOptions = question.options.filter((option) => option.isCorrect);
  if (correctOptions.length === 0) return false;

  if (question.questionType === QuestionType.NUMERICAL) {
    return isNumericalMatch(correctOptions[0].optionText, selected[0]);
  }

  if (question.questionType === QuestionType.MULTIPLE_CHOICE) {
    const correctIds = new Set(correctOptions.map((option) => option.id));
    const selectedIds = new Set(selected);
    if (correctIds.size !== selectedIds.size) return false;
    return Array.from(correctIds).every((id) => selectedIds.has(id));
  }

  // SINGLE_CHOICE and TRUE_FALSE both resolve to one option id.
  return correctOptions.some((option) => option.id === selected[0]);
};

/**
 * Unanswered questions never attract a negative mark — only a wrong attempt does.
 */
export const scoreAnswer = (question: QuestionLike, selectedAnswer?: string | null) => {
  const selected = parseSelected(selectedAnswer);

  if (selected.length === 0) {
    return { isCorrect: false, marksAwarded: 0 };
  }

  const correct = isAnswerCorrect(question, selectedAnswer);

  return {
    isCorrect: correct,
    marksAwarded: correct ? question.marks : -Math.abs(question.negativeMarks ?? 0),
  };
};
