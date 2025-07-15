import { useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useRoles } from '../hooks/useRoles';

const Dashboard: React.FC = () => {
  const { user, getCurrentUser } = useAuth();
  const { roles, fetchRoles } = useRoles();

  useEffect(() => {
    // Load current user and roles on component mount
    getCurrentUser();
    fetchRoles();
  }, [getCurrentUser, fetchRoles]);

  return (
    <div className="space-y-6">
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Welcome to RBAC Admin</h2>
        <p className="text-gray-600">
          Manage users, roles, permissions, and view audit logs from this dashboard.
        </p>
      </div>

      {user && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* User Information */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">User Information</h3>
            <div className="space-y-3">
              <div>
                <span className="text-sm text-gray-600">Name:</span>
                <p className="text-gray-900">
                  {user.firstName && user.lastName 
                    ? `${user.firstName} ${user.lastName}`
                    : user.username
                  }
                </p>
              </div>
              <div>
                <span className="text-sm text-gray-600">Email:</span>
                <p className="text-gray-900">{user.email}</p>
              </div>
              <div>
                <span className="text-sm text-gray-600">Status:</span>
                <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                  user.isActive 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {user.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </div>

          {/* Roles Information */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Available Roles</h3>
            <div className="space-y-2">
              {roles.length > 0 ? (
                roles.map((role) => (
                  <div key={role.id} className="flex items-center justify-between p-3 bg-gray-100 rounded-md">
                    <div>
                      <p className="font-medium text-gray-900">{role.name}</p>
                      {role.description && (
                        <p className="text-sm text-gray-600">{role.description}</p>
                      )}
                    </div>
                    <span className="text-xs text-gray-600">
                      {role.permissions.length} permissions
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-gray-600">No roles available</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="btn-primary">
            View Users
          </button>
          <button className="btn-secondary">
            Manage Roles
          </button>
          <button className="btn-secondary">
            View Audit Logs
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 