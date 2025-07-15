import { createContext, useContext, useReducer } from 'react';
import type { ReactNode } from 'react';
import type { AppState, AppAction } from '../types';

// Initial state
const initialState: AppState = {
  auth: {
    isAuthenticated: false,
    token: localStorage.getItem('token'),
    user: null,
    loading: false,
    error: null,
  },
  user: {
    profile: null,
    roles: [],
    permissions: [],
    loading: false,
    error: null,
  },
  roles: {
    list: [],
    selected: null,
    loading: false,
    error: null,
  },
  audit: {
    logs: [],
    filters: {},
    loading: false,
    error: null,
  },
};

// Reducer function
const appReducer = (state: AppState, action: AppAction): AppState => {
  switch (action.type) {
    case 'AUTH_LOGIN':
      return {
        ...state,
        auth: {
          ...state.auth,
          isAuthenticated: true,
          token: action.payload.token,
          user: action.payload.user,
          loading: false,
          error: null,
        },
      };

    case 'AUTH_LOGOUT':
      return {
        ...state,
        auth: {
          ...state.auth,
          isAuthenticated: false,
          token: null,
          user: null,
          loading: false,
          error: null,
        },
        user: {
          ...state.user,
          profile: null,
          roles: [],
          permissions: [],
        },
      };

    case 'AUTH_ERROR':
      return {
        ...state,
        auth: {
          ...state.auth,
          loading: false,
          error: action.payload,
        },
      };

    case 'USER_LOAD_PROFILE':
      return {
        ...state,
        user: {
          ...state.user,
          profile: action.payload,
          loading: false,
          error: null,
        },
      };

    case 'USER_LOAD_ROLES':
      return {
        ...state,
        user: {
          ...state.user,
          roles: action.payload,
          loading: false,
          error: null,
        },
      };

    case 'ROLES_LOAD':
      return {
        ...state,
        roles: {
          ...state.roles,
          list: action.payload,
          loading: false,
          error: null,
        },
      };

    case 'AUDIT_LOAD_LOGS':
      return {
        ...state,
        audit: {
          ...state.audit,
          logs: action.payload,
          loading: false,
          error: null,
        },
      };

    case 'SET_LOADING':
      return {
        ...state,
        [action.payload.section]: {
          ...state[action.payload.section as keyof AppState],
          loading: action.payload.loading,
        },
      };

    case 'SET_ERROR':
      return {
        ...state,
        [action.payload.section]: {
          ...state[action.payload.section as keyof AppState],
          error: action.payload.error,
        },
      };

    default:
      return state;
  }
};

// Context
const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
} | null>(null);

// Provider component
export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
};

// Custom hook to use the context
export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within AppProvider');
  }
  return context;
}; 