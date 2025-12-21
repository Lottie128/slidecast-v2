import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router';
import axios from 'axios';
import type { Project, Slide } from '../../types';

const ProjectPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [slides, setSlides] = useState<Slide[]>([]);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const response = await axios.get(`/api/projects/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.data.success) {
          setProject(response.data.data);

          const slidesResponse = await axios.get(`/api/projects/${id}/slides`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (slidesResponse.data.success) {
            setSlides(slidesResponse.data.data);
          }
        }
      } catch (error) {
        console.error('Failed to fetch project:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProject();
  }, [id, token]);

  if (loading) {
    return (
      <div className="p-8 text-center">
        <p className="text-slate-600 dark:text-slate-400">Loading project...</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="p-8 text-center">
        <p className="text-slate-600 dark:text-slate-400">Project not found</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <Link to="/dashboard" className="text-primary-600 dark:text-primary-400 hover:underline mb-4 inline-block">
        ← Back to Dashboard
      </Link>

      <div className="card mb-8">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">{project.title}</h1>
            <p className="text-slate-600 dark:text-slate-400">{project.description}</p>
          </div>
          <span className="px-3 py-1 rounded-full text-sm font-medium bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300">
            {project.status}
          </span>
        </div>

        <div className="flex gap-4">
          <Link to={`/projects/${id}/editor`} className="btn-primary">
            Edit Slides
          </Link>
          <button className="btn-secondary">Generate Video</button>
          {project.videoUrl && (
            <a
              href={project.videoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary"
            >
              Download Video
            </a>
          )}
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
          Slides ({slides.length})
        </h2>
        {slides.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-slate-600 dark:text-slate-400 mb-4">No slides yet</p>
            <Link to={`/projects/${id}/editor`} className="btn-primary inline-block">
              Add Your First Slide
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {slides.map((slide, index) => (
              <div key={slide.id} className="card">
                <div className="aspect-video bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-600 rounded mb-4 flex items-center justify-center">
                  <span className="text-4xl font-bold text-slate-400 dark:text-slate-500">
                    {index + 1}
                  </span>
                </div>
                <h3 className="font-semibold text-slate-900 dark:text-white mb-2">{slide.title}</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                  {slide.content}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectPage;
