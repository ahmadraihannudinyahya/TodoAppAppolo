import { query } from '../db/index.js';

export const TaskModel = {
  async getByProject(project_id) {
    const res = await query(`
      SELECT 
        tasks.id, 
        tasks.project_id, 
        tasks.name, 
        TO_CHAR(tasks.due, 'DD/MM/YYYY HH24:MI') due, 
        tasks.description, 
        tasks.priority, 
        tasks.finished
      FROM tasks 
      JOIN projects 
      ON tasks.project_id = projects.id
      WHERE project_id=$1
      `, [project_id]);
    return res.rows;
  },

  async getByDueDate(ownerId, DueDate) {
    const res = await query(`
      SELECT
        tasks.id, 
        tasks.project_id, 
        tasks.name, 
        TO_CHAR(tasks.due, 'DD/MM/YYYY HH24:MI') due, 
        tasks.description, 
        tasks.priority, 
        tasks.finished
      FROM tasks 
      JOIN projects 
      ON tasks.project_id = projects.id
      WHERE due::date=$1 and owner_id=$2
    `, [DueDate, ownerId]);
    return res.rows;
  },

  async getByPriority(ownerId, priority) {
    const res = await query(`
      SELECT
        tasks.id, 
        tasks.project_id, 
        tasks.name, 
        TO_CHAR(tasks.due, 'DD/MM/YYYY HH24:MI') due, 
        tasks.description, 
        tasks.priority, 
        tasks.finished
      FROM tasks 
      JOIN projects 
      ON tasks.project_id = projects.id
      WHERE priority=$1 and owner_id=$2
    `, [priority, ownerId]);
    return res.rows;
  },

  async getById(id) {
    const res = await query('SELECT * FROM tasks WHERE id=$1', [id]);
    return res.rows[0] || null;
  },

  async add({ project_id, id, name, due, description = '', priority = 'LOW' }) {
    if (id) {
      const res = await query(
        `INSERT INTO tasks (id, project_id, name, due, description, priority)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [id || undefined, project_id, name, due, description, priority]
      );
      return res.rows[0];
    }
    const res = await query(
      `INSERT INTO tasks ( project_id, name, due, description, priority)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [project_id, name, due, description, priority]
    );
    return res.rows[0];
  },

  async update(id, args) {
    const res = await query(
      `
      UPDATE tasks
      SET name = $2,
          description = $3, 
          due=$4, 
          priority=$5
      WHERE id = $1
      RETURNING
        tasks.id, 
        tasks.project_id, 
        tasks.name, 
        TO_CHAR(tasks.due, 'DD/MM/YYYY HH24:MI') due, 
        tasks.description, 
        tasks.priority, 
        tasks.finished;
      `,
      [id, args.name, args.description, args.due, args.priority]
    );
    return res.rows[0];
  },

  async delete(id) {
    await query(
      'delete from tasks WHERE id=$1',
      [id]
    );
  },

  async toggle(id) {
    const res = await query(
      'UPDATE tasks SET finished=NOT finished WHERE id=$1 RETURNING *',
      [id]
    );
    return res.rows[0];
  },
};
