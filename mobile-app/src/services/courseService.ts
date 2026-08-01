import { Attachment, Course, Chapter, Purchase, UserProgress } from '../types';
import apiService from './api';

export const courseService = {
  // Get all published courses
  getCourses: async (params?: {
    categoryId?: string;
    title?: string;
  }): Promise<Course[]> => {
    return apiService.get('/api/courses', params);
  },

  // Get course by ID
  getCourseById: async (courseId: string): Promise<Course> => {
    return apiService.get(`/api/courses/${courseId}`);
  },

  // Get course with progress
  getCourseWithProgress: async (courseId: string): Promise<Course> => {
    return apiService.get(`/api/courses/${courseId}`);
  },

  // Get user's purchased courses
  getPurchasedCourses: async (): Promise<Course[]> => {
    return apiService.get('/api/courses/purchased');
  },

  // Purchase a course
  purchaseCourse: async (courseId: string, paymentData: any): Promise<Purchase> => {
    return apiService.post(`/api/courses/${courseId}/checkout`, paymentData);
  },

  // Get chapters for a course
  getChapters: async (courseId: string): Promise<Chapter[]> => {
    return apiService.get(`/api/courses/${courseId}/chapters`);
  },

  // Get chapter by ID
  getChapterById: async (courseId: string, chapterId: string): Promise<Chapter> => {
    return apiService.get(`/api/courses/${courseId}/chapters/${chapterId}`);
  },

  // Mark chapter as complete
  markChapterComplete: async (courseId: string, chapterId: string): Promise<UserProgress> => {
    return apiService.put(`/api/courses/${courseId}/chapters/${chapterId}/progress`, {
      isCompleted: true,
    });
  },

  // Mark chapter as incomplete
  markChapterIncomplete: async (courseId: string, chapterId: string): Promise<UserProgress> => {
    return apiService.put(`/api/courses/${courseId}/chapters/${chapterId}/progress`, {
      isCompleted: false,
    });
  },

  // Teacher: Get courses owned by current teacher
  getTeacherCourses: async (): Promise<Course[]> => {
    return apiService.get('/api/courses', { mine: true });
  },

  // Teacher: Create course
  createCourse: async (data: Partial<Course>): Promise<Course> => {
    return apiService.post('/api/courses', data);
  },

  // Teacher: Update course
  updateCourse: async (courseId: string, data: Partial<Course>): Promise<Course> => {
    return apiService.patch(`/api/courses/${courseId}`, data);
  },

  // Teacher: Delete course
  deleteCourse: async (courseId: string): Promise<void> => {
    return apiService.delete(`/api/courses/${courseId}`);
  },

  // Teacher: Create chapter
  createChapter: async (courseId: string, data: Partial<Chapter>): Promise<Chapter> => {
    return apiService.post(`/api/courses/${courseId}/chapters`, data);
  },

  // Teacher: Update chapter
  updateChapter: async (courseId: string, chapterId: string, data: Partial<Chapter>): Promise<Chapter> => {
    return apiService.patch(`/api/courses/${courseId}/chapters/${chapterId}`, data);
  },

  // Teacher: Delete chapter
  deleteChapter: async (courseId: string, chapterId: string): Promise<void> => {
    return apiService.delete(`/api/courses/${courseId}/chapters/${chapterId}`);
  },

  // Teacher: Add chapter attachment by URL
  addChapterAttachment: async (
    courseId: string,
    chapterId: string,
    data: { url: string; name?: string }
  ): Promise<Attachment> => {
    return apiService.post(`/api/courses/${courseId}/chapters/${chapterId}/attachments`, data);
  },

  // Teacher: Delete chapter attachment
  deleteChapterAttachment: async (
    courseId: string,
    chapterId: string,
    attachmentId: string
  ): Promise<void> => {
    return apiService.delete(`/api/courses/${courseId}/chapters/${chapterId}/attachments/${attachmentId}`);
  },
  // Teacher: Reorder chapters
  reorderChapters: async (courseId: string, updates: { id: string; position: number }[]): Promise<void> => {
    return apiService.put(`/api/courses/${courseId}/chapters/reorder`, { list: updates });
  },
};



