
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const Layout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navigationItems = [
    { name: 'Dashboard', path: '/dashboard', icon: '📊' },
    { name: 'Users', path: '/users', icon: '👥' },
    { name: 'Roles', path: '/roles', icon: '🔐' },
    { name: 'Permissions', path: '/permissions', icon: '🔑' },
    { name: 'Audit Logs', path: '/audit', icon: '📝' },
    { name: 'Profile', path: '/profile', icon: '👤' },
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="sidebar">
        <div className="p-6">
          <h1 className="text-xl font-semibold text-text">RBAC Admin</h1>
        </div>
        
        <nav className="mt-6">
          <ul className="space-y-2">
            {navigationItems.map((item) => (
              <li key={item.path}>
                <button
                  onClick={() => navigate(item.path)}
                  className={`w-full text-left px-6 py-3 flex items-center space-x-3 hover:bg-gray-100 transition-colors ${
                    location.pathname === item.path
                      ? 'bg-blue-500 text-white'
                      : 'text-gray-900'
                  }`}
                >
                  <span>{item.icon}</span>
                  <span>{item.name}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex justify-between items-center">
                          <h2 className="text-lg font-semibold text-gray-900">
              {navigationItems.find(item => item.path === location.pathname)?.name || 'Dashboard'}
            </h2>
            
            <div className="flex items-center space-x-4">
              {user && (
                <span className="text-gray-900">
                  Welcome, {user.firstName || user.username}
                </span>
              )}
              <button
                onClick={handleLogout}
                className="btn-secondary text-sm"
              >
                Logout
              </button>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout; 