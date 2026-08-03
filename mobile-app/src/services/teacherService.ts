import { TeacherStats } from '../types';
import apiService from './api';

export const teacherService = {
  getStats: async (): Promise<TeacherStats> => {
    return apiService.get('/api/teacher/stats');
  },
};
