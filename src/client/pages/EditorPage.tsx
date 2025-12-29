import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

interface Slide {
  id: number;
  slide_number: number;
  title: string;
  content: string;
  speaker_notes?: string;
  background_type: string;
  background_value: string;
  audio_url?: string;
}

interface Project {
  id: number;
  title: string;
  description: string;
}

const EditorPage = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [slides, setSlides] = useState<Slide[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Slide editing state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [speakerNotes, setSpeakerNotes] = useState('');
  const [bgType, setBgType] = useState('color');
  const [bgValue, setBgValue] = useState('#1e293b');

  useEffect(() => {
    fetchProject();
    fetchSlides();
  }, [projectId]);

  useEffect(() => {
    if (slides[currentSlide]) {
      const slide = slides[currentSlide];
      setTitle(slide.title);
      setContent(slide.content);
      setSpeakerNotes(slide.speaker_notes || '');
      setBgType(slide.background_type);
      setBgValue(slide.background_value);
    }
  }, [currentSlide, slides]);

  const fetchProject = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`/api/projects/${projectId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProject(response.data.data);
    } catch (error) {
      console.error('Error fetching project:', error);
    }
  };

  const fetchSlides = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`/api/projects/${projectId}/slides`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const slideData = response.data.data || [];
      setSlides(Array.isArray(slideData) ? slideData : []);
    } catch (error) {
      console.error('Error fetching slides:', error);
      setSlides([]);
    } finally {
      setLoading(false);
    }
  };

  const saveSlide = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const slideData = {
        title,
        content,
        speaker_notes: speakerNotes,
        background_type: bgType,
        background_value: bgValue,
      };

      if (slides[currentSlide]) {
        await axios.put(
          `/api/slides/${slides[currentSlide].id}`,
          slideData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }
      
      fetchSlides();
      alert('Slide saved!');
    } catch (error) {
      console.error('Error saving slide:', error);
      alert('Failed to save slide');
    }
  };

  const addSlide = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      await axios.post(
        `/api/projects/${projectId}/slides`,
        {
          title: 'New Slide',
          content: 'Click to edit',
          slide_number: slides.length + 1,
          background_type: 'color',
          background_value: '#1e293b',
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      fetchSlides();
      setCurrentSlide(slides.length);
    } catch (error) {
      console.error('Error adding slide:', error);
    }
  };

  const deleteSlide = async (slideId: number) => {
    if (!confirm('Delete this slide?')) return;
    
    try {
      const token = localStorage.getItem('accessToken');
      await axios.delete(`/api/slides/${slideId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      fetchSlides();
      if (currentSlide >= slides.length - 1) {
        setCurrentSlide(Math.max(0, slides.length - 2));
      }
    } catch (error) {
      console.error('Error deleting slide:', error);
    }
  };

  const generateAudio = async (slideId: number) => {
    setGenerating(true);
    try {
      const token = localStorage.getItem('accessToken');
      await axios.post(
        `/api/tts/generate`,
        { slide_id: slideId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      fetchSlides();
      alert('Audio generated!');
    } catch (error) {
      console.error('Error generating audio:', error);
      alert('Failed to generate audio');
    } finally {
      setGenerating(false);
    }
  };

  const exportVideo = async () => {
    setExporting(true);
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.post(
        `/api/export/video`,
        { project_id: projectId },
        { 
          headers: { Authorization: `Bearer ${token}` },
          responseType: 'blob',
        }
      );
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${project?.title || 'video'}.mp4`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error exporting video:', error);
      alert('Failed to export video');
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
          <p className="text-slate-400 mt-4">Loading editor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-slate-900 flex flex-col overflow-hidden">
      {/* Top Toolbar */}
      <div className="bg-slate-800 border-b border-slate-700 px-4 py-2 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/dashboard')}
            className="p-1.5 hover:bg-slate-700 rounded transition-colors"
            title="Back to Dashboard"
          >
            <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-lg font-semibold text-white">{project?.title}</h1>
            <p className="text-xs text-slate-400">{slides.length} slides</p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={saveSlide}
            className="px-3 py-1.5 text-sm bg-slate-700 hover:bg-slate-600 text-white font-medium rounded transition-colors"
          >
            Save
          </button>
          <button
            onClick={exportVideo}
            disabled={exporting || slides.length === 0}
            className="px-4 py-1.5 text-sm bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium rounded transition-all disabled:opacity-50"
          >
            {exporting ? 'Exporting...' : 'Export Video'}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Preview Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Canvas */}
          <div className="flex-1 bg-slate-800 p-6 overflow-auto flex items-center justify-center">
            <div 
              className="w-full max-w-4xl aspect-video rounded-lg shadow-2xl flex flex-col justify-center p-8 md:p-12"
              style={{
                background: bgType === 'gradient'
                  ? bgValue
                  : bgType === 'image'
                  ? `url(${bgValue}) center/cover`
                  : bgValue,
              }}
            >
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-4 drop-shadow-lg">{title || 'Slide Title'}</h2>
              <p className="text-lg md:text-2xl text-white/90 leading-relaxed drop-shadow">{content || 'Slide content'}</p>
            </div>
          </div>

          {/* Timeline */}
          <div className="h-32 bg-slate-900 border-t border-slate-700 p-3 overflow-x-auto">
            <div className="flex gap-2 h-full">
              <button
                onClick={addSlide}
                className="w-32 h-full flex-shrink-0 border-2 border-dashed border-slate-600 hover:border-purple-500 rounded-lg flex flex-col items-center justify-center gap-1 text-slate-400 hover:text-purple-400 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span className="text-xs font-medium">Add Slide</span>
              </button>
              
              {slides.map((slide, index) => (
                <button
                  key={slide.id}
                  onClick={() => setCurrentSlide(index)}
                  className={`w-40 h-full flex-shrink-0 rounded-lg overflow-hidden transition-all ${
                    currentSlide === index
                      ? 'ring-2 ring-purple-500 scale-105'
                      : 'hover:ring-2 hover:ring-slate-600'
                  }`}
                >
                  <div 
                    className="w-full h-full p-2 flex flex-col justify-center"
                    style={{
                      background: slide.background_type === 'gradient'
                        ? slide.background_value
                        : slide.background_value,
                    }}
                  >
                    <div className="text-white text-xs font-semibold truncate drop-shadow">{slide.title}</div>
                    <div className="text-white/70 text-[10px] truncate drop-shadow mt-0.5">{slide.content}</div>
                  </div>
                  <div className="bg-slate-800 px-2 py-0.5 text-xs text-slate-400 flex items-center justify-between">
                    <span>#{index + 1}</span>
                    {slide.audio_url && (
                      <svg className="w-3 h-3 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
                      </svg>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Panel - Properties */}
        <div className="w-80 bg-slate-800 border-l border-slate-700 overflow-y-auto flex-shrink-0">
          <div className="p-4 space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-white mb-3">Slide Properties</h3>
            </div>
            
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-900 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Slide title"
              />
            </div>
            
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Content</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-900 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                rows={4}
                placeholder="Slide content"
              />
            </div>
            
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Background</label>
              <div className="space-y-2">
                <select
                  value={bgType}
                  onChange={(e) => setBgType(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-900 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-purple-500"
                >
                  <option value="color">Solid Color</option>
                  <option value="gradient">Gradient</option>
                </select>
                <input
                  type="text"
                  value={bgValue}
                  onChange={(e) => setBgValue(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-900 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-purple-500"
                  placeholder={bgType === 'gradient' ? 'linear-gradient(...)' : '#1e293b'}
                />
              </div>
            </div>
            
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Speaker Notes (AI Voice)</label>
              <textarea
                value={speakerNotes}
                onChange={(e) => setSpeakerNotes(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-900 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-purple-500 resize-none"
                rows={3}
                placeholder="What the AI should say..."
              />
            </div>
            
            <div className="pt-2 space-y-2">
              <button
                onClick={() => slides[currentSlide] && generateAudio(slides[currentSlide].id)}
                disabled={generating || !slides[currentSlide]}
                className="w-full px-3 py-2 text-sm bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
                {generating ? 'Generating...' : 'Generate Audio'}
              </button>
              
              <button
                onClick={() => slides[currentSlide] && deleteSlide(slides[currentSlide].id)}
                disabled={!slides[currentSlide]}
                className="w-full px-3 py-2 text-sm bg-red-600/20 hover:bg-red-600/30 text-red-400 font-medium rounded-lg transition-colors disabled:opacity-50"
              >
                Delete Slide
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditorPage;
