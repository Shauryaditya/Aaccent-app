import { Goal, ApiResponse } from '../types';
import apiService from './api';

export const goalService = {
  // Student: Get assigned goals
  getMyGoals: async (params?: {
    isCompleted?: boolean;
  }): Promise<Goal[]> => {
    return apiService.get('/api/goals/student', params);
  },

  // Student: Mark goal as complete
  markGoalComplete: async (goalId: string): Promise<Goal> => {
    return apiService.patch(`/api/goals/${goalId}`, {
      isCompleted: true,
    });
  },

  // Teacher: Get goals created by teacher
  getTeacherGoals: async (): Promise<Goal[]> => {
    return apiService.get('/api/goals/teacher');
  },

  // Teacher: Create goal
  createGoal: async (data: {
    title: string;
    description?: string;
    dueDate: string;
    studentId: string;
    courseId?: string;
    testSeriesId?: string;
  }): Promise<Goal> => {
    return apiService.post('/api/goals', data);
  },

  // Teacher: Update goal
  updateGoal: async (goalId: string, data: Partial<Goal>): Promise<Goal> => {
    return apiService.patch(`/api/goals/${goalId}`, data);
  },

  // Teacher: Delete goal
  deleteGoal: async (goalId: string): Promise<void> => {
    return apiService.delete(`/api/goals/${goalId}`);
  },
};
