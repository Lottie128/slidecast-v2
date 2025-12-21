import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router';
import axios from 'axios';
import type { Slide } from '../../types';

const EditorPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [slides, setSlides] = useState<Slide[]>([]);
  const [selectedSlide, setSelectedSlide] = useState(0);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchSlides = async () => {
      try {
        const response = await axios.get(`/api/projects/${id}/slides`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.data.success) {
          setSlides(response.data.data);
        }
      } catch (error) {
        console.error('Failed to fetch slides:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSlides();
  }, [id, token]);

  const addSlide = async () => {
    try {
      const response = await axios.post(
        `/api/projects/${id}/slides`,
        {
          order: slides.length + 1,
          title: `Slide ${slides.length + 1}`,
          content: 'Enter your content here...',
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setSlides([...slides, response.data.data]);
        setSelectedSlide(slides.length);
      }
    } catch (error) {
      console.error('Failed to add slide:', error);
    }
  };

  const updateSlide = async (slideId: string, updates: Partial<Slide>) => {
    try {
      const response = await axios.put(
        `/api/slides/${slideId}`,
        updates,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setSlides(slides.map(s => s.id === slideId ? response.data.data : s));
      }
    } catch (error) {
      console.error('Failed to update slide:', error);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center">
        <p className="text-slate-600 dark:text-slate-400">Loading editor...</p>
      </div>
    );
  }

  const currentSlide = slides[selectedSlide];

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <Link to={`/projects/${id}`} className="text-primary-600 dark:text-primary-400 hover:underline mb-2 inline-block">
            ← Back to Project
          </Link>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Slide Editor</h1>
        </div>
        <button onClick={addSlide} className="btn-primary">
          + Add Slide
        </button>
      </div>

      <div className="grid grid-cols-12 gap-6 h-[calc(100vh-200px)]">
        {/* Slide List */}
        <div className="col-span-3 bg-white dark:bg-slate-800 rounded-lg shadow p-4 overflow-y-auto">
          <h2 className="font-semibold text-slate-900 dark:text-white mb-4">Slides</h2>
          <div className="space-y-2">
            {slides.length === 0 ? (
              <p className="text-slate-500 dark:text-slate-400 text-sm">No slides yet</p>
            ) : (
              slides.map((slide, index) => (
                <div
                  key={slide.id}
                  onClick={() => setSelectedSlide(index)}
                  className={`p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedSlide === index
                      ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300'
                      : 'bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono">{index + 1}</span>
                    <p className="font-medium text-sm truncate">{slide.title || `Slide ${index + 1}`}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Editor */}
        <div className="col-span-9 bg-white dark:bg-slate-800 rounded-lg shadow p-8 overflow-y-auto">
          {currentSlide ? (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Slide Title
                </label>
                <input
                  type="text"
                  value={currentSlide.title}
                  onChange={(e) => updateSlide(currentSlide.id, { title: e.target.value })}
                  className="input"
                  placeholder="Enter slide title..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Content
                </label>
                <textarea
                  value={currentSlide.content}
                  onChange={(e) => updateSlide(currentSlide.id, { content: e.target.value })}
                  className="input min-h-[300px] resize-none"
                  placeholder="Enter slide content..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Duration (seconds)
                  </label>
                  <input
                    type="number"
                    value={currentSlide.duration}
                    onChange={(e) => updateSlide(currentSlide.id, { duration: Number(e.target.value) })}
                    className="input"
                    min="1"
                    max="60"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Transition
                  </label>
                  <select
                    value={currentSlide.transition}
                    onChange={(e) => updateSlide(currentSlide.id, { transition: e.target.value as any })}
                    className="input"
                  >
                    <option value="fade">Fade</option>
                    <option value="slide">Slide</option>
                    <option value="zoom">Zoom</option>
                    <option value="none">None</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  💡 Tip: Keep content concise and engaging for better videos
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-slate-600 dark:text-slate-400 mb-4">No slide selected</p>
              <button onClick={addSlide} className="btn-primary">
                Create Your First Slide
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EditorPage;
