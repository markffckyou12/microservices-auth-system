import axios from 'axios';
import type { AxiosInstance, AxiosResponse } from 'axios';
import type { AuthResponse, LoginCredentials, User, Role, AuditLog, AuditFilters } from '../types';

// API client configuration
const apiClient: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3003',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for authentication
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Authentication API
export const authAPI = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/auth/login', credentials);
    return response.data;
  },

  logout: async (): Promise<void> => {
    await apiClient.post('/auth/logout');
  },

  getCurrentUser: async (): Promise<User> => {
    const response = await apiClient.get<User>('/auth/me');
    return response.data;
  },
};

// User API
export const userAPI = {
  getUsers: async (): Promise<User[]> => {
    const response = await apiClient.get<User[]>('/users');
    return response.data;
  },

  getUser: async (id: string): Promise<User> => {
    const response = await apiClient.get<User>(`/users/${id}`);
    return response.data;
  },

  createUser: async (userData: Partial<User>): Promise<User> => {
    const response = await apiClient.post<User>('/users', userData);
    return response.data;
  },

  updateUser: async (id: string, userData: Partial<User>): Promise<User> => {
    const response = await apiClient.put<User>(`/users/${id}`, userData);
    return response.data;
  },

  deleteUser: async (id: string): Promise<void> => {
    await apiClient.delete(`/users/${id}`);
  },
};

// RBAC API
export const rbacAPI = {
  getRoles: async (): Promise<Role[]> => {
    const response = await apiClient.get<Role[]>('/rbac/roles');
    return response.data;
  },

  getRole: async (id: string): Promise<Role> => {
    const response = await apiClient.get<Role>(`/rbac/roles/${id}`);
    return response.data;
  },

  createRole: async (roleData: Partial<Role>): Promise<Role> => {
    const response = await apiClient.post<Role>('/rbac/roles', roleData);
    return response.data;
  },

  updateRole: async (id: string, roleData: Partial<Role>): Promise<Role> => {
    const response = await apiClient.put<Role>(`/rbac/roles/${id}`, roleData);
    return response.data;
  },

  deleteRole: async (id: string): Promise<void> => {
    await apiClient.delete(`/rbac/roles/${id}`);
  },

  assignRole: async (userId: string, roleId: string): Promise<void> => {
    await apiClient.post(`/rbac/users/${userId}/roles`, { roleId });
  },

  removeRole: async (userId: string, roleId: string): Promise<void> => {
    await apiClient.delete(`/rbac/users/${userId}/roles/${roleId}`);
  },
};

// Audit API
export const auditAPI = {
  getLogs: async (filters?: AuditFilters): Promise<AuditLog[]> => {
    const response = await apiClient.get<AuditLog[]>('/audit/logs', {
      params: filters,
    });
    return response.data;
  },

  getLog: async (id: string): Promise<AuditLog> => {
    const response = await apiClient.get<AuditLog>(`/audit/logs/${id}`);
    return response.data;
  },
};

export default apiClient; 