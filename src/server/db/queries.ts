import pool from './pool';

// User Queries
export const createUser = async (email: string, name: string, hashedPassword: string) => {
  const result = await pool.query(
    'INSERT INTO users (email, name, password) VALUES ($1, $2, $3) RETURNING id, email, name, created_at, updated_at',
    [email, name, hashedPassword]
  );
  return result.rows[0];
};

export const getUserByEmail = async (email: string) => {
  const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
  return result.rows[0];
};

export const getUserById = async (id: string) => {
  const result = await pool.query(
    'SELECT id, email, name, avatar, created_at, updated_at FROM users WHERE id = $1',
    [id]
  );
  return result.rows[0];
};

// Project Queries
export const createProject = async (
  userId: string,
  title: string,
  description: string,
  design: any
) => {
  const result = await pool.query(
    'INSERT INTO projects (user_id, title, description, design, status) VALUES ($1, $2, $3, $4, $5) RETURNING *',
    [userId, title, description, JSON.stringify(design), 'draft']
  );
  return result.rows[0];
};

export const getProjectById = async (id: string) => {
  const result = await pool.query('SELECT * FROM projects WHERE id = $1', [id]);
  return result.rows[0];
};

export const getProjectsByUserId = async (userId: string, limit = 10, offset = 0) => {
  const result = await pool.query(
    'SELECT * FROM projects WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3',
    [userId, limit, offset]
  );
  return result.rows;
};

export const updateProject = async (id: string, updates: any) => {
  const fields = Object.keys(updates);
  const values = Object.values(updates);
  const setClause = fields.map((field, i) => `${field} = $${i + 1}`).join(', ');

  const result = await pool.query(
    `UPDATE projects SET ${setClause}, updated_at = NOW() WHERE id = $${fields.length + 1} RETURNING *`,
    [...values, id]
  );
  return result.rows[0];
};

export const deleteProject = async (id: string) => {
  const result = await pool.query('DELETE FROM projects WHERE id = $1 RETURNING id', [id]);
  return result.rows[0];
};

// Slide Queries
export const createSlide = async (
  projectId: string,
  order: number,
  title: string,
  content: string
) => {
  const result = await pool.query(
    'INSERT INTO slides (project_id, "order", title, content, duration, transition) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
    [projectId, order, title, content, 5, 'fade']
  );
  return result.rows[0];
};

export const getSlidesByProjectId = async (projectId: string) => {
  const result = await pool.query(
    'SELECT * FROM slides WHERE project_id = $1 ORDER BY "order" ASC',
    [projectId]
  );
  return result.rows;
};

export const getSlideById = async (id: string) => {
  const result = await pool.query('SELECT * FROM slides WHERE id = $1', [id]);
  return result.rows[0];
};

export const updateSlide = async (id: string, updates: any) => {
  const fields = Object.keys(updates);
  const values = Object.values(updates);
  const setClause = fields.map((field, i) => `${field} = $${i + 1}`).join(', ');

  const result = await pool.query(
    `UPDATE slides SET ${setClause}, updated_at = NOW() WHERE id = $${fields.length + 1} RETURNING *`,
    [...values, id]
  );
  return result.rows[0];
};

export const deleteSlide = async (id: string) => {
  const result = await pool.query('DELETE FROM slides WHERE id = $1 RETURNING id', [id]);
  return result.rows[0];
};

// Video Job Queries
export const createVideoJob = async (projectId: string, totalSlides: number) => {
  const result = await pool.query(
    'INSERT INTO video_jobs (project_id, total_slides, status, progress) VALUES ($1, $2, $3, $4) RETURNING *',
    [projectId, totalSlides, 'queued', 0]
  );
  return result.rows[0];
};

export const getVideoJobByProjectId = async (projectId: string) => {
  const result = await pool.query(
    'SELECT * FROM video_jobs WHERE project_id = $1 ORDER BY created_at DESC LIMIT 1',
    [projectId]
  );
  return result.rows[0];
};

export const updateVideoJob = async (id: string, updates: any) => {
  const fields = Object.keys(updates);
  const values = Object.values(updates);
  const setClause = fields.map((field, i) => `${field} = $${i + 1}`).join(', ');

  const result = await pool.query(
    `UPDATE video_jobs SET ${setClause}, updated_at = NOW() WHERE id = $${fields.length + 1} RETURNING *`,
    [...values, id]
  );
  return result.rows[0];
};
