import { ChapterSubmission, TestSubmission, ApiResponse } from '../types';
import apiService from './api';

export const submissionService = {
  // Student: Submit chapter assignment
  submitChapterAssignment: async (
    chapterId: string,
    images: string[]
  ): Promise<ChapterSubmission> => {
    return apiService.post(`/api/submissions/chapters/${chapterId}`, {
      images,
    });
  },

  // Student: Get chapter submissions
  getChapterSubmissions: async (chapterId?: string): Promise<ChapterSubmission[]> => {
    const params = chapterId ? { chapterId } : undefined;
    return apiService.get('/api/submissions/chapters', params);
  },

  // Student: Submit test (descriptive)
  submitTestAssignment: async (
    testChapterId: string,
    pdfUrl: string,
    metadata?: any
  ): Promise<TestSubmission> => {
    return apiService.post(`/api/submissions/tests/${testChapterId}`, {
      pdfUrl,
      ...metadata,
    });
  },

  // Student: Get test submissions
  getTestSubmissions: async (testChapterId?: string): Promise<TestSubmission[]> => {
    const params = testChapterId ? { testChapterId } : undefined;
    return apiService.get('/api/submissions/tests', params);
  },

  // Teacher: Get all chapter submissions
  getAllChapterSubmissions: async (params?: {
    status?: string;
    chapterId?: string;
  }): Promise<ChapterSubmission[]> => {
    return apiService.get('/api/submissions/chapters/all', params);
  },

  // Teacher: Get all test submissions
  getAllTestSubmissions: async (params?: {
    status?: string;
    testChapterId?: string;
  }): Promise<TestSubmission[]> => {
    return apiService.get('/api/submissions/tests/all', params);
  },

  // Teacher: Review chapter submission
  reviewChapterSubmission: async (
    submissionId: string,
    data: {
      status: 'REVIEWED' | 'NEEDS_REVISION';
      feedback?: string;
      annotatedImages?: string[];
    }
  ): Promise<ChapterSubmission> => {
    return apiService.patch(`/api/submissions/chapters/${submissionId}/review`, data);
  },

  // Teacher: Review test submission
  reviewTestSubmission: async (
    submissionId: string,
    data: {
      status: 'REVIEWED' | 'NEEDS_REVISION';
      feedback?: string;
      marksAwarded?: number;
      annotatedPdfUrl?: string;
    }
  ): Promise<TestSubmission> => {
    return apiService.patch(`/api/submissions/tests/${submissionId}/review`, data);
  },
};