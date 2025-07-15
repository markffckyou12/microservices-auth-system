

const Audit: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Audit Logs</h2>
        <p className="text-gray-600">
          View system audit logs, track user actions, and monitor security events.
        </p>
      </div>

      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Audit Logs</h3>
          <button className="btn-secondary">Export Logs</button>
        </div>
        
        <div className="text-center py-8">
          <p className="text-gray-600">Audit log viewer coming soon...</p>
        </div>
      </div>
    </div>
  );
};

export default Audit; 