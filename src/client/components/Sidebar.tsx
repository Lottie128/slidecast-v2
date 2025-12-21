import React, { useState } from 'react';
import { Link, useLocation } from 'react-router';

const Sidebar: React.FC = () => {
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const isActive = (path: string) => location.pathname.startsWith(path);

  return (
    <aside className={`${
      isCollapsed ? 'w-20' : 'w-64'
    } bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 transition-all duration-300`}>
      <div className="p-4 flex justify-between items-center">
        {!isCollapsed && (
          <h2 className="font-bold text-slate-900 dark:text-white">Menu</h2>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
        >
          {isCollapsed ? '→' : '←'}
        </button>
      </div>
      
      <nav className="p-4 space-y-2">
        <Link
          to="/dashboard"
          className={`block px-4 py-3 rounded-lg transition-colors ${
            isActive('/dashboard')
              ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 font-medium'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
          }`}
        >
          <div className="flex items-center gap-3">
            <span className="text-xl">📊</span>
            {!isCollapsed && <span>Dashboard</span>}
          </div>
        </Link>
        
        <Link
          to="/projects"
          className={`block px-4 py-3 rounded-lg transition-colors ${
            isActive('/projects')
              ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 font-medium'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
          }`}
        >
          <div className="flex items-center gap-3">
            <span className="text-xl">🎬</span>
            {!isCollapsed && <span>Projects</span>}
          </div>
        </Link>
      </nav>
    </aside>
  );
};

export default Sidebar;
