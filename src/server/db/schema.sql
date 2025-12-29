-- SlideCast V2 Database Schema
-- PostgreSQL 14+

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============= Users Table =============
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(100) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);

-- ============= Projects Table =============
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'processing', 'completed', 'failed')),
  video_settings JSONB NOT NULL DEFAULT '{
    "resolution": "1080p",
    "fps": 30,
    "quality": "high",
    "audioQuality": 192,
    "includeTransitions": true
  }'::jsonb,
  exported_video_url TEXT,
  exported_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_created_at ON projects(created_at DESC);

-- ============= Slides Table =============
CREATE TABLE IF NOT EXISTS slides (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  content TEXT,
  "order" INTEGER NOT NULL,
  duration NUMERIC(10, 2) DEFAULT 5.0,
  
  -- Background
  background_type VARCHAR(50) DEFAULT 'gradient' CHECK (background_type IN ('gradient', 'solid', 'image')),
  background_gradient TEXT,
  background_color VARCHAR(50),
  background_image_url TEXT,
  
  -- Elements (stored as JSON array)
  elements JSONB DEFAULT '[]'::jsonb,
  
  -- Audio
  audio_url TEXT,
  audio_duration NUMERIC(10, 2),
  audio_text TEXT,
  voice_id VARCHAR(100),
  
  -- Transition
  transition JSONB,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(project_id, "order")
);

CREATE INDEX idx_slides_project_id ON slides(project_id);
CREATE INDEX idx_slides_order ON slides(project_id, "order");

-- ============= Refresh Tokens Table (for JWT) =============
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_token ON refresh_tokens(token);

-- ============= Functions =============

-- Update updated_at timestamp automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_slides_updated_at BEFORE UPDATE ON slides
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============= Views =============

-- Project with slide count
CREATE OR REPLACE VIEW projects_with_stats AS
SELECT 
  p.*,
  COUNT(s.id) as slide_count,
  COALESCE(SUM(s.duration), 0) as total_duration
FROM projects p
LEFT JOIN slides s ON p.id = s.project_id
GROUP BY p.id;

-- ============= Sample Data (Development Only) =============

-- Uncomment below for development seed data
/*
INSERT INTO users (email, username, password_hash) VALUES
  ('demo@slidecast.com', 'demo', '$2b$10$SAMPLE_HASH_REPLACE_IN_PRODUCTION');
*/
