import React from 'react';

const Users: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="card">
        <h2 className="text-xl font-semibold text-text mb-4">User Management</h2>
        <p className="text-secondary">
          Manage users, assign roles, and view user profiles.
        </p>
      </div>

      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-text">Users</h3>
          <button className="btn-primary">Add User</button>
        </div>
        
        <div className="text-center py-8">
          <p className="text-secondary">User management interface coming soon...</p>
        </div>
      </div>
    </div>
  );
};

export default Users; 