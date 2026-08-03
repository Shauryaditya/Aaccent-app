import { Resource } from '../types';
import apiService from './api';

export type ResourceFilters = {
  category?: Resource['category'];
  type?: Resource['type'];
  subject?: string;
  grade?: string;
  year?: number;
  title?: string;
};

export const resourceService = {
  getResources: async (filters?: ResourceFilters): Promise<Resource[]> => {
    return apiService.get('/api/resources', filters);
  },
};
