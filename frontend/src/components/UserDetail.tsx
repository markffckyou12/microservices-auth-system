import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useUser, useDeleteUser } from '../hooks/useUsers';
import InlineEditor from './InlineEditor';
import AdvancedUserDeletion from './AdvancedUserDeletion';

interface UserDetailProps {
  userId: string;
}

const UserDetail: React.FC<UserDetailProps> = ({ userId }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'activity' | 'permissions' | 'sessions'>('overview');
  
  const { data: user, isLoading, error } = useUser(id!);
  const deleteUserMutation = useDeleteUser();

  const handleDeleteUser = async () => {
    if (!user) return;
    
    if (window.confirm(`Are you sure you want to delete ${user.firstName} ${user.lastName}? This action cannot be undone.`)) {
      try {
        await deleteUserMutation.mutateAsync(user.id);
        navigate('/users');
      } catch (error) {
        console.error('Failed to delete user:', error);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-2">Loading user details...</span>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Error loading user: {error?.message || 'User not found'}</p>
        <button 
          onClick={() => navigate('/users')} 
          className="btn-primary mt-4"
        >
          Back to Users
        </button>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '👤' },
    { id: 'activity', label: 'Activity', icon: '📊' },
    { id: 'permissions', label: 'Permissions', icon: '🔐' },
    { id: 'sessions', label: 'Sessions', icon: '💻' }
  ];

  const mockActivity = [
    {
      id: 1,
      type: 'login',
      description: 'User logged in from Chrome on Windows',
      timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
      ip: '192.168.1.100',
      location: 'New York, NY'
    },
    {
      id: 2,
      type: 'profile_update',
      description: 'Updated profile information',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
      ip: '192.168.1.100',
      location: 'New York, NY'
    },
    {
      id: 3,
      type: 'password_change',
      description: 'Password changed successfully',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
      ip: '192.168.1.100',
      location: 'New York, NY'
    }
  ];

  const mockSessions = [
    {
      id: 1,
      device: 'Chrome on Windows',
      ip: '192.168.1.100',
      location: 'New York, NY',
      lastActivity: new Date(Date.now() - 1000 * 60 * 30),
      isActive: true
    },
    {
      id: 2,
      device: 'Safari on iPhone',
      ip: '192.168.1.101',
      location: 'New York, NY',
      lastActivity: new Date(Date.now() - 1000 * 60 * 60 * 2),
      isActive: false
    }
  ];

  const renderOverview = () => (
    <div className="space-y-6">
      {/* User Header */}
      <div className="flex items-center space-x-6">
        <div className="h-20 w-20 rounded-full bg-gray-300 flex items-center justify-center">
          <span className="text-2xl font-bold text-gray-700">
            {user.firstName.charAt(0)}{user.lastName.charAt(0)}
          </span>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {user.firstName} {user.lastName}
          </h1>
          <p className="text-gray-600">@{user.username}</p>
          <p className="text-gray-600">{user.email}</p>
        </div>
        <div className="ml-auto flex space-x-2">
          <button
            onClick={() => navigate(`/users/${user.id}/edit`)}
            className="btn-primary"
          >
            Edit User
          </button>
          <AdvancedUserDeletion
            userId={user.id}
            userData={user}
            onDeletionComplete={() => {
              navigate('/users');
            }}
            onCancel={() => {
              // Handle cancel
            }}
          />
        </div>
      </div>

      {/* User Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-sm font-medium text-gray-500">Status</div>
          <div className="mt-1">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              user.isActive 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {user.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-sm font-medium text-gray-500">Roles</div>
          <div className="mt-1 text-lg font-semibold text-gray-900">
            {user.roles.length || 0}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-sm font-medium text-gray-500">Member Since</div>
          <div className="mt-1 text-lg font-semibold text-gray-900">
            {new Date(user.createdAt).toLocaleDateString()}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-sm font-medium text-gray-500">Last Updated</div>
          <div className="mt-1 text-lg font-semibold text-gray-900">
            {new Date(user.updatedAt).toLocaleDateString()}
          </div>
        </div>
      </div>

      {/* User Details */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">User Details</h3>
        </div>
        <div className="px-6 py-4">
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <dt className="text-sm font-medium text-gray-500">First Name</dt>
              <dd className="mt-1 text-sm text-gray-900">
                <InlineEditor
                  value={user.firstName}
                  field="firstName"
                  userId={user.id}
                  validation={(value) => value.trim().length < 2 ? 'First name must be at least 2 characters' : null}
                />
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Last Name</dt>
              <dd className="mt-1 text-sm text-gray-900">
                <InlineEditor
                  value={user.lastName}
                  field="lastName"
                  userId={user.id}
                  validation={(value) => value.trim().length < 2 ? 'Last name must be at least 2 characters' : null}
                />
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Username</dt>
              <dd className="mt-1 text-sm text-gray-900">
                <InlineEditor
                  value={user.username}
                  field="username"
                  userId={user.id}
                  validation={(value) => value.trim().length < 3 ? 'Username must be at least 3 characters' : null}
                />
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Email Address</dt>
              <dd className="mt-1 text-sm text-gray-900">
                <InlineEditor
                  value={user.email}
                  field="email"
                  userId={user.id}
                  type="email"
                  validation={(value) => {
                    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                    return !emailRegex.test(value) ? 'Please enter a valid email address' : null;
                  }}
                />
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Status</dt>
              <dd className="mt-1 text-sm text-gray-900">
                <InlineEditor
                  value={user.isActive ? 'active' : 'inactive'}
                  field="status"
                  userId={user.id}
                  type="select"
                  options={[
                    { value: 'active', label: 'Active' },
                    { value: 'inactive', label: 'Inactive' }
                  ]}
                />
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">User ID</dt>
              <dd className="mt-1 text-sm text-gray-900 font-mono">{user.id}</dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Roles */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Roles & Permissions</h3>
        </div>
        <div className="px-6 py-4">
          {user.roles.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {user.roles.map((role, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                >
                  {role}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No roles assigned</p>
          )}
        </div>
      </div>
    </div>
  );

  const renderActivity = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
        </div>
        <div className="px-6 py-4">
          <div className="flow-root">
            <ul className="-mb-8">
              {mockActivity.map((activity, activityIdx) => (
                <li key={activity.id}>
                  <div className="relative pb-8">
                    {activityIdx !== mockActivity.length - 1 ? (
                      <span
                        className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                        aria-hidden="true"
                      />
                    ) : null}
                    <div className="relative flex space-x-3">
                      <div>
                        <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white ${
                          activity.type === 'login' ? 'bg-green-500' :
                          activity.type === 'profile_update' ? 'bg-blue-500' :
                          'bg-yellow-500'
                        }`}>
                          {activity.type === 'login' && '🔐'}
                          {activity.type === 'profile_update' && '✏️'}
                          {activity.type === 'password_change' && '🔑'}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                        <div>
                          <p className="text-sm text-gray-500">
                            {activity.description}
                          </p>
                          <p className="text-xs text-gray-400">
                            {activity.ip} • {activity.location}
                          </p>
                        </div>
                        <div className="text-right text-sm whitespace-nowrap text-gray-500">
                          <time dateTime={activity.timestamp.toISOString()}>
                            {activity.timestamp.toLocaleString()}
                          </time>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );

  const renderPermissions = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Permission Matrix</h3>
        </div>
        <div className="px-6 py-4">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Resource
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Read
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Write
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Delete
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Admin
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {['users', 'roles', 'permissions', 'audit'].map((resource) => (
                  <tr key={resource}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 capitalize">
                      {resource}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input type="checkbox" className="rounded border-gray-300" defaultChecked={resource === 'users'} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input type="checkbox" className="rounded border-gray-300" defaultChecked={resource === 'users'} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input type="checkbox" className="rounded border-gray-300" />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input type="checkbox" className="rounded border-gray-300" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSessions = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Active Sessions</h3>
        </div>
        <div className="px-6 py-4">
          <div className="space-y-4">
            {mockSessions.map((session) => (
              <div key={session.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                    <span className="text-sm font-medium text-gray-700">💻</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{session.device}</p>
                    <p className="text-xs text-gray-500">{session.ip} • {session.location}</p>
                    <p className="text-xs text-gray-500">
                      Last activity: {session.lastActivity.toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {session.isActive && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Active
                    </span>
                  )}
                  <button className="text-red-600 hover:text-red-900 text-sm">
                    Revoke
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">User Details</h2>
            <p className="text-gray-600">Manage user information and permissions</p>
          </div>
          <button
            onClick={() => navigate('/users')}
            className="btn-secondary"
          >
            Back to Users
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="card">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="mt-6">
          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'activity' && renderActivity()}
          {activeTab === 'permissions' && renderPermissions()}
          {activeTab === 'sessions' && renderSessions()}
        </div>
      </div>
    </div>
  );
};

export default UserDetail; 