import { TestSeries, TestChapter, Test, Question, Attachment, TestAttempt } from '../types';
import apiService from './api';

export const attemptService = {
  // Start a test, or resume the one already in progress (one attempt per test).
  start: async (testId: string): Promise<TestAttempt & { resumed: boolean }> => {
    return apiService.post(`/api/tests/${testId}/attempt`);
  },

  // Full attempt. The answer key is only included once the attempt is submitted.
  get: async (attemptId: string): Promise<TestAttempt> => {
    return apiService.get(`/api/attempts/${attemptId}`);
  },

  // Save one answer. Pass null to clear it.
  saveAnswer: async (
    attemptId: string,
    questionId: string,
    selectedAnswer: string | null
  ): Promise<{ id: string; questionId: string; selectedAnswer: string | null }> => {
    return apiService.put(`/api/attempts/${attemptId}/answers`, { questionId, selectedAnswer });
  },

  // Submit and grade. Safe to call twice — the score is computed once.
  complete: async (attemptId: string): Promise<TestAttempt & { alreadySubmitted: boolean }> => {
    return apiService.post(`/api/attempts/${attemptId}/complete`);
  },
};

export const testService = {
  // Get all published test series
  getTestSeries: async (params?: {
    categoryId?: string;
    title?: string;
    mine?: boolean;
  }): Promise<TestSeries[]> => {
    return apiService.get('/api/testseries', params);
  },

  // Get test series by ID
  getTestSeriesById: async (testSeriesId: string): Promise<TestSeries> => {
    return apiService.get(`/api/testseries/${testSeriesId}`);
  },

  // Get test chapters
  getTestChapters: async (testSeriesId: string): Promise<TestChapter[]> => {
    return apiService.get(`/api/testseries/${testSeriesId}/testChapter`);
  },

  // Get tests for a chapter. Owners also receive unpublished drafts.
  getTests: async (testChapterId: string): Promise<Test[]> => {
    return apiService.get('/api/tests', { testChapterId });
  },

  // Get test by ID
  getTestById: async (testId: string): Promise<Test> => {
    return apiService.get(`/api/tests/${testId}`);
  },

  // Get a test's questions. The answer key is stripped for non-owners.
  getQuestions: async (testId: string): Promise<Question[]> => {
    return apiService.get(`/api/tests/${testId}/questions`);
  },

  // Teacher: Get test series owned by current teacher
  getTeacherTestSeries: async (): Promise<TestSeries[]> => {
    return apiService.get('/api/testseries', { mine: true });
  },

  // Teacher: Create test chapter
  createTestChapter: async (testSeriesId: string, data: Partial<TestChapter>): Promise<TestChapter> => {
    return apiService.post(`/api/testseries/${testSeriesId}/testChapter`, data);
  },

  // Teacher: Update test chapter
  updateTestChapter: async (
    testSeriesId: string,
    testChapterId: string,
    data: Partial<TestChapter>
  ): Promise<TestChapter> => {
    return apiService.patch(`/api/testseries/${testSeriesId}/testChapter/${testChapterId}`, data);
  },

  // Teacher: Delete test chapter
  deleteTestChapter: async (testSeriesId: string, testChapterId: string): Promise<void> => {
    return apiService.delete(`/api/testseries/${testSeriesId}/testChapter/${testChapterId}`);
  },

  // Teacher: Add test chapter attachment/question paper
  addTestChapterAttachment: async (
    testSeriesId: string,
    testChapterId: string,
    data: { url: string; name?: string }
  ): Promise<Attachment> => {
    return apiService.post(`/api/testseries/${testSeriesId}/testChapter/${testChapterId}/attachments`, data);
  },

  // Teacher: Delete test chapter attachment/question paper
  deleteTestChapterAttachment: async (
    testSeriesId: string,
    testChapterId: string,
    attachmentId: string
  ): Promise<void> => {
    return apiService.delete(`/api/testseries/${testSeriesId}/testChapter/${testChapterId}/attachments/${attachmentId}`);
  },

  // Teacher: Create test series
  createTestSeries: async (data: Partial<TestSeries>): Promise<TestSeries> => {
    return apiService.post('/api/testseries', data);
  },

  // Teacher: Update test series
  updateTestSeries: async (testSeriesId: string, data: Partial<TestSeries>): Promise<TestSeries> => {
    return apiService.patch(`/api/testseries/${testSeriesId}`, data);
  },

  // Teacher: Create a test inside a test chapter
  createTest: async (
    testChapterId: string,
    data: {
      title: string;
      description?: string;
      duration?: number;
      totalMarks?: number;
      passingMarks?: number | null;
      testMode?: Test['testMode'];
      isFree?: boolean;
    }
  ): Promise<Test> => {
    return apiService.post('/api/tests', { testChapterId, ...data });
  },

  // Teacher: Update a test (publish/unpublish goes through isPublished)
  updateTest: async (testId: string, data: Partial<Test>): Promise<Test> => {
    return apiService.patch(`/api/tests/${testId}`, data);
  },

  // Teacher: Delete a test
  deleteTest: async (testId: string): Promise<void> => {
    return apiService.delete(`/api/tests/${testId}`);
  },

  // Teacher: Create a question with its options
  createQuestion: async (
    testId: string,
    data: {
      questionText: string;
      questionType: Question['questionType'];
      marks: number;
      negativeMarks?: number;
      explanation?: string;
      imageUrl?: string;
      options?: Array<{ optionText: string; isCorrect: boolean }>;
    }
  ): Promise<Question> => {
    return apiService.post(`/api/tests/${testId}/questions`, data);
  },

  // Teacher: Update a question. Supplying options replaces the existing set.
  updateQuestion: async (
    questionId: string,
    data: Omit<Partial<Question>, 'options'> & { options?: Array<{ optionText: string; isCorrect: boolean }> }
  ): Promise<Question> => {
    return apiService.patch(`/api/questions/${questionId}`, data);
  },

  // Teacher: Delete a question
  deleteQuestion: async (questionId: string): Promise<void> => {
    return apiService.delete(`/api/questions/${questionId}`);
  },
};
