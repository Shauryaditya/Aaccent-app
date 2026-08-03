import { ChapterSubmission, TestSubmission } from '../types';
import apiService from './api';

export const submissionService = {
  // Chapter submissions are namespaced under their owning course in the backend.
  submitChapterAssignment: async (
    courseId: string,
    chapterId: string,
    images: string[]
  ): Promise<ChapterSubmission> => {
    return apiService.post(`/api/courses/${courseId}/chapters/${chapterId}/submissions`, { images });
  },

  getChapterSubmissions: async (chapterId?: string): Promise<ChapterSubmission[]> => {
    const params = chapterId ? { chapterId } : undefined;
    return apiService.get('/api/submissions/chapters', params);
  },

  submitTestAssignment: async (
    testChapterId: string,
    data: { pdfUrl?: string; imageUrls?: string[]; fileName?: string; fileSize?: number }
  ): Promise<TestSubmission> => {
    return apiService.post(`/api/submissions/tests/${testChapterId}`, data);
  },

  getTestSubmissions: async (testChapterId?: string): Promise<TestSubmission[]> => {
    if (testChapterId) {
      return apiService.get(`/api/submissions/tests/${testChapterId}`);
    }
    return apiService.get('/api/submissions/tests/all');
  },

  getAllChapterSubmissions: async (params?: { status?: string; chapterId?: string }): Promise<ChapterSubmission[]> => {
    return apiService.get('/api/submissions/chapters/all', params);
  },

  getAllTestSubmissions: async (params?: { status?: string; testChapterId?: string }): Promise<TestSubmission[]> => {
    return apiService.get('/api/submissions/tests/all', params);
  },

  reviewChapterSubmission: async (
    submissionId: string,
    data: { status: 'REVIEWED' | 'NEEDS_REVISION'; feedback?: string; annotatedImages?: string[] }
  ): Promise<ChapterSubmission> => {
    return apiService.patch(`/api/submissions/chapters/${submissionId}/review`, data);
  },

  reviewTestSubmission: async (
    submissionId: string,
    data: {
      status: 'REVIEWED' | 'NEEDS_REVISION';
      feedback?: string;
      marksAwarded?: number;
      annotatedPdfUrl?: string;
      annotatedImageUrls?: string[];
    }
  ): Promise<TestSubmission> => {
    // `review` sits before the id: a sibling `[submissionId]` segment would clash
    // with `[testChapterId]` at the same level, which Next.js rejects.
    return apiService.patch(`/api/submissions/tests/review/${submissionId}`, data);
  },
};
