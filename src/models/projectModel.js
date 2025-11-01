import { query } from '../db/index.js';

export const ProjectModel = {
  async getAll(ownerId) {
    const res = await query(`
      SELECT
        projects.id, 
        projects.name, 
        projects.description, 
        projects.owner_id
      FROM projects WHERE projects.owner_id=$1
    `, [ownerId]);
    return res.rows;
  },

  async getById(ownerId, id) {
    const res = await query(`
      SELECT
        projects.id, 
        projects.name, 
        projects.description, 
        projects.owner_id
      FROM projects WHERE id=$1 AND owner_id=$2
    `, [id, ownerId]);
    return res.rows[0] || null;
  },

  async create(ownerId, id, name, description) {
    if (id) {
      const res = await query(
        'INSERT INTO projects (id, name, description, owner_id) VALUES ($1, $2, $3, $4) RETURNING *',
        [id, name, description, ownerId]
      );
      return res.rows[0];
    }
    const res = await query(
      'INSERT INTO projects (name, description, owner_id) VALUES ($1, $2, $3) RETURNING *',
      [name, description, ownerId]
    );
    return res.rows[0];
  },

  async update(id, name, description) {
    const res = await query(
      `
      UPDATE projects
      SET name = $1,
          description = $2
      WHERE id = $3
      RETURNING *;
      `,
      [name, description, id]
    );
    return res.rows[0];
  },

  async delete(id) {
    await query(
      'delete from projects WHERE id=$1',
      [id]
    );
  },
};
