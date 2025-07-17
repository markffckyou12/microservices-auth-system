import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { render } from '../../test/utils';
import Users from '../Users';

// Mock the hooks
vi.mock('../../hooks/useUsers', () => ({
  useUsers: vi.fn(() => ({
    data: {
      users: [
        {
          id: '1',
          username: 'john.doe',
          email: 'john.doe@example.com',
          firstName: 'John',
          lastName: 'Doe',
          isActive: true,
          roles: ['user'],
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z'
        }
      ],
      pagination: {
        page: 1,
        limit: 20,
        total: 1,
        totalPages: 1
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

vi.mock('../../hooks/useRoles', () => ({
  useRoles: vi.fn(() => ({
    data: ['admin', 'user', 'manager'],
    isLoading: false,
    error: null
  }))
}));

describe('Users Page', () => {
  it('renders users page with search and filters', () => {
    render(<Users />);
    
    expect(screen.getByText('User Management')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Search users...')).toBeInTheDocument();
    // Status filter is a select with option 'All Status'
    expect(screen.getByRole('option', { name: 'All Status' })).toBeInTheDocument();
  });

  it('displays user list', () => {
    render(<Users />);
    
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('@john.doe')).toBeInTheDocument();
    expect(screen.getByText('john.doe@example.com')).toBeInTheDocument();
  });

  it('handles search input', async () => {
    render(<Users />);
    
    const searchInput = screen.getByPlaceholderText('Search users...');
    fireEvent.change(searchInput, { target: { value: 'john' } });
    
    await waitFor(() => {
      expect(searchInput).toHaveValue('john');
    });
  });

  it('handles status filter', () => {
    render(<Users />);
    // Status filter is a select element
    const statusSelect = screen.getByRole('combobox');
    fireEvent.change(statusSelect, { target: { value: 'active' } });
    expect(statusSelect).toHaveValue('active');
  });

  it('shows create user button', () => {
    render(<Users />);
    expect(screen.getByText('Create User')).toBeInTheDocument();
  });

  it('shows export button', () => {
    render(<Users />);
    // Button text is 'Export Users'
    expect(screen.getByText(/Export Users/i)).toBeInTheDocument();
  });

  it('shows performance monitor', () => {
    render(<Users />);
    // Performance Monitor is a button with title
    expect(screen.getByTitle('Show Performance Monitor')).toBeInTheDocument();
  });

  it('shows security audit', () => {
    render(<Users />);
    // Button text is 'Security Audit'
    expect(screen.getByText(/Security Audit/i)).toBeInTheDocument();
  });
}); 