import React from 'react';

const Roles: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="card">
        <h2 className="text-xl font-semibold text-text mb-4">Role Management</h2>
        <p className="text-secondary">
          Create and manage roles, assign permissions, and configure access control.
        </p>
      </div>

      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-text">Roles</h3>
          <button className="btn-primary">Create Role</button>
        </div>
        
        <div className="text-center py-8">
          <p className="text-secondary">Role management interface coming soon...</p>
        </div>
      </div>
    </div>
  );
};

export default Roles; 