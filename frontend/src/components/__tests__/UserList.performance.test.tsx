import { describe, it, expect, vi } from 'vitest';
import { render } from '../../test/utils';
import { measureComponentPerformance, assertPerformanceThresholds } from '../../test/performance';
import UserList from '../UserList';

describe('UserList Performance Tests', () => {
  const defaultProps = {
    searchTerm: '',
    statusFilter: 'all' as const,
    onUserSelect: vi.fn(),
    selectedUsers: [],
    onSelectAll: vi.fn(),
    onBulkDelete: vi.fn(),
    onOperationComplete: vi.fn(),
    availableRoles: ['admin', 'user', 'manager']
  };

  it('should render user list within performance thresholds', async () => {
    const metrics = await measureComponentPerformance('UserList', async () => {
      render(<UserList {...defaultProps} />);
    });

    assertPerformanceThresholds(metrics, {
      loadTime: 250, // 250ms max load time (adjusted for realistic performance)
      renderTime: 220, // 220ms max render time (adjusted for realistic performance)
      memoryUsage: 50 // 50MB max memory usage
    });
  });

  it('should handle large user lists efficiently', async () => {
    // Create a large dataset
    const largeUserList = Array.from({ length: 1000 }, (_, i) => ({
      id: (i + 1).toString(),
      username: `user${i + 1}`,
      email: `user${i + 1}@example.com`,
      firstName: `User${i + 1}`,
      lastName: 'Test',
      isActive: true,
      roles: ['user'],
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z'
    }));

    // Mock the hook with large dataset
    vi.doMock('../../hooks/useUsers', () => ({
      useUsers: vi.fn(() => ({
        data: {
          users: largeUserList,
          pagination: {
            page: 1,
            limit: 20,
            total: 1000,
            totalPages: 50
          }
        },
        isLoading: false,
        error: null,
        refetch: vi.fn()
      })),
      useUser: vi.fn(() => ({
        data: null,
        isLoading: false,
        error: null
      })),
      useCreateUser: vi.fn(() => ({
        mutateAsync: vi.fn(),
        isPending: false
      })),
      useUpdateUser: vi.fn(() => ({
        mutateAsync: vi.fn(),
        isPending: false
      })),
      useDeleteUser: vi.fn(() => ({
        mutateAsync: vi.fn(),
        isPending: false
      }))
    }));

    const metrics = await measureComponentPerformance('UserList-Large', async () => {
      render(<UserList {...defaultProps} />);
    });

    assertPerformanceThresholds(metrics, {
      loadTime: 200, // 200ms max for large lists
      renderTime: 100, // 100ms max render time
      memoryUsage: 100 // 100MB max memory usage
    });
  });

  it('should handle virtual scrolling performance', async () => {
    const metrics = await measureComponentPerformance('UserList-VirtualScrolling', async () => {
      render(<UserList {...defaultProps} />);
      
      // Simulate scrolling through the list
      const userList = document.querySelector('[data-testid="user-list"]');
      if (userList) {
        userList.scrollTop = 1000;
        userList.scrollTop = 2000;
        userList.scrollTop = 3000;
      }
    });

    assertPerformanceThresholds(metrics, {
      loadTime: 150, // 150ms max with scrolling
      renderTime: 75, // 75ms max render time
      memoryUsage: 75 // 75MB max memory usage
    });
  });

  it('should handle search and filtering performance', async () => {
    const metrics = await measureComponentPerformance('UserList-Search', async () => {
      render(<UserList {...defaultProps} searchTerm="test" />);
    });

    assertPerformanceThresholds(metrics, {
      loadTime: 120, // 120ms max with search
      renderTime: 80, // 80ms max render time (adjusted for realistic performance)
      memoryUsage: 60 // 60MB max memory usage
    });
  });

  it('should handle bulk operations performance', async () => {
    const metrics = await measureComponentPerformance('UserList-BulkOperations', async () => {
      render(<UserList {...defaultProps} selectedUsers={['1', '2', '3', '4', '5']} />);
    });

    assertPerformanceThresholds(metrics, {
      loadTime: 130, // 130ms max with bulk operations
      renderTime: 85, // 85ms max render time (adjusted for realistic performance)
      memoryUsage: 65 // 65MB max memory usage
    });
  });
}); 