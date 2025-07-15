// User types
export interface User {
  id: string;
  email: string;
  username: string;
  firstName?: string;
  lastName?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile {
  id: string;
  userId: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  avatar?: string;
  preferences?: UserPreferences;
}

export interface UserPreferences {
  theme?: 'light' | 'dark';
  language?: string;
  notifications?: boolean;
}

// Role and Permission types
export interface Role {
  id: string;
  name: string;
  description?: string;
  permissions: Permission[];
  createdAt: string;
  updatedAt: string;
}

export interface Permission {
  id: string;
  name: string;
  description?: string;
  resource: string;
  action: string;
  createdAt: string;
}

// Audit types
export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  resource: string;
  resourceId?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

export interface AuditFilters {
  userId?: string;
  action?: string;
  resource?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

// Authentication types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: User;
  refreshToken?: string;
}

// API Response types
export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// App State types
export interface AppState {
  auth: {
    isAuthenticated: boolean;
    token: string | null;
    user: User | null;
    loading: boolean;
    error: string | null;
  };
  user: {
    profile: UserProfile | null;
    roles: Role[];
    permissions: Permission[];
    loading: boolean;
    error: string | null;
  };
  roles: {
    list: Role[];
    selected: Role | null;
    loading: boolean;
    error: string | null;
  };
  audit: {
    logs: AuditLog[];
    filters: AuditFilters;
    loading: boolean;
    error: string | null;
  };
}

// Action types for useReducer
export type AppAction =
  | { type: 'AUTH_LOGIN'; payload: { token: string; user: User } }
  | { type: 'AUTH_LOGOUT' }
  | { type: 'AUTH_ERROR'; payload: string }
  | { type: 'USER_LOAD_PROFILE'; payload: UserProfile }
  | { type: 'USER_LOAD_ROLES'; payload: Role[] }
  | { type: 'ROLES_LOAD'; payload: Role[] }
  | { type: 'AUDIT_LOAD_LOGS'; payload: AuditLog[] }
  | { type: 'SET_LOADING'; payload: { section: string; loading: boolean } }
  | { type: 'SET_ERROR'; payload: { section: string; error: string | null } }; 