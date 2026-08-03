import axios, { AxiosInstance, AxiosError } from 'axios';
import Constants from 'expo-constants';

// Get API base URL from environment
const API_BASE_URL = Constants.expoConfig?.extra?.apiBaseUrl || 'http://localhost:3000';

// Exposed so error messages and the diagnostics panel can name the host they tried.
export const getApiBaseUrl = () => API_BASE_URL;

type AuthTokenGetter = () => Promise<string | null>;

let authTokenGetter: AuthTokenGetter | null = null;

export const setAuthTokenGetter = (getter: AuthTokenGetter | null) => {
  authTokenGetter = getter;
};

export const getAuthToken = async () => {
  return authTokenGetter ? authTokenGetter() : null;
};

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.api.interceptors.request.use(
      async (config) => {
        try {
          const token = authTokenGetter ? await authTokenGetter() : null;
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
          }
        } catch (error) {
          console.error('Error getting auth token:', error);
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for error handling
    this.api.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          // Handle unauthorized - maybe trigger logout
          console.error('Unauthorized access');
        }
        return Promise.reject(error);
      }
    );
  }

  // Generic GET request
  async get<T>(url: string, params?: any): Promise<T> {
    const response = await this.api.get<T>(url, { params });
    return response.data;
  }

  // Generic POST request
  async post<T>(url: string, data?: any): Promise<T> {
    const response = await this.api.post<T>(url, data);
    return response.data;
  }

  // Generic PUT request
  async put<T>(url: string, data?: any): Promise<T> {
    const response = await this.api.put<T>(url, data);
    return response.data;
  }

  // Generic PATCH request
  async patch<T>(url: string, data?: any): Promise<T> {
    const response = await this.api.patch<T>(url, data);
    return response.data;
  }

  // Generic DELETE request
  async delete<T>(url: string): Promise<T> {
    const response = await this.api.delete<T>(url);
    return response.data;
  }

  // Upload file
  async uploadFile(url: string, file: any, onProgress?: (progress: number) => void): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await this.api.post(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(progress);
        }
      },
    });

    return response.data;
  }
}

export const apiService = new ApiService();
export default apiService;


