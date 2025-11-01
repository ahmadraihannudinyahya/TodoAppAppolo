import dotenv from 'dotenv'; dotenv.config();

import pkg from 'pg';
const { Pool } = pkg;


export const pool = new Pool({
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  host: process.env.DATABASE_HOST,
  port: process.env.DATABASE_PORT ? parseInt(process.env.DATABASE_PORT) : undefined,
  database: process.env.DATABASE_DATABASE,
});

export async function query(text, params) {
  const client = await pool.connect();
  try {
    const res = await client.query(text, params);
    return res;
  } catch (err) {
    throw err;
  } finally {
    client.release();
  }
}
