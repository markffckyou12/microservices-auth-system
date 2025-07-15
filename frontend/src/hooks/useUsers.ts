import { useCallback } from 'react';
import { useAppContext } from '../context/AppContext';
import { userAPI } from '../utils/api';
import type { User } from '../types';

export const useUsers = () => {
  const { state, dispatch } = useAppContext();

  const fetchUsers = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', payload: { section: 'user', loading: true } });
    dispatch({ type: 'SET_ERROR', payload: { section: 'user', error: null } });

    try {
      const users = await userAPI.getUsers();
      // For now, we'll just store the current user's roles
      // In a real app, you might want to store all users
      return users;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch users';
      dispatch({ type: 'SET_ERROR', payload: { section: 'user', error: errorMessage } });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: { section: 'user', loading: false } });
    }
  }, [dispatch]);

  const createUser = useCallback(async (userData: Partial<User>) => {
    dispatch({ type: 'SET_LOADING', payload: { section: 'user', loading: true } });
    dispatch({ type: 'SET_ERROR', payload: { section: 'user', error: null } });

    try {
      const user = await userAPI.createUser(userData);
      return { success: true, user };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create user';
      dispatch({ type: 'SET_ERROR', payload: { section: 'user', error: errorMessage } });
      return { success: false, error: errorMessage };
    } finally {
      dispatch({ type: 'SET_LOADING', payload: { section: 'user', loading: false } });
    }
  }, [dispatch]);

  const updateUser = useCallback(async (id: string, userData: Partial<User>) => {
    dispatch({ type: 'SET_LOADING', payload: { section: 'user', loading: true } });
    dispatch({ type: 'SET_ERROR', payload: { section: 'user', error: null } });

    try {
      const user = await userAPI.updateUser(id, userData);
      return { success: true, user };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update user';
      dispatch({ type: 'SET_ERROR', payload: { section: 'user', error: errorMessage } });
      return { success: false, error: errorMessage };
    } finally {
      dispatch({ type: 'SET_LOADING', payload: { section: 'user', loading: false } });
    }
  }, [dispatch]);

  const deleteUser = useCallback(async (id: string) => {
    dispatch({ type: 'SET_LOADING', payload: { section: 'user', loading: true } });
    dispatch({ type: 'SET_ERROR', payload: { section: 'user', error: null } });

    try {
      await userAPI.deleteUser(id);
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete user';
      dispatch({ type: 'SET_ERROR', payload: { section: 'user', error: errorMessage } });
      return { success: false, error: errorMessage };
    } finally {
      dispatch({ type: 'SET_LOADING', payload: { section: 'user', loading: false } });
    }
  }, [dispatch]);

  return {
    loading: state.user.loading,
    error: state.user.error,
    fetchUsers,
    createUser,
    updateUser,
    deleteUser,
  };
}; 