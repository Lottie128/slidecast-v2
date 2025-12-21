import React, { useEffect, useState } from 'react';
import { Link } from 'react-router';
import axios from 'axios';
import type { Project } from '../../types';

const DashboardPage: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await axios.get('/api/projects', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.data.success) {
          setProjects(response.data.data.data);
        }
      } catch (error) {
        console.error('Failed to fetch projects:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, [token]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300';
      case 'generating':
        return 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300';
      case 'failed':
        return 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300';
      default:
        return 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300';
    }
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Dashboard</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">Manage your video projects</p>
        </div>
        <Link to="/projects/new" className="btn-primary">
          + New Project
        </Link>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-pulse text-slate-600 dark:text-slate-400">Loading projects...</div>
        </div>
      ) : projects.length === 0 ? (
        <div className="card text-center py-12">
          <div className="text-6xl mb-4">🎬</div>
          <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">No projects yet</h3>
          <p className="text-slate-600 dark:text-slate-400 mb-6">Create your first AI-powered video presentation</p>
          <Link to="/projects/new" className="btn-primary inline-block">
            Create Your First Project
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <Link
              key={project.id}
              to={`/projects/${project.id}`}
              className="card hover:shadow-lg transition-shadow cursor-pointer group"
            >
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                  {project.title}
                </h3>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                  {project.status}
                </span>
              </div>
              <p className="text-slate-600 dark:text-slate-400 text-sm mb-4 line-clamp-2">
                {project.description || 'No description'}
              </p>
              <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
                <span>{project.slides?.length || 0} slides</span>
                <span>{new Date(project.createdAt).toLocaleDateString()}</span>
              </div>
              {project.status === 'generating' && project.videoProgress !== undefined && (
                <div className="mt-4">
                  <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                    <div 
                      className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${project.videoProgress}%` }}
                    />
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {project.videoProgress}% complete
                  </p>
                </div>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
