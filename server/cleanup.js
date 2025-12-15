import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config({ path: '.env.local' });

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

const { Pool } = pg;
const pool = new Pool({
  connectionString: normalizeConnectionString(process.env.DATABASE_URL),
  ssl: { rejectUnauthorized: false }
});

async function run() {
  console.log('Starting Neon cleanup, preserving schema: edu_manager');
  await pool.query(`SET TIME ZONE 'Asia/Kolkata'`);
  // Truncate all non-edu_manager, non-system tables
  await pool.query(`
    DO $$
    DECLARE r RECORD;
    BEGIN
      FOR r IN
        SELECT table_schema, table_name
        FROM information_schema.tables
        WHERE table_type = 'BASE TABLE'
          AND table_schema NOT IN ('edu_manager','pg_catalog','information_schema','pg_toast')
      LOOP
        EXECUTE format('TRUNCATE TABLE %I.%I CASCADE', r.table_schema, r.table_name);
      END LOOP;
    END $$;
  `);
  console.log('Truncated non-edu_manager tables.');

  // Drop non-essential user schemas excluding edu_manager and public
  await pool.query(`
    DO $$
    DECLARE s RECORD;
    BEGIN
      FOR s IN
        SELECT nspname
        FROM pg_namespace
        WHERE nspname NOT IN ('edu_manager','public','pg_catalog','information_schema','pg_toast')
          AND nspname NOT LIKE 'pg_temp_%'
          AND nspname NOT LIKE 'pg_%'
      LOOP
        EXECUTE format('DROP SCHEMA %I CASCADE', s.nspname);
      END LOOP;
    END $$;
  `);
  console.log('Dropped non-essential user schemas.');

  // Drop public schema as requested
  await pool.query(`DROP SCHEMA IF EXISTS public CASCADE`);
  console.log('Dropped public schema.');

  // Summary: list remaining schemas and counts from edu_manager tables
  const schemas = await pool.query(`
    SELECT nspname AS schema
    FROM pg_namespace
    WHERE nspname NOT LIKE 'pg_%'
    ORDER BY 1
  `);
  console.log('Remaining schemas:', schemas.rows.map(r => r.schema));
  const counts = {};
  try {
    const s = await pool.query('SELECT COUNT(*)::int AS c FROM edu_manager.students');
    const t = await pool.query('SELECT COUNT(*)::int AS c FROM edu_manager.teachers');
    const c = await pool.query('SELECT COUNT(*)::int AS c FROM edu_manager.courses');
    const e = await pool.query('SELECT COUNT(*)::int AS c FROM edu_manager.enrollments');
    counts.students = s.rows[0].c;
    counts.teachers = t.rows[0].c;
    counts.courses = c.rows[0].c;
    counts.enrollments = e.rows[0].c;
  } catch (err) {
    console.log('Note: edu_manager tables summary skipped:', err.message);
  }
  console.log('edu_manager counts:', counts);
}

run()
  .then(() => {
    console.log('Cleanup complete.');
    return pool.end();
  })
  .catch((err) => {
    console.error('Cleanup failed:', err);
    return pool.end();
  });
