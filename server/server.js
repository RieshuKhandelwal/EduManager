import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pg from 'pg';
import { createHash } from 'node:crypto';

dotenv.config({ path: '.env.local' });

const app = express();
app.use(express.json());
app.use(cors());

const { Pool } = pg;
const DEFAULT_SCHEMA = 'edu_manager';
function schemaNameFromEnv() {
  const raw = process.env.DB_SCHEMA || DEFAULT_SCHEMA;
  return raw.replace(/[^a-zA-Z0-9_]/g, '_');
}
const SCHEMA = schemaNameFromEnv();
function normalizeConnectionString(cs) {
  try {
    const u = new URL(cs);
    const params = u.searchParams;
    if (params.has('channel_binding')) params.delete('channel_binding');
    return u.toString();
  } catch {
    return cs;
  }
}
const pool = new Pool({
  connectionString: normalizeConnectionString(process.env.DATABASE_URL),
  ssl: { rejectUnauthorized: false }
});
pool.on('connect', (client) => {
  client.query(`SET search_path TO ${SCHEMA}`).catch(() => {});
  client.query(`SET TIME ZONE 'Asia/Kolkata'`).catch(() => {});
});

async function init() {
  await pool.query(`CREATE SCHEMA IF NOT EXISTS ${SCHEMA}`);
  await pool.query(`SET search_path TO ${SCHEMA}`);
  await pool.query(`SET TIME ZONE 'Asia/Kolkata'`);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS students (
      id BIGSERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      grade TEXT NOT NULL,
      gender TEXT NOT NULL DEFAULT 'male',
      avatar TEXT
    );
  `);
  await pool.query(`ALTER TABLE students ADD COLUMN IF NOT EXISTS gender TEXT NOT NULL DEFAULT 'male'`);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS teachers (
      id BIGSERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      subject TEXT NOT NULL,
      gender TEXT NOT NULL DEFAULT 'male',
      avatar TEXT
    );
  `);
  await pool.query(`ALTER TABLE teachers ADD COLUMN IF NOT EXISTS gender TEXT NOT NULL DEFAULT 'male'`);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS courses (
      id BIGSERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      code TEXT UNIQUE NOT NULL,
      description TEXT,
      teacher_id BIGINT REFERENCES teachers(id) ON DELETE SET NULL
    );
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS enrollments (
      id BIGSERIAL PRIMARY KEY,
      student_id BIGINT REFERENCES students(id) ON DELETE CASCADE,
      course_id BIGINT REFERENCES courses(id) ON DELETE CASCADE,
      date DATE NOT NULL DEFAULT CURRENT_DATE,
      UNIQUE (student_id, course_id)
    );
  `);
  const s = await pool.query('SELECT COUNT(*) FROM students');
  const t = await pool.query('SELECT COUNT(*) FROM teachers');
  const c = await pool.query('SELECT COUNT(*) FROM courses');
  if (Number(s.rows[0].count) === 0) {
    await pool.query(
      `INSERT INTO students(name,email,grade,gender,avatar) VALUES
      ('Alice Johnson','alice@example.com','10th','female',$1),
      ('Bob Smith','bob@example.com','11th','male',$2),
      ('Charlie Brown','charlie@example.com','9th','male',$3),
      ('Diana Prince','diana@example.com','12th','female',$4),
      ('Evan Wright','evan@example.com','10th','male',$5)`,
      [
        avatarUrl('Alice Johnson','alice@example.com','female'),
        avatarUrl('Bob Smith','bob@example.com','male'),
        avatarUrl('Charlie Brown','charlie@example.com','male'),
        avatarUrl('Diana Prince','diana@example.com','female'),
        avatarUrl('Evan Wright','evan@example.com','male')
      ]
    );
  }
  if (Number(t.rows[0].count) === 0) {
    await pool.query(
      `INSERT INTO teachers(name,email,subject,gender,avatar) VALUES
      ('Dr. Sarah Connor','sarah@school.edu','Physics','female',$1),
      ('Mr. John Wick','john@school.edu','Physical Education','male',$2),
      ('Ms. Frizzle','frizzle@school.edu','Biology','female',$3)`,
      [
        avatarUrl('Dr. Sarah Connor','sarah@school.edu','female'),
        avatarUrl('Mr. John Wick','john@school.edu','male'),
        avatarUrl('Ms. Frizzle','frizzle@school.edu','female')
      ]
    );
  }
  if (Number(c.rows[0].count) === 0) {
    await pool.query(
      `INSERT INTO courses(name,code,description,teacher_id) VALUES
      ('Advanced Physics','PHYS301','Quantum mechanics and relativity basics.',1),
      ('World History','HIST101','A comprehensive look at global events.',NULL),
      ('Calculus I','MATH201','Limits, derivatives, and integrals.',NULL),
      ('Art History','ART105','Renaissance to Modernism.',3),
      ('Computer Science','CS50','Introduction to programming.',NULL)`
    );
  }

  // Migrate existing avatars to cartoon style if needed
  try {
    const studentsAll = await pool.query(`SELECT id,name,email,gender,avatar FROM students`);
    for (const s of studentsAll.rows) {
      const newAvatar = avatarUrl(s.name, s.email, s.gender);
      await pool.query(`UPDATE students SET avatar = $1 WHERE id = $2`, [newAvatar, s.id]);
    }
    const teachersAll = await pool.query(`SELECT id,name,email,gender,avatar FROM teachers`);
    for (const t of teachersAll.rows) {
      const newAvatar = avatarUrl(t.name, t.email, t.gender);
      await pool.query(`UPDATE teachers SET avatar = $1 WHERE id = $2`, [newAvatar, t.id]);
    }
  } catch {}
}

function seedHash(...parts) {
  const input = parts.filter(Boolean).join('|');
  return createHash('sha256').update(input).digest('hex').slice(0, 12);
}
const MALE_AVATAR = 'https://randomuser.me/api/portraits/men/32.jpg';
const FEMALE_AVATAR = 'https://randomuser.me/api/portraits/women/44.jpg';
function avatarUrl(name, email, gender) {
  return gender === 'female' ? FEMALE_AVATAR : MALE_AVATAR;
}

app.get('/api/students', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM students ORDER BY id DESC');
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch students' });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.post('/api/students', async (req, res) => {
  const { name, email, grade, gender } = req.body || {};
  try {
    const avatar = avatarUrl(name || 'User', email || '', gender);
    const { rows } = await pool.query(
      'INSERT INTO students(name, email, grade, gender, avatar) VALUES($1, $2, $3, $4, $5) RETURNING *',
      [name, email, grade, gender || 'male', avatar]
    );
    res.status(201).json(rows[0]);
  } catch (e) {
    if (e.code === '23505') {
      return res.status(409).json({ error: 'Student email already exists' });
    }
    res.status(500).json({ error: 'Failed to create student' });
  }
});
app.put('/api/students/:id', async (req, res) => {
  const { id } = req.params;
  const { name, email, grade, gender, avatar: avatarFromBody } = req.body || {};
  try {
    const existing = await pool.query('SELECT avatar FROM students WHERE id = $1', [id]);
    const currentAvatar = existing.rows[0]?.avatar || null;
    const avatar = avatarFromBody || currentAvatar;
    const { rows } = await pool.query(
      'UPDATE students SET name = $1, email = $2, grade = $3, gender = $4, avatar = $5 WHERE id = $6 RETURNING *',
      [name, email, grade, gender || 'male', avatar, id]
    );
    res.json(rows[0]);
  } catch (e) {
    if (e.code === '23505') {
      return res.status(409).json({ error: 'Student email already exists' });
    }
    res.status(500).json({ error: 'Failed to update student' });
  }
});
app.delete('/api/students/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM students WHERE id = $1', [id]);
    res.status(204).end();
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to delete student' });
  }
});

app.get('/api/teachers', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM teachers ORDER BY id DESC');
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to fetch teachers' });
  }
});

app.post('/api/teachers', async (req, res) => {
  const { name, email, subject, gender } = req.body || {};
  try {
    const avatar = avatarUrl(name || 'Teacher', email || '', gender);
    const { rows } = await pool.query(
      'INSERT INTO teachers(name, email, subject, gender, avatar) VALUES($1, $2, $3, $4, $5) RETURNING *',
      [name, email, subject, gender || 'male', avatar]
    );
    res.status(201).json(rows[0]);
  } catch (e) {
    if (e.code === '23505') {
      return res.status(409).json({ error: 'Teacher email already exists' });
    }
    res.status(500).json({ error: 'Failed to create teacher' });
  }
});
app.put('/api/teachers/:id', async (req, res) => {
  const { id } = req.params;
  const { name, email, subject, gender } = req.body || {};
  try {
    const avatar = avatarUrl(name || 'Teacher', email || '', gender);
    const { rows } = await pool.query(
      'UPDATE teachers SET name = $1, email = $2, subject = $3, gender = $4, avatar = $5 WHERE id = $6 RETURNING *',
      [name, email, subject, gender || 'male', avatar, id]
    );
    res.json(rows[0]);
  } catch (e) {
    if (e.code === '23505') {
      return res.status(409).json({ error: 'Teacher email already exists' });
    }
    res.status(500).json({ error: 'Failed to update teacher' });
  }
});
app.delete('/api/teachers/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM teachers WHERE id = $1', [id]);
    res.status(204).end();
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to delete teacher' });
  }
});

app.get('/api/courses', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM courses ORDER BY id DESC');
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to fetch courses' });
  }
});

app.post('/api/courses', async (req, res) => {
  const { name, code, description } = req.body || {};
  try {
    const { rows } = await pool.query(
      'INSERT INTO courses(name, code, description) VALUES($1, $2, $3) RETURNING *',
      [name, code, description]
    );
    res.status(201).json(rows[0]);
  } catch (e) {
    if (e.code === '23505') {
      return res.status(409).json({ error: 'Course code already exists' });
    }
    res.status(500).json({ error: 'Failed to create course' });
  }
});

app.put('/api/courses/:id/assign', async (req, res) => {
  const { id } = req.params;
  const { teacherId } = req.body || {};
  try {
    if (teacherId) {
      const teacher = await pool.query('SELECT id FROM teachers WHERE id = $1', [teacherId]);
      if (teacher.rowCount === 0) {
        return res.status(400).json({ error: 'Invalid teacher id' });
      }
    }
    const { rows } = await pool.query(
      'UPDATE courses SET teacher_id = $1 WHERE id = $2 RETURNING *',
      [teacherId || null, id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Course not found' });
    res.json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: 'Failed to assign teacher' });
  }
});

app.get('/api/enrollments', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM enrollments ORDER BY id DESC');
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to fetch enrollments' });
  }
});

app.post('/api/enrollments', async (req, res) => {
  const { studentId, courseId } = req.body || {};
  try {
    const { rows } = await pool.query(
      'INSERT INTO enrollments(student_id, course_id) VALUES($1, $2) ON CONFLICT (student_id, course_id) DO NOTHING RETURNING *',
      [studentId, courseId]
    );
    if (!rows[0]) return res.status(409).json({ error: 'Student already enrolled in this course' });
    res.status(201).json(rows[0] || null);
  } catch (e) {
    res.status(500).json({ error: 'Failed to create enrollment' });
  }
});

const port = process.env.PORT || 4000;

init()
  .then(() => {
    app.listen(port, () => {});
  })
  .catch(() => {
    app.listen(port, () => {});
  });
