import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const response = await axios.get('/api/projects');
      if (response.data.success) {
        setProjects(response.data.projects);
      }
    } catch (error) {
      console.error('Failed to load projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const createProject = async () => {
    try {
      const response = await axios.post('/api/projects', {
        name: 'Untitled Project',
        description: ''
      });
      if (response.data.success) {
        navigate(`/editor/${response.data.project.id}`);
      }
    } catch (error) {
      console.error('Failed to create project:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      {/* Header */}
      <header className="bg-white/10 backdrop-blur-lg border-b border-white/20">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">SlidecastV2</h1>
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

      {/* Main Content */}
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
                <p className="text-sm text-gray-400 mb-2">{project.description || 'No description'}</p>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{project.slideCount} slides</span>
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
      </main>
    </div>
  );
};

export default DashboardPage;
