// ============================================
// SlideCast V2 - Editor Page
// Main slide editor interface
// ============================================

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useEditorStore } from '../hooks/useEditorStore';
import { useProjectAPI } from '../hooks/useProjectAPI';
import { gradientPresets } from '../lib/gradients';
import type { Slide, SlideElement } from '../../types';

const EditorPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const api = useProjectAPI();
  
  const {
    project,
    slides,
    currentSlideId,
    setProject,
    setSlides,
    setCurrentSlide,
    addSlide,
    updateSlide,
    deleteSlide,
  } = useEditorStore();
  
  const [loading, setLoading] = useState(true);
  const [showAddSlide, setShowAddSlide] = useState(false);
  
  const currentSlide = slides.find(s => s.id === currentSlideId);
  
  useEffect(() => {
    loadProject();
  }, [projectId]);
  
  const loadProject = async () => {
    if (!projectId) return;
    
    try {
      const projectData = await api.getProject(projectId);
      const slidesData = await api.getSlides(projectId);
      
      setProject(projectData);
      setSlides(slidesData);
    } catch (error) {
      console.error('Failed to load project:', error);
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };
  
  const handleAddSlide = async () => {
    if (!projectId) return;
    
    const newSlide: Partial<Slide> = {
      projectId,
      order: slides.length,
      title: `Slide ${slides.length + 1}`,
      content: 'Click to edit content',
      backgroundGradient: gradientPresets[Math.floor(Math.random() * gradientPresets.length)].css,
      elements: [],
      duration: 5.0,
    };
    
    try {
      const created = await api.createSlide(newSlide);
      addSlide(created);
      setCurrentSlide(created.id);
      setShowAddSlide(false);
    } catch (error) {
      console.error('Failed to create slide:', error);
    }
  };
  
  const handleDeleteSlide = async (slideId: string) => {
    if (!confirm('Delete this slide?')) return;
    
    try {
      await api.deleteSlide(slideId);
      deleteSlide(slideId);
    } catch (error) {
      console.error('Failed to delete slide:', error);
    }
  };
  
  const handleUpdateSlideTitle = async (slideId: string, title: string) => {
    try {
      await api.updateSlide(slideId, { title });
      updateSlide(slideId, { title });
    } catch (error) {
      console.error('Failed to update slide:', error);
    }
  };
  
  const handleGenerateAudio = async (slideId: string, text: string) => {
    try {
      const result = await api.generateAudio(text, 'en-US-AriaNeural', 1.0);
      await api.updateSlide(slideId, { 
        audioUrl: result.audioUrl,
        audioDuration: result.duration 
      });
      updateSlide(slideId, { 
        audioUrl: result.audioUrl,
        audioDuration: result.duration 
      });
      alert('Audio generated successfully!');
    } catch (error) {
      console.error('Failed to generate audio:', error);
      alert('Failed to generate audio');
    }
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-slate-400">Loading editor...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="h-screen flex flex-col">
      {/* Top Bar */}
      <div className="glass border-b border-slate-700 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <button onClick={() => navigate('/dashboard')} className="btn btn-ghost">
            ← Back
          </button>
          <h1 className="text-xl font-bold text-white">{project?.name}</h1>
        </div>
        <div className="flex items-center space-x-3">
          <button className="btn btn-ghost">Preview</button>
          <button className="btn btn-primary">Export Video</button>
        </div>
      </div>
      
      <div className="flex-1 flex overflow-hidden">
        {/* Slide Panel (Left) */}
        <div className="w-64 glass border-r border-slate-700 overflow-y-auto">
          <div className="p-4">
            <button
              onClick={() => setShowAddSlide(true)}
              className="w-full btn btn-primary mb-4"
            >
              + Add Slide
            </button>
            
            <div className="space-y-2">
              {slides.map((slide, index) => (
                <div
                  key={slide.id}
                  onClick={() => setCurrentSlide(slide.id)}
                  className={`p-3 rounded-lg cursor-pointer transition-all ${
                    slide.id === currentSlideId
                      ? 'bg-purple-600 border-2 border-purple-400'
                      : 'bg-slate-800 hover:bg-slate-700 border-2 border-transparent'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-white">Slide {index + 1}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteSlide(slide.id);
                      }}
                      className="text-red-400 hover:text-red-300 text-xs"
                    >
                      ×
                    </button>
                  </div>
                  <div
                    className="w-full h-20 rounded-md"
                    style={{ background: slide.backgroundGradient }}
                  ></div>
                  <p className="text-xs text-slate-400 mt-2 truncate">{slide.title}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Canvas (Center) */}
        <div className="flex-1 flex items-center justify-center p-8 bg-slate-900">
          {currentSlide ? (
            <div className="w-full max-w-4xl">
              <div
                className="w-full aspect-video rounded-xl shadow-2xl flex flex-col items-center justify-center p-12"
                style={{ background: currentSlide.backgroundGradient }}
              >
                <h2 className="text-5xl font-bold text-white mb-6 text-center">
                  {currentSlide.title}
                </h2>
                <p className="text-2xl text-white/90 text-center">
                  {currentSlide.content}
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center text-slate-500">
              <p>No slide selected</p>
              <p className="text-sm mt-2">Create a slide to get started</p>
            </div>
          )}
        </div>
        
        {/* Property Panel (Right) */}
        <div className="w-80 glass border-l border-slate-700 overflow-y-auto p-6">
          {currentSlide ? (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Slide Properties</h3>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Title</label>
                <input
                  type="text"
                  value={currentSlide.title}
                  onChange={(e) => handleUpdateSlideTitle(currentSlide.id, e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Content</label>
                <textarea
                  value={currentSlide.content}
                  onChange={(e) => updateSlide(currentSlide.id, { content: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm resize-none"
                  rows={4}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Background</label>
                <div className="grid grid-cols-3 gap-2">
                  {gradientPresets.slice(0, 9).map((gradient) => (
                    <button
                      key={gradient.id}
                      onClick={() => updateSlide(currentSlide.id, { backgroundGradient: gradient.css })}
                      className="w-full h-12 rounded-lg border-2 border-transparent hover:border-purple-400 transition-all"
                      style={{ background: gradient.css }}
                      title={gradient.name}
                    />
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Audio</label>
                {currentSlide.audioUrl ? (
                  <div className="bg-slate-800 rounded-lg p-3">
                    <audio controls className="w-full">
                      <source src={currentSlide.audioUrl} type="audio/mpeg" />
                    </audio>
                    <p className="text-xs text-slate-400 mt-2">Duration: {currentSlide.audioDuration?.toFixed(1)}s</p>
                  </div>
                ) : (
                  <button
                    onClick={() => handleGenerateAudio(currentSlide.id, currentSlide.content)}
                    className="w-full btn btn-secondary text-sm"
                  >
                    Generate Audio (TTS)
                  </button>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Duration</label>
                <input
                  type="number"
                  value={currentSlide.duration}
                  onChange={(e) => updateSlide(currentSlide.id, { duration: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm"
                  min="1"
                  max="60"
                  step="0.5"
                />
                <p className="text-xs text-slate-400 mt-1">Seconds</p>
              </div>
            </div>
          ) : (
            <div className="text-center text-slate-500 mt-8">
              <p>Select a slide to edit properties</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Add Slide Modal */}
      {showAddSlide && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="glass rounded-2xl p-8 max-w-md w-full m-4">
            <h2 className="text-2xl font-bold text-white mb-4">Add New Slide</h2>
            <p className="text-slate-400 mb-6">A new slide will be added to your presentation</p>
            <div className="flex space-x-3">
              <button onClick={() => setShowAddSlide(false)} className="flex-1 btn btn-ghost">
                Cancel
              </button>
              <button onClick={handleAddSlide} className="flex-1 btn btn-primary">
                Add Slide
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditorPage;
