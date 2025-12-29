// ============================================
// SlideCast V2 - Database Query Helpers
// ============================================

import pool from './pool';
import type { User, Project, Slide } from '../../types';

// ============================================
// USER QUERIES
// ============================================

export const createUser = async (email: string, username: string, passwordHash: string): Promise<User> => {
  const result = await pool.query(
    'INSERT INTO users (email, username, password_hash) VALUES ($1, $2, $3) RETURNING *',
    [email, username, passwordHash]
  );
  return result.rows[0];
};

export const findUserByEmail = async (email: string): Promise<User | null> => {
  const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
  return result.rows[0] || null;
};

export const findUserById = async (id: string): Promise<User | null> => {
  const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
  return result.rows[0] || null;
};

// ============================================
// PROJECT QUERIES
// ============================================

export const createProject = async (userId: string, name: string, description?: string): Promise<Project> => {
  const result = await pool.query(
    'INSERT INTO projects (user_id, name, description) VALUES ($1, $2, $3) RETURNING *',
    [userId, name, description]
  );
  return result.rows[0];
};

export const getProjectById = async (projectId: string): Promise<Project | null> => {
  const result = await pool.query('SELECT * FROM projects WHERE id = $1', [projectId]);
  return result.rows[0] || null;
};

export const getProjectsByUserId = async (userId: string, page = 1, pageSize = 20) => {
  const offset = (page - 1) * pageSize;
  const result = await pool.query(
    'SELECT * FROM projects WHERE user_id = $1 ORDER BY updated_at DESC LIMIT $2 OFFSET $3',
    [userId, pageSize, offset]
  );
  
  const countResult = await pool.query(
    'SELECT COUNT(*) FROM projects WHERE user_id = $1',
    [userId]
  );
  
  return {
    items: result.rows,
    total: parseInt(countResult.rows[0].count, 10),
    page,
    pageSize,
    hasMore: offset + result.rows.length < countResult.rows[0].count,
  };
};

export const updateProject = async (projectId: string, updates: Partial<Project>): Promise<Project | null> => {
  const fields = [];
  const values = [];
  let paramIndex = 1;
  
  if (updates.name) {
    fields.push(`name = $${paramIndex++}`);
    values.push(updates.name);
  }
  if (updates.description !== undefined) {
    fields.push(`description = $${paramIndex++}`);
    values.push(updates.description);
  }
  if (updates.thumbnail) {
    fields.push(`thumbnail = $${paramIndex++}`);
    values.push(updates.thumbnail);
  }
  
  if (fields.length === 0) return null;
  
  values.push(projectId);
  const result = await pool.query(
    `UPDATE projects SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
    values
  );
  
  return result.rows[0] || null;
};

export const deleteProject = async (projectId: string): Promise<boolean> => {
  const result = await pool.query('DELETE FROM projects WHERE id = $1', [projectId]);
  return result.rowCount > 0;
};

// ============================================
// SLIDE QUERIES
// ============================================

export const createSlide = async (slideData: Omit<Slide, 'id' | 'createdAt' | 'updatedAt'>): Promise<Slide> => {
  const result = await pool.query(
    `INSERT INTO slides 
    (project_id, order_index, title, content, background_gradient, elements, audio_url, audio_duration, duration, transition) 
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
    [
      slideData.projectId,
      slideData.order,
      slideData.title,
      slideData.content,
      slideData.backgroundGradient,
      JSON.stringify(slideData.elements),
      slideData.audioUrl,
      slideData.audioDuration,
      slideData.duration,
      slideData.transition ? JSON.stringify(slideData.transition) : null,
    ]
  );
  return result.rows[0];
};

export const getSlidesByProjectId = async (projectId: string): Promise<Slide[]> => {
  const result = await pool.query(
    'SELECT * FROM slides WHERE project_id = $1 ORDER BY order_index ASC',
    [projectId]
  );
  return result.rows;
};

export const updateSlide = async (slideId: string, updates: Partial<Slide>): Promise<Slide | null> => {
  const fields = [];
  const values = [];
  let paramIndex = 1;
  
  const fieldMap: Record<string, string> = {
    title: 'title',
    content: 'content',
    backgroundGradient: 'background_gradient',
    audioUrl: 'audio_url',
    audioDuration: 'audio_duration',
    duration: 'duration',
    order: 'order_index',
  };
  
  Object.entries(updates).forEach(([key, value]) => {
    if (fieldMap[key] && value !== undefined) {
      fields.push(`${fieldMap[key]} = $${paramIndex++}`);
      values.push(value);
    }
  });
  
  if (updates.elements) {
    fields.push(`elements = $${paramIndex++}`);
    values.push(JSON.stringify(updates.elements));
  }
  
  if (updates.transition) {
    fields.push(`transition = $${paramIndex++}`);
    values.push(JSON.stringify(updates.transition));
  }
  
  if (fields.length === 0) return null;
  
  values.push(slideId);
  const result = await pool.query(
    `UPDATE slides SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
    values
  );
  
  return result.rows[0] || null;
};

export const deleteSlide = async (slideId: string): Promise<boolean> => {
  const result = await pool.query('DELETE FROM slides WHERE id = $1', [slideId]);
  return result.rowCount > 0;
};

export const reorderSlides = async (projectId: string, slideIds: string[]): Promise<void> => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    for (let i = 0; i < slideIds.length; i++) {
      await client.query(
        'UPDATE slides SET order_index = $1 WHERE id = $2 AND project_id = $3',
        [i, slideIds[i], projectId]
      );
    }
    
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};
