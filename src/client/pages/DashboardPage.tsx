import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = () => {
    try {
      // Load from localStorage
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
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      <header className="bg-white/10 backdrop-blur-lg border-b border-white/20">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">SlideCast V2</h1>
          <div className="flex items-center gap-4">
            <button
              onClick={createProject}
              className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-lg font-semibold transition-all"
            >
              + New Project
            </button>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-all"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-12">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">My Projects</h2>
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
                className="bg-white/10 backdrop-blur-lg rounded-xl p-6 hover:bg-white/20 transition-all cursor-pointer group"
              >
                <div className="aspect-video bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg mb-4 flex items-center justify-center">
                  <span className="text-6xl">📊</span>
                </div>
                <h3 className="text-lg font-semibold mb-1 group-hover:text-purple-300 transition-colors">
                  {project.name}
                </h3>
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>{project.slideCount || 0} slides</span>
                  <span>{new Date(project.updatedAt).toLocaleDateString()}</span>
                </div>
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
              </div>
            </div>
          </div>
        )}

        {projects.length === 0 && !loading && (
          <div className="text-center py-12">
            <p className="text-6xl mb-4">🎨</p>
            <p className="text-xl font-semibold mb-2">No projects yet</p>
            <p className="text-gray-400 mb-6">Click "New Project" to get started!</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default DashboardPage;
