

const Audit: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="card">
        <h2 className="text-xl font-semibold text-text mb-4">Audit Logs</h2>
        <p className="text-secondary">
          View system audit logs, track user actions, and monitor security events.
        </p>
      </div>

      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-text">Audit Logs</h3>
          <button className="btn-secondary">Export Logs</button>
        </div>
        
        <div className="text-center py-8">
          <p className="text-secondary">Audit log viewer coming soon...</p>
        </div>
      </div>
    </div>
  );
};

export default Audit; 