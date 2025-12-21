import React from 'react';
import { useNavigate } from 'react-router';

const Navbar: React.FC = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <nav className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 py-4 flex justify-between items-center">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-gradient-to-br from-primary-600 to-secondary-600 rounded-lg flex items-center justify-center">
          <span className="text-white font-bold text-lg">S</span>
        </div>
        <h1 className="text-xl font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
          SlideCast
        </h1>
      </div>
      
      <div className="flex items-center gap-4">
        <button className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors">
          Settings
        </button>
        <button
          onClick={handleLogout}
          className="btn-secondary"
        >
          Logout
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
