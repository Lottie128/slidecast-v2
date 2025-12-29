// ============================================
// SlideCast V2 - Dashboard Page
// ============================================

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProjectAPI } from '../hooks/useProjectAPI';
import type { Project } from '../../types';

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const api = useProjectAPI();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');
  
  useEffect(() => {
    loadProjects();
  }, []);
  
  const loadProjects = async () => {
    try {
      const data = await api.getProjects();
      setProjects(data.items || []);
    } catch (error) {
      console.error('Failed to load projects:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleCreateProject = async () => {
    if (!newProjectName.trim()) return;
    
    try {
      const project = await api.createProject(newProjectName, newProjectDesc);
      navigate(`/editor/${project.id}`);
    } catch (error) {
      console.error('Failed to create project:', error);
      alert('Failed to create project');
    }
  };
  
  const handleDeleteProject = async (id: string) => {
    if (!confirm('Are you sure you want to delete this project?')) return;
    
    try {
      await api.deleteProject(id);
      setProjects(projects.filter(p => p.id !== id));
    } catch (error) {
      console.error('Failed to delete project:', error);
    }
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-slate-400">Loading projects...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">My Projects</h1>
            <p className="text-slate-400">Create and manage your video presentations</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn btn-primary flex items-center space-x-2"
          >
            <span>+</span>
            <span>New Project</span>
          </button>
        </div>
        
        {projects.length === 0 ? (
          <div className="glass rounded-2xl p-12 text-center">
            <div className="w-20 h-20 mx-auto bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl mb-4 opacity-50"></div>
            <h3 className="text-xl font-semibold text-white mb-2">No projects yet</h3>
            <p className="text-slate-400 mb-6">Create your first video presentation project</p>
            <button onClick={() => setShowCreateModal(true)} className="btn btn-primary">
              Create Project
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <div key={project.id} className="glass rounded-xl p-6 hover:border-purple-500 transition-all cursor-pointer group">
                <div onClick={() => navigate(`/editor/${project.id}`)}>
                  <div className="w-full h-40 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg mb-4 flex items-center justify-center">
                    <span className="text-6xl opacity-50">🎥</span>
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-purple-400 transition-colors">
                    {project.name}
                  </h3>
                  <p className="text-slate-400 text-sm mb-4 line-clamp-2">
                    {project.description || 'No description'}
                  </p>
                  <p className="text-xs text-slate-500">
                    Updated {new Date(project.updatedAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="mt-4 pt-4 border-t border-slate-700 flex justify-between">
                  <button
                    onClick={() => navigate(`/editor/${project.id}`)}
                    className="btn btn-ghost text-sm"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteProject(project.id)}
                    className="btn btn-ghost text-sm text-red-400 hover:text-red-300"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Create Project Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="glass rounded-2xl p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold text-white mb-6">Create New Project</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Project Name</label>
                <input
                  type="text"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white"
                  placeholder="My Awesome Presentation"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Description (Optional)</label>
                <textarea
                  value={newProjectDesc}
                  onChange={(e) => setNewProjectDesc(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white resize-none"
                  rows={3}
                  placeholder="Brief description of your project"
                />
              </div>
            </div>
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setNewProjectName('');
                  setNewProjectDesc('');
                }}
                className="flex-1 btn btn-ghost"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateProject}
                disabled={!newProjectName.trim()}
                className="flex-1 btn btn-primary"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
