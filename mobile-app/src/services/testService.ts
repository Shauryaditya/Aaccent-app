import { TestSeries, TestChapter, Test, Question, TestAttempt, Answer, ApiResponse } from '../types';
import apiService from './api';

export const testService = {
  // Get all published test series
  getTestSeries: async (params?: {
    categoryId?: string;
    title?: string;
  }): Promise<TestSeries[]> => {
    return apiService.get('/api/testseries', params);
  },

  // Get test series by ID
  getTestSeriesById: async (testSeriesId: string): Promise<TestSeries> => {
    return apiService.get(`/api/testseries/${testSeriesId}`);
  },

  // Get test chapters
  getTestChapters: async (testSeriesId: string): Promise<TestChapter[]> => {
    return apiService.get(`/api/testseries/${testSeriesId}/chapters`);
  },

  // Get tests for a chapter
  getTests: async (testChapterId: string): Promise<Test[]> => {
    return apiService.get(`/api/testseries/chapters/${testChapterId}/tests`);
  },

  // Get test by ID
  getTestById: async (testId: string): Promise<Test> => {
    return apiService.get(`/api/testseries/tests/${testId}`);
  },

  // Get test with questions
  getTestWithQuestions: async (testId: string): Promise<Test> => {
    return apiService.get(`/api/testseries/tests/${testId}/questions`);
  },

  // Start test attempt
  startTestAttempt: async (testId: string): Promise<TestAttempt> => {
    return apiService.post(`/api/testseries/tests/${testId}/attempt`);
  },

  // Submit answer
  submitAnswer: async (
    attemptId: string,
    questionId: string,
    answer: string
  ): Promise<Answer> => {
    return apiService.post(`/api/testseries/attempts/${attemptId}/answers`, {
      questionId,
      selectedAnswer: answer,
    });
  },

  // Complete test attempt
  completeTestAttempt: async (attemptId: string): Promise<TestAttempt> => {
    return apiService.post(`/api/testseries/attempts/${attemptId}/complete`);
  },

  // Get test attempt with results
  getTestAttempt: async (attemptId: string): Promise<TestAttempt> => {
    return apiService.get(`/api/testseries/attempts/${attemptId}`);
  },

  // Get user's test attempts
  getUserAttempts: async (testId?: string): Promise<TestAttempt[]> => {
    const params = testId ? { testId } : undefined;
    return apiService.get('/api/testseries/attempts', params);
  },

  // Teacher: Create test series
  createTestSeries: async (data: Partial<TestSeries>): Promise<TestSeries> => {
    return apiService.post('/api/testseries', data);
  },

  // Teacher: Update test series
  updateTestSeries: async (testSeriesId: string, data: Partial<TestSeries>): Promise<TestSeries> => {
    return apiService.patch(`/api/testseries/${testSeriesId}`, data);
  },

  // Teacher: Create test
  createTest: async (testChapterId: string, data: Partial<Test>): Promise<Test> => {
    return apiService.post(`/api/testseries/chapters/${testChapterId}/tests`, data);
  },

  // Teacher: Create question
  createQuestion: async (testId: string, data: Partial<Question>): Promise<Question> => {
    return apiService.post(`/api/testseries/tests/${testId}/questions`, data);
  },

  // Teacher: Update question
  updateQuestion: async (questionId: string, data: Partial<Question>): Promise<Question> => {
    return apiService.patch(`/api/testseries/questions/${questionId}`, data);
  },
};