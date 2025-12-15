
// This file is for reference on how to connect to Neon DB in your Node.js backend.
// You would run this on a server, not in the browser.

/*
  Dependencies:
  npm install pg
*/

const { Pool } = require('pg');

// Replace this with your actual connection string from Neon Console
const connectionString = process.env.DATABASE_URL || 'postgres://[user]:[password]@[host]/[dbname]?sslmode=require';

const pool = new Pool({
  connectionString,
});

const query = async (text, params) => {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  console.log('executed query', { text, duration, rows: res.rowCount });
  return res;
};

// Example CRUD functions
const getStudents = async () => {
  const { rows } = await query('SELECT * FROM students');
  return rows;
};

const createStudent = async (name, email, grade) => {
  const { rows } = await query(
    'INSERT INTO students(name, email, grade) VALUES($1, $2, $3) RETURNING *',
    [name, email, grade]
  );
  return rows[0];
};

module.exports = {
  query,
  getStudents,
  createStudent,
  pool
};
