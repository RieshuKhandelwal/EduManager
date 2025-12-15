# EduManager

Simple student–teacher module with courses and enrollments.

## Features
- List and manage students and teachers
- List courses and assign a teacher to each course
- Enroll students into courses
- Enrollment matrix to see who is in which course

## Tech Stack
- Frontend: React + Vite
- Backend: Express + PostgreSQL (Neon)
- UI: Tailwind CDN, Framer Motion, Lucide icons

## Getting Started
1) Install dependencies
```
npm install
```
2) Configure env vars (see `.env.example`)
- `DATABASE_URL` – Neon connection string (with SSL)
- `DB_SCHEMA` (optional) – schema name, defaults to `edu_manager`
3) Run servers
```
npm run server   # starts API on 4000
npm run dev      # starts Vite on 3000, proxies /api to 4000
```

## API Endpoints (summary)
- `GET/POST/PUT/DELETE /api/students`
- `GET/POST/PUT/DELETE /api/teachers`
- `GET/POST /api/courses` and `PUT /api/courses/:id/assign`
- `GET/POST /api/enrollments`

## Deployment Notes
- Frontend can be deployed to Vercel/Netlify; set proxy or env for API URL.
- Backend can be deployed to Render/Railway/Fly; set `DATABASE_URL` (Neon) and optional `DB_SCHEMA`.

## Manual Test Checklist
- Add/update/delete student and teacher
- Add course and assign teacher
- Enroll student; enrollment matrix updates
- Duplicate enrollments are handled gracefully
