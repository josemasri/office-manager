import React from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Layout = () => {
  const { user, logout, isAdmin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => {
    return location.pathname === path ? 'bg-blue-700 text-white' : 'text-blue-100 hover:bg-blue-600';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-blue-600 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-white text-xl font-bold">Administrador de Oficina</h1>
              </div>
              <div className="hidden md:block">
                <div className="ml-10 flex items-baseline space-x-4">
                  <Link
                    to="/dashboard"
                    className={`px-3 py-2 rounded-md text-sm font-medium ${isActive('/dashboard')}`}
                  >
                    Panel Principal
                  </Link>
                  <Link
                    to="/rooms"
                    className={`px-3 py-2 rounded-md text-sm font-medium ${isActive('/rooms')}`}
                  >
                    Salas y Reservaciones
                  </Link>
                  {isAdmin && (
                    <Link
                      to="/admin"
                      className={`px-3 py-2 rounded-md text-sm font-medium ${isActive('/admin')}`}
                    >
                      Panel de Administración
                    </Link>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center">
              <div className="flex items-center space-x-4">
                <span className="text-white text-sm">
                  Bienvenido, {user?.firstName} {user?.lastName}
                </span>
                <Link
                  to="/profile"
                  className={`px-3 py-2 rounded-md text-sm font-medium ${isActive('/profile')}`}
                >
                  Perfil
                </Link>
                <button
                  onClick={handleLogout}
                  className="text-blue-100 hover:bg-blue-600 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Cerrar Sesión
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;