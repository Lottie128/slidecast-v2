import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from '../utils/toast';

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    // Check if user is logged in
    const userStr = localStorage.getItem('slidecast_current_user');
    if (!userStr) {
      toast.error('Please login first');
      navigate('/login');
      return;
    }
    
    const user = JSON.parse(userStr);
    setCurrentUser(user);
    loadProjects();
  }, [navigate]);

  const loadProjects = () => {
    try {
      const projectsList = JSON.parse(localStorage.getItem('projects') || '[]');
      setProjects(projectsList);
    } catch (error) {
      console.error('Failed to load projects:', error);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  const createProject = () => {
    const newProjectId = `project_${Date.now()}`;
    navigate(`/editor/${newProjectId}`);
  };

  const handleLogout = () => {
    localStorage.removeItem('slidecast_current_user');
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const deleteProject = (projectId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this project?')) {
      const updatedProjects = projects.filter(p => p.id !== projectId);
      setProjects(updatedProjects);
      localStorage.setItem('projects', JSON.stringify(updatedProjects));
      localStorage.removeItem(`project_${projectId}`);
      toast.success('Project deleted');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      <header className="bg-white/10 backdrop-blur-lg border-b border-white/20 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🎬</span>
            <h1 className="text-2xl font-bold">SlideCast V2</h1>
          </div>
          <div className="flex items-center gap-4">
            {currentUser && (
              <div className="flex items-center gap-3 px-4 py-2 bg-white/10 rounded-lg">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center font-bold">
                  {currentUser.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="text-sm">
                  <p className="font-semibold">{currentUser.name}</p>
                  <p className="text-xs text-gray-400">{currentUser.email}</p>
                </div>
              </div>
            )}
            <button
              onClick={createProject}
              className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-lg font-semibold transition-all shadow-lg hover:shadow-purple-500/50"
            >
              + New Project
            </button>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-all"
            >
              🚪 Logout
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-12">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">📁 My Projects</h2>
          <p className="text-gray-300">Create and manage your presentations</p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
            <p className="mt-4 text-gray-300">Loading projects...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {projects.map((project) => (
              <div
                key={project.id}
                onClick={() => navigate(`/editor/${project.id}`)}
                className="bg-white/10 backdrop-blur-lg rounded-xl p-6 hover:bg-white/20 transition-all cursor-pointer group relative"
              >
                <div className="aspect-video bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg mb-4 flex items-center justify-center">
                  <span className="text-6xl">📊</span>
                </div>
                <h3 className="text-lg font-semibold mb-1 group-hover:text-purple-300 transition-colors">
                  {project.name}
                </h3>
                <div className="flex items-center justify-between text-xs text-gray-400 mb-3">
                  <span>{project.slideCount || 0} slides</span>
                  <span>{new Date(project.updatedAt).toLocaleDateString()}</span>
                </div>
                <button
                  onClick={(e) => deleteProject(project.id, e)}
                  className="absolute top-3 right-3 w-8 h-8 bg-red-500/20 hover:bg-red-500 rounded-lg flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
                >
                  🗑️
                </button>
              </div>
            ))}

            {/* Create New Card */}
            <div
              onClick={createProject}
              className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border-2 border-dashed border-white/30 hover:border-purple-500 hover:bg-white/10 transition-all cursor-pointer flex items-center justify-center min-h-[280px]"
            >
              <div className="text-center">
                <div className="text-6xl mb-4">➕</div>
                <p className="text-lg font-semibold">Create New Project</p>
                <p className="text-sm text-gray-400 mt-1">Start from scratch</p>
              </div>
            </div>
          </div>
        )}

        {projects.length === 0 && !loading && (
          <div className="text-center py-12">
            <p className="text-6xl mb-4">🎨</p>
            <p className="text-xl font-semibold mb-2">No projects yet</p>
            <p className="text-gray-400 mb-6">Click "New Project" to get started!</p>
            <button
              onClick={createProject}
              className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-lg font-semibold transition-all shadow-lg"
            >
              🚀 Create Your First Project
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

export default DashboardPage;
