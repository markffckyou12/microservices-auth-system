import { useCallback } from 'react';
import { useAppContext } from '../context/AppContext';
import { authAPI } from '../utils/api';
import type { LoginCredentials } from '../types';

export const useAuth = () => {
  const { state, dispatch } = useAppContext();

  const login = useCallback(async (credentials: LoginCredentials) => {
    dispatch({ type: 'SET_LOADING', payload: { section: 'auth', loading: true } });
    dispatch({ type: 'SET_ERROR', payload: { section: 'auth', error: null } });

    try {
      const response = await authAPI.login(credentials);
      const { token, user } = response;

      // Store token
      localStorage.setItem('token', token);

      dispatch({ type: 'AUTH_LOGIN', payload: { token, user } });
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      dispatch({ type: 'AUTH_ERROR', payload: errorMessage });
      return { success: false, error: errorMessage };
    }
  }, [dispatch]);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    dispatch({ type: 'AUTH_LOGOUT' });
  }, [dispatch]);

  const getCurrentUser = useCallback(async () => {
    if (!state.auth.token) return null;

    dispatch({ type: 'SET_LOADING', payload: { section: 'auth', loading: true } });
    dispatch({ type: 'SET_ERROR', payload: { section: 'auth', error: null } });

    try {
      const user = await authAPI.getCurrentUser();
      dispatch({ type: 'AUTH_LOGIN', payload: { token: state.auth.token!, user } });
      return user;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get current user';
      dispatch({ type: 'AUTH_ERROR', payload: errorMessage });
      return null;
    }
  }, [state.auth.token, dispatch]);

  return {
    isAuthenticated: state.auth.isAuthenticated,
    user: state.auth.user,
    loading: state.auth.loading,
    error: state.auth.error,
    login,
    logout,
    getCurrentUser,
  };
}; 