import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

interface Project {
  id: number;
  title: string;
  description: string;
  thumbnail_url?: string;
  created_at: string;
  updated_at: string;
}

const DashboardPage = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [newProjectTitle, setNewProjectTitle] = useState('');
  const [newProjectDescription, setNewProjectDescription] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get('/api/projects', {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      console.log('Projects response:', response.data);
      
      // Handle different response structures
      if (response.data.success && Array.isArray(response.data.data)) {
        setProjects(response.data.data);
      } else if (Array.isArray(response.data)) {
        setProjects(response.data);
      } else {
        setProjects([]);
      }
    } catch (error: any) {
      console.error('Error fetching projects:', error);
      setError(error.response?.data?.error || 'Failed to load projects');
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  const createProject = async () => {
    if (!newProjectTitle.trim()) return;
    
    setCreating(true);
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.post(
        '/api/projects',
        {
          title: newProjectTitle,
          description: newProjectDescription,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      
      console.log('Create project response:', response.data);
      
      if (response.data.success) {
        navigate(`/editor/${response.data.data.id}`);
      }
    } catch (error: any) {
      console.error('Error creating project:', error);
      alert(error.response?.data?.error || 'Failed to create project');
    } finally {
      setCreating(false);
    }
  };

  const deleteProject = async (id: number) => {
    if (!confirm('Are you sure you want to delete this project?')) return;
    
    try {
      const token = localStorage.getItem('accessToken');
      await axios.delete(`/api/projects/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchProjects();
    } catch (error: any) {
      console.error('Error deleting project:', error);
      alert(error.response?.data?.error || 'Failed to delete project');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 pt-20 pb-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">My Projects</h1>
            <p className="text-slate-400">Create stunning AI-narrated video presentations</p>
          </div>
          <button
            onClick={() => setShowNewProjectModal(true)}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Project
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400">
            {error}
          </div>
        )}

        {/* Projects Grid */}
        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
            <p className="text-slate-400 mt-4">Loading projects...</p>
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-20">
            <div className="inline-block p-8 bg-slate-800/50 rounded-full mb-6">
              <svg className="w-16 h-16 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
              </svg>
            </div>
            <h3 className="text-2xl font-semibold text-white mb-2">No projects yet</h3>
            <p className="text-slate-400 mb-6">Create your first AI-powered video presentation</p>
            <button
              onClick={() => setShowNewProjectModal(true)}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
            >
              Create Project
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <div
                key={project.id}
                className="bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-xl overflow-hidden hover:border-purple-500/50 transition-all duration-200 hover:shadow-xl hover:shadow-purple-500/10 group"
              >
                {/* Thumbnail */}
                <div className="aspect-video bg-gradient-to-br from-purple-900/50 to-pink-900/50 flex items-center justify-center">
                  {project.thumbnail_url ? (
                    <img src={project.thumbnail_url} alt={project.title} className="w-full h-full object-cover" />
                  ) : (
                    <svg className="w-16 h-16 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  )}
                </div>

                {/* Content */}
                <div className="p-5">
                  <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-purple-400 transition-colors">
                    {project.title}
                  </h3>
                  <p className="text-slate-400 text-sm mb-4 line-clamp-2">
                    {project.description || 'No description'}
                  </p>
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>{new Date(project.created_at).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="p-4 bg-slate-900/50 border-t border-slate-700/50 flex gap-2">
                  <Link
                    to={`/editor/${project.id}`}
                    className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-lg text-center transition-colors"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => deleteProject(project.id)}
                    className="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 text-sm font-semibold rounded-lg transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* New Project Modal */}
      {showNewProjectModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold text-white mb-6">Create New Project</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Project Title</label>
                <input
                  type="text"
                  value={newProjectTitle}
                  onChange={(e) => setNewProjectTitle(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="My Awesome Presentation"
                  autoFocus
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Description (optional)</label>
                <textarea
                  value={newProjectDescription}
                  onChange={(e) => setNewProjectDescription(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                  placeholder="Brief description of your project"
                  rows={3}
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowNewProjectModal(false);
                  setNewProjectTitle('');
                  setNewProjectDescription('');
                }}
                className="flex-1 px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg transition-colors"
                disabled={creating}
              >
                Cancel
              </button>
              <button
                onClick={createProject}
                disabled={creating || !newProjectTitle.trim()}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {creating ? 'Creating...' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
