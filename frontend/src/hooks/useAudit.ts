import { useCallback } from 'react';
import { useAppContext } from '../context/AppContext';
import { auditAPI } from '../utils/api';
import type { AuditFilters } from '../types';

export const useAudit = () => {
  const { state, dispatch } = useAppContext();

  const fetchLogs = useCallback(async (filters?: AuditFilters) => {
    dispatch({ type: 'SET_LOADING', payload: { section: 'audit', loading: true } });
    dispatch({ type: 'SET_ERROR', payload: { section: 'audit', error: null } });

    try {
      const logs = await auditAPI.getLogs(filters);
      dispatch({ type: 'AUDIT_LOAD_LOGS', payload: logs });
      return logs;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch audit logs';
      dispatch({ type: 'SET_ERROR', payload: { section: 'audit', error: errorMessage } });
      throw error;
    }
  }, [dispatch]);

  const getLog = useCallback(async (id: string) => {
    dispatch({ type: 'SET_LOADING', payload: { section: 'audit', loading: true } });
    dispatch({ type: 'SET_ERROR', payload: { section: 'audit', error: null } });

    try {
      const log = await auditAPI.getLog(id);
      return log;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch audit log';
      dispatch({ type: 'SET_ERROR', payload: { section: 'audit', error: errorMessage } });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: { section: 'audit', loading: false } });
    }
  }, [dispatch]);

  return {
    logs: state.audit.logs,
    filters: state.audit.filters,
    loading: state.audit.loading,
    error: state.audit.error,
    fetchLogs,
    getLog,
  };
}; 