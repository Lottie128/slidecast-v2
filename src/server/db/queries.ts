// Database query helpers
import pool from './pool.js';
import type { DBUser, DBProject, DBSlide, Project, Slide } from '../../types/index.js';

// ============= User Queries =============
export async function createUser(email: string, username: string, passwordHash: string): Promise<DBUser> {
  const result = await pool.query(
    'INSERT INTO users (email, username, password_hash) VALUES ($1, $2, $3) RETURNING *',
    [email, username, passwordHash]
  );
  return result.rows[0];
}

export async function findUserByEmail(email: string): Promise<DBUser | null> {
  const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
  return result.rows[0] || null;
}

export async function findUserById(id: string): Promise<DBUser | null> {
  const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
  return result.rows[0] || null;
}

// ============= Project Queries =============
export async function createProject(userId: string, name: string, description?: string): Promise<DBProject> {
  const result = await pool.query(
    'INSERT INTO projects (user_id, name, description) VALUES ($1, $2, $3) RETURNING *',
    [userId, name, description]
  );
  return result.rows[0];
}

export async function getProjectById(id: string): Promise<DBProject | null> {
  const result = await pool.query('SELECT * FROM projects WHERE id = $1', [id]);
  return result.rows[0] || null;
}

export async function getUserProjects(userId: string, limit = 50, offset = 0): Promise<DBProject[]> {
  const result = await pool.query(
    'SELECT * FROM projects_with_stats WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3',
    [userId, limit, offset]
  );
  return result.rows;
}

export async function updateProject(
  id: string,
  updates: Partial<Pick<DBProject, 'name' | 'description' | 'status' | 'video_settings' | 'exported_video_url'>>
): Promise<DBProject> {
  const fields: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  Object.entries(updates).forEach(([key, value]) => {
    fields.push(`${key} = $${paramIndex}`);
    values.push(value);
    paramIndex++;
  });

  values.push(id);
  const result = await pool.query(
    `UPDATE projects SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
    values
  );
  return result.rows[0];
}

export async function deleteProject(id: string): Promise<void> {
  await pool.query('DELETE FROM projects WHERE id = $1', [id]);
}

// ============= Slide Queries =============
export async function createSlide(slideData: Omit<DBSlide, 'id' | 'created_at' | 'updated_at'>): Promise<DBSlide> {
  const result = await pool.query(
    `INSERT INTO slides (
      project_id, title, content, "order", duration,
      background_type, background_gradient, background_color, background_image_url,
      elements, audio_url, audio_duration, audio_text, voice_id, transition
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15) RETURNING *`,
    [
      slideData.project_id,
      slideData.title,
      slideData.content,
      slideData.order,
      slideData.duration,
      slideData.background_type,
      slideData.background_gradient,
      slideData.background_color,
      slideData.background_image_url,
      JSON.stringify(slideData.elements),
      slideData.audio_url,
      slideData.audio_duration,
      slideData.audio_text,
      slideData.voice_id,
      slideData.transition ? JSON.stringify(slideData.transition) : null,
    ]
  );
  return result.rows[0];
}

export async function getProjectSlides(projectId: string): Promise<DBSlide[]> {
  const result = await pool.query(
    'SELECT * FROM slides WHERE project_id = $1 ORDER BY "order" ASC',
    [projectId]
  );
  return result.rows;
}

export async function getSlideById(id: string): Promise<DBSlide | null> {
  const result = await pool.query('SELECT * FROM slides WHERE id = $1', [id]);
  return result.rows[0] || null;
}

export async function updateSlide(
  id: string,
  updates: Partial<Omit<DBSlide, 'id' | 'project_id' | 'created_at' | 'updated_at'>>
): Promise<DBSlide> {
  const fields: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  Object.entries(updates).forEach(([key, value]) => {
    if (key === 'elements' || key === 'transition') {
      fields.push(`${key} = $${paramIndex}`);
      values.push(JSON.stringify(value));
    } else {
      fields.push(`${key} = $${paramIndex}`);
      values.push(value);
    }
    paramIndex++;
  });

  values.push(id);
  const result = await pool.query(
    `UPDATE slides SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
    values
  );
  return result.rows[0];
}

export async function deleteSlide(id: string): Promise<void> {
  await pool.query('DELETE FROM slides WHERE id = $1', [id]);
}

export async function reorderSlides(projectId: string, slideIds: string[]): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    for (let i = 0; i < slideIds.length; i++) {
      await client.query(
        'UPDATE slides SET "order" = $1 WHERE id = $2 AND project_id = $3',
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
}

// ============= Refresh Token Queries =============
export async function saveRefreshToken(userId: string, token: string, expiresAt: Date): Promise<void> {
  await pool.query(
    'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
    [userId, token, expiresAt]
  );
}

export async function findRefreshToken(token: string): Promise<any> {
  const result = await pool.query('SELECT * FROM refresh_tokens WHERE token = $1', [token]);
  return result.rows[0] || null;
}

export async function deleteRefreshToken(token: string): Promise<void> {
  await pool.query('DELETE FROM refresh_tokens WHERE token = $1', [token]);
}

export async function deleteUserRefreshTokens(userId: string): Promise<void> {
  await pool.query('DELETE FROM refresh_tokens WHERE user_id = $1', [userId]);
}
