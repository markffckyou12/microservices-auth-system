

const Profile: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="card">
        <h2 className="text-xl font-semibold text-text mb-4">User Profile</h2>
        <p className="text-secondary">
          View and edit your profile information, preferences, and account settings.
        </p>
      </div>

      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-text">Profile</h3>
          <button className="btn-primary">Edit Profile</button>
        </div>
        
        <div className="text-center py-8">
          <p className="text-secondary">Profile management interface coming soon...</p>
        </div>
      </div>
    </div>
  );
};

export default Profile; 