import React, { useState, useCallback, useMemo } from 'react';
import { FixedSizeList as List } from 'react-window';
import { useNavigate } from 'react-router-dom';
import { useUsers, useDeleteUser, type User } from '../hooks/useUsers';
import InlineEditor from './InlineEditor';
import BulkOperations from './BulkOperations';

interface UserListProps {
  searchTerm: string;
  statusFilter: 'all' | 'active' | 'inactive';
  onUserSelect: (userId: string) => void;
  selectedUsers: string[];
  onSelectAll: () => void;
  onBulkDelete: () => void;
  onOperationComplete: () => void;
  availableRoles?: string[];
}

const UserList: React.FC<UserListProps> = ({
  searchTerm,
  statusFilter,
  onUserSelect,
  selectedUsers,
  onSelectAll,
  onBulkDelete,
  onOperationComplete,
  availableRoles = []
}) => {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<'name' | 'email' | 'createdAt' | 'status'>('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const { data, isLoading, error, refetch } = useUsers({
    page: currentPage,
    limit: 50, // Increased for virtual scrolling
    search: searchTerm || undefined,
    status: statusFilter
  });

  const deleteUserMutation = useDeleteUser();

  // Memoized sorted users
  const sortedUsers = useMemo(() => {
    if (!data?.users) return [];
    
    return [...data.users].sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortField) {
        case 'name':
          aValue = `${a.firstName} ${a.lastName}`.toLowerCase();
          bValue = `${b.firstName} ${b.lastName}`.toLowerCase();
          break;
        case 'email':
          aValue = a.email.toLowerCase();
          bValue = b.email.toLowerCase();
          break;
        case 'createdAt':
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;
        case 'status':
          aValue = a.isActive ? 1 : 0;
          bValue = b.isActive ? 1 : 0;
          break;
        default:
          return 0;
      }
      
      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
  }, [data?.users, sortField, sortDirection]);

  const handleSort = (field: 'name' | 'email' | 'createdAt' | 'status') => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await deleteUserMutation.mutateAsync(userId);
      } catch (error) {
        console.error('Failed to delete user:', error);
      }
    }
  };

  const handleLoadMore = useCallback(() => {
    if (data?.pagination && currentPage < data.pagination.totalPages) {
      setCurrentPage(prev => prev + 1);
    }
  }, [data?.pagination, currentPage]);

  // Virtual scrolling row renderer
  const Row = useCallback(({ index, style }: { index: number; style: React.CSSProperties }) => {
    const user = sortedUsers[index];
    if (!user) return null;

    return (
      <div style={style} className="flex items-center border-b border-gray-200 hover:bg-gray-50">
        <div className="px-6 py-4 w-12">
          <input
            type="checkbox"
            checked={selectedUsers.includes(user.id)}
            onChange={() => onUserSelect(user.id)}
            className="rounded border-gray-300"
          />
        </div>
        <div className="px-6 py-4 flex-1">
          <div className="flex items-center">
            <div className="flex-shrink-0 h-10 w-10">
              <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                <span className="text-sm font-medium text-gray-700">
                  {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                </span>
              </div>
            </div>
            <div className="ml-4">
              <div className="text-sm font-medium text-gray-900">
                {user.firstName} {user.lastName}
              </div>
              <div className="text-sm text-gray-500">
                @{user.username}
              </div>
            </div>
          </div>
        </div>
        <div className="px-6 py-4 flex-1">
          <div className="text-sm text-gray-900">{user.email}</div>
        </div>
        <div className="px-6 py-4 flex-1">
          <div className="flex flex-wrap gap-1">
            {user.roles.length > 0 ? (
              user.roles.map((role, roleIndex) => (
                <span
                  key={roleIndex}
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                >
                  {role}
                </span>
              ))
            ) : (
              <span className="text-sm text-gray-500">No roles</span>
            )}
          </div>
        </div>
        <div className="px-6 py-4 w-24">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            user.isActive 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            {user.isActive ? 'Active' : 'Inactive'}
          </span>
        </div>
        <div className="px-6 py-4 w-32">
          <div className="text-sm text-gray-500">
            {new Date(user.createdAt).toLocaleDateString()}
          </div>
        </div>
        <div className="px-6 py-4 w-32">
          <div className="flex gap-2">
            <button
              onClick={() => navigate(`/users/${user.id}`)}
              className="text-blue-600 hover:text-blue-900 text-sm"
            >
              View
            </button>
            <button
              onClick={() => navigate(`/users/${user.id}/edit`)}
              className="text-indigo-600 hover:text-indigo-900 text-sm"
            >
              Edit
            </button>
            <button
              onClick={() => handleDeleteUser(user.id)}
              className="text-red-600 hover:text-red-900 text-sm"
              disabled={deleteUserMutation.isPending}
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    );
  }, [sortedUsers, selectedUsers, onUserSelect, navigate, deleteUserMutation.isPending, handleDeleteUser]);

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">Error loading users: {error.message}</p>
        <button 
          onClick={() => refetch()} 
          className="btn-primary mt-4"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Bulk Operations */}
      <BulkOperations
        selectedUsers={selectedUsers}
        onSelectionChange={(userIds) => {
          // Handle bulk selection change
          if (userIds.length === 0) {
            // Clear all selections
            selectedUsers.forEach(id => onUserSelect(id));
          } else {
            // Select specific users
            userIds.forEach(id => {
              if (!selectedUsers.includes(id)) {
                onUserSelect(id);
              }
            });
          }
        }}
        onOperationComplete={onOperationComplete}
        availableRoles={availableRoles}
      />

      {/* Table Header */}
      <div className="bg-gray-50 border-b border-gray-200">
        <div className="flex items-center">
          <div className="px-6 py-3 w-12">
            <input
              type="checkbox"
              checked={data?.users && selectedUsers.length === data.users.length}
              onChange={onSelectAll}
              className="rounded border-gray-300"
            />
          </div>
          <div className="px-6 py-3 flex-1">
            <button
              onClick={() => handleSort('name')}
              className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider hover:text-gray-700 flex items-center"
            >
              User
              {sortField === 'name' && (
                <span className="ml-1">
                  {sortDirection === 'asc' ? '↑' : '↓'}
                </span>
              )}
            </button>
          </div>
          <div className="px-6 py-3 flex-1">
            <button
              onClick={() => handleSort('email')}
              className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider hover:text-gray-700 flex items-center"
            >
              Email
              {sortField === 'email' && (
                <span className="ml-1">
                  {sortDirection === 'asc' ? '↑' : '↓'}
                </span>
              )}
            </button>
          </div>
          <div className="px-6 py-3 flex-1">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
              Roles
            </span>
          </div>
          <div className="px-6 py-3 w-24">
            <button
              onClick={() => handleSort('status')}
              className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider hover:text-gray-700 flex items-center"
            >
              Status
              {sortField === 'status' && (
                <span className="ml-1">
                  {sortDirection === 'asc' ? '↑' : '↓'}
                </span>
              )}
            </button>
          </div>
          <div className="px-6 py-3 w-32">
            <button
              onClick={() => handleSort('createdAt')}
              className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider hover:text-gray-700 flex items-center"
            >
              Created
              {sortField === 'createdAt' && (
                <span className="ml-1">
                  {sortDirection === 'asc' ? '↑' : '↓'}
                </span>
              )}
            </button>
          </div>
          <div className="px-6 py-3 w-32">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </span>
          </div>
        </div>
      </div>

      {/* Virtual Scrolling List */}
      {isLoading && sortedUsers.length === 0 ? (
        <div className="text-center py-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span className="ml-2">Loading users...</span>
          </div>
        </div>
      ) : sortedUsers.length > 0 ? (
        <div className="border border-gray-200 rounded-md">
          <List
            height={600}
            itemCount={sortedUsers.length}
            itemSize={80}
            width="100%"
          >
            {Row}
          </List>
          
          {/* Load More Button */}
          {data?.pagination && currentPage < data.pagination.totalPages && (
            <div className="p-4 text-center border-t border-gray-200">
              <button
                onClick={handleLoadMore}
                className="btn-secondary"
                disabled={isLoading}
              >
                {isLoading ? 'Loading...' : 'Load More'}
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          No users found
        </div>
      )}

      {/* Pagination Info */}
      {data?.pagination && (
        <div className="flex items-center justify-between text-sm text-gray-700">
          <div>
            Showing {((data.pagination.page - 1) * data.pagination.limit) + 1} to{' '}
            {Math.min(data.pagination.page * data.pagination.limit, data.pagination.total)} of{' '}
            {data.pagination.total} results
          </div>
          <div>
            Page {currentPage} of {data.pagination.totalPages}
          </div>
        </div>
      )}
    </div>
  );
};

export default UserList; 