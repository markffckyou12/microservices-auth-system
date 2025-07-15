import React from 'react';

const Permissions: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="card">
        <h2 className="text-xl font-semibold text-text mb-4">Permission Management</h2>
        <p className="text-secondary">
          View and manage system permissions, assign to roles, and configure access rights.
        </p>
      </div>

      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-text">Permissions</h3>
          <button className="btn-primary">Add Permission</button>
        </div>
        
        <div className="text-center py-8">
          <p className="text-secondary">Permission management interface coming soon...</p>
        </div>
      </div>
    </div>
  );
};

export default Permissions; 