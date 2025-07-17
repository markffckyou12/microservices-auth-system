import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUsers, useDeleteUser, type User } from '../hooks/useUsers';
import UserList from '../components/UserList';
import AdvancedFilters from '../components/AdvancedFilters';
import ExportManager from '../components/ExportManager';
import SecurityAudit from '../components/SecurityAudit';
import PerformanceMonitor from '../components/PerformanceMonitor';

const Users: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  const { data, isLoading, error, refetch } = useUsers({
    page: currentPage,
    limit: 20,
    search: searchTerm || undefined,
    status: statusFilter
  });

  const deleteUserMutation = useDeleteUser();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    refetch();
  };

  const handleStatusFilter = (status: 'all' | 'active' | 'inactive') => {
    setStatusFilter(status);
    setCurrentPage(1);
  };

  const handleUserSelect = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSelectAll = () => {
    if (data?.users) {
      setSelectedUsers(prev => 
        prev.length === data.users.length 
          ? [] 
          : data.users.map(user => user.id)
      );
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

  const handleBulkDelete = async () => {
    if (selectedUsers.length === 0) return;
    
    if (window.confirm(`Are you sure you want to delete ${selectedUsers.length} user(s)?`)) {
      try {
        await Promise.all(selectedUsers.map(userId => deleteUserMutation.mutateAsync(userId)));
        setSelectedUsers([]);
      } catch (error) {
        console.error('Failed to delete users:', error);
      }
    }
  };

  if (error) {
    return (
      <div className="space-y-6">
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">User Management</h2>
          <div className="text-center py-8">
            <p className="text-red-600">Error loading users: {error.message}</p>
            <button 
              onClick={() => refetch()} 
              className="btn-primary mt-4"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">User Management</h2>
        <p className="text-gray-600">
          Manage users, assign roles, and view user profiles.
        </p>
      </div>

      {/* Advanced Filters */}
      <div className="card">
        <AdvancedFilters
          onFiltersChange={(filters) => {
            setSearchTerm(filters.search);
            setStatusFilter(filters.status);
            setCurrentPage(1);
            // Additional filter handling can be added here
          }}
          availableRoles={['admin', 'user', 'manager']}
          isLoading={isLoading}
        />
      </div>

      {/* Search and Basic Filters */}
      <div className="card">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-6">
          <form onSubmit={handleSearch} className="flex gap-2 flex-1 max-w-md">
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field flex-1"
            />
            <button type="submit" className="btn-primary">
              Search
            </button>
          </form>

          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => handleStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
              className="input-field"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            
            <ExportManager 
              onExportComplete={(filename) => {
                console.log('Export completed:', filename);
                refetch();
              }}
              availableRoles={['admin', 'user', 'manager']}
            />
            
            <SecurityAudit 
              onAuditComplete={(metrics) => {
                console.log('Security audit completed:', metrics);
              }}
            />
            
            <button 
              onClick={() => navigate('/users/new')}
              className="btn-primary"
            >
              Create User
            </button>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedUsers.length > 0 && (
          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
            <div className="flex items-center justify-between">
              <span className="text-blue-800">
                {selectedUsers.length} user(s) selected
              </span>
              <div className="flex gap-2">
                <button
                  onClick={handleBulkDelete}
                  className="btn-secondary text-red-600 hover:bg-red-50"
                  disabled={deleteUserMutation.isPending}
                >
                  {deleteUserMutation.isPending ? 'Deleting...' : 'Delete Selected'}
                </button>
                <button
                  onClick={() => setSelectedUsers([])}
                  className="btn-secondary"
                >
                  Clear Selection
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced User List with Virtual Scrolling */}
        <UserList
          searchTerm={searchTerm}
          statusFilter={statusFilter}
          onUserSelect={handleUserSelect}
          selectedUsers={selectedUsers}
          onSelectAll={handleSelectAll}
          onBulkDelete={handleBulkDelete}
          onOperationComplete={() => {
            setSelectedUsers([]);
            refetch();
          }}
          availableRoles={['admin', 'user', 'manager']}
        />
      </div>

      {/* Performance Monitor */}
      <PerformanceMonitor />
    </div>
  );
};

export default Users; 