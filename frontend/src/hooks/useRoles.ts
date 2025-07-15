import { useCallback } from 'react';
import { useAppContext } from '../context/AppContext';
import { rbacAPI } from '../utils/api';
import type { Role } from '../types';

export const useRoles = () => {
  const { state, dispatch } = useAppContext();

  const fetchRoles = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', payload: { section: 'roles', loading: true } });
    dispatch({ type: 'SET_ERROR', payload: { section: 'roles', error: null } });

    try {
      const roles = await rbacAPI.getRoles();
      dispatch({ type: 'ROLES_LOAD', payload: roles });
      return roles;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch roles';
      dispatch({ type: 'SET_ERROR', payload: { section: 'roles', error: errorMessage } });
      throw error;
    }
  }, [dispatch]);

  const createRole = useCallback(async (roleData: Partial<Role>) => {
    dispatch({ type: 'SET_LOADING', payload: { section: 'roles', loading: true } });
    dispatch({ type: 'SET_ERROR', payload: { section: 'roles', error: null } });

    try {
      const role = await rbacAPI.createRole(roleData);
      // Refresh the roles list
      await fetchRoles();
      return { success: true, role };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create role';
      dispatch({ type: 'SET_ERROR', payload: { section: 'roles', error: errorMessage } });
      return { success: false, error: errorMessage };
    }
  }, [dispatch, fetchRoles]);

  const updateRole = useCallback(async (id: string, roleData: Partial<Role>) => {
    dispatch({ type: 'SET_LOADING', payload: { section: 'roles', loading: true } });
    dispatch({ type: 'SET_ERROR', payload: { section: 'roles', error: null } });

    try {
      const role = await rbacAPI.updateRole(id, roleData);
      // Refresh the roles list
      await fetchRoles();
      return { success: true, role };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update role';
      dispatch({ type: 'SET_ERROR', payload: { section: 'roles', error: errorMessage } });
      return { success: false, error: errorMessage };
    }
  }, [dispatch, fetchRoles]);

  const deleteRole = useCallback(async (id: string) => {
    dispatch({ type: 'SET_LOADING', payload: { section: 'roles', loading: true } });
    dispatch({ type: 'SET_ERROR', payload: { section: 'roles', error: null } });

    try {
      await rbacAPI.deleteRole(id);
      // Refresh the roles list
      await fetchRoles();
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete role';
      dispatch({ type: 'SET_ERROR', payload: { section: 'roles', error: errorMessage } });
      return { success: false, error: errorMessage };
    }
  }, [dispatch, fetchRoles]);

  const assignRole = useCallback(async (userId: string, roleId: string) => {
    dispatch({ type: 'SET_LOADING', payload: { section: 'roles', loading: true } });
    dispatch({ type: 'SET_ERROR', payload: { section: 'roles', error: null } });

    try {
      await rbacAPI.assignRole(userId, roleId);
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to assign role';
      dispatch({ type: 'SET_ERROR', payload: { section: 'roles', error: errorMessage } });
      return { success: false, error: errorMessage };
    } finally {
      dispatch({ type: 'SET_LOADING', payload: { section: 'roles', loading: false } });
    }
  }, [dispatch]);

  const removeRole = useCallback(async (userId: string, roleId: string) => {
    dispatch({ type: 'SET_LOADING', payload: { section: 'roles', loading: true } });
    dispatch({ type: 'SET_ERROR', payload: { section: 'roles', error: null } });

    try {
      await rbacAPI.removeRole(userId, roleId);
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to remove role';
      dispatch({ type: 'SET_ERROR', payload: { section: 'roles', error: errorMessage } });
      return { success: false, error: errorMessage };
    } finally {
      dispatch({ type: 'SET_LOADING', payload: { section: 'roles', loading: false } });
    }
  }, [dispatch]);

  return {
    roles: state.roles.list,
    selectedRole: state.roles.selected,
    loading: state.roles.loading,
    error: state.roles.error,
    fetchRoles,
    createRole,
    updateRole,
    deleteRole,
    assignRole,
    removeRole,
  };
}; 