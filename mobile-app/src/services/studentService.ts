import { StudentProfile, StudentSummary, StudentProgressReport } from '../types';
import apiService from './api';

export const meService = {
  // Which roles the signed-in user is actually allowed to use.
  getMe: async (): Promise<{ userId: string; isTeacher: boolean }> => {
    return apiService.get('/api/me');
  },
};

export const studentService = {
  // Student: read their own profile
  getMyProfile: async (): Promise<StudentProfile | null> => {
    return apiService.get('/api/student/profile');
  },

  // Student: create or update their own profile
  saveMyProfile: async (data: Partial<StudentProfile>): Promise<StudentProfile> => {
    return apiService.post('/api/student/profile', data);
  },

  // Teacher: roster of enrolled students, optionally scoped to one course or test series
  getStudents: async (params?: { courseId?: string; testSeriesId?: string }): Promise<StudentSummary[]> => {
    return apiService.get('/api/students', params);
  },

  // Teacher: full progress report for a single student
  getStudentProgress: async (studentId: string): Promise<StudentProgressReport> => {
    return apiService.get(`/api/students/${studentId}/progress`);
  },
};
