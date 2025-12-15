
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Users, GraduationCap, BookOpen, ClipboardList, ArrowUpRight, Plus } from 'lucide-react';
import { Avatar } from './Avatar.jsx';
const API_BASE = import.meta.env.VITE_API_URL || '';

async function jsonOr(res, fallback) {
  const text = await res.text();
  if (!text) return fallback;
  try { return JSON.parse(text); } catch { return fallback; }
}
const api = {
  students: { 
    getAll: async () => {
      const res = await fetch(`${API_BASE}/api/students`);
      const data = await jsonOr(res, []);
      return data.map(s => ({ ...s, id: Number(s.id) }));
    } 
  },
  teachers: { 
    getAll: async () => {
      const res = await fetch(`${API_BASE}/api/teachers`);
      const data = await jsonOr(res, []);
      return data.map(t => ({ ...t, id: Number(t.id) }));
    } 
  },
  courses: { 
    getAll: async () => {
      const res = await fetch(`${API_BASE}/api/courses`);
      const data = await jsonOr(res, []);
      return data.map(c => ({
        ...c,
        id: Number(c.id),
        teacherId: c.teacher_id != null ? Number(c.teacher_id) : null
      }));
    } 
  },
  enrollments: { 
    getAll: async () => {
      const res = await fetch(`${API_BASE}/api/enrollments`);
      const data = await jsonOr(res, []);
      return data.map(e => ({
        ...e,
        id: Number(e.id),
        studentId: Number(e.student_id),
        courseId: Number(e.course_id)
      }));
    } 
  }
};

const StatCard = ({ title, value, subtitle, icon: Icon, color, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.5 }}
    className="bg-slate-900/60 backdrop-blur-md border border-slate-800/60 p-6 rounded-2xl relative overflow-hidden group hover:border-slate-700/80 transition-colors"
  >
    <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity ${color}`}>
      <Icon className="w-24 h-24 -mr-8 -mt-8 rotate-12" />
    </div>
    <div className="relative z-10 flex justify-between items-start">
      <div>
        <p className="text-slate-400 text-sm font-medium mb-1">{title}</p>
        <h3 className="text-4xl font-bold text-white mb-2 tracking-tight">{value}</h3>
        <p className="text-slate-500 text-xs">{subtitle}</p>
      </div>
      <div className={`p-3 rounded-xl bg-slate-800/50 ${color} bg-opacity-10 text-white shadow-inner`}>
        <Icon className="w-6 h-6" />
      </div>
    </div>
  </motion.div>
);

const QuickAction = ({ title, onClick }) => (
  <motion.button
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
    onClick={onClick}
    className="w-full flex items-center justify-between p-4 bg-slate-800/40 hover:bg-slate-800/60 border border-slate-700/50 rounded-xl group transition-all"
  >
    <span className="font-medium text-slate-200 group-hover:text-white">{title}</span>
    <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 transition-colors" />
  </motion.button>
);

export const Dashboard = ({ navigate }) => {
  const [stats, setStats] = useState({ students: 0, teachers: 0, courses: 0, enrollments: 0 });
  const [recentEnrollments, setRecentEnrollments] = useState([]);
  const formatIST = (dateStr) => {
    try {
      const d = new Date(dateStr);
      return new Intl.DateTimeFormat('en-IN', { timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short', year: 'numeric' }).format(d);
    } catch {
      return dateStr;
    }
  };

  useEffect(() => {
    Promise.all([
      api.students.getAll(),
      api.teachers.getAll(),
      api.courses.getAll(),
      api.enrollments.getAll()
    ]).then(([students, teachers, courses, enrollments]) => {
      setStats({
        students: students.length,
        teachers: teachers.length,
        courses: courses.length,
        enrollments: enrollments.length
      });

      // Process recent enrollments
      const recent = enrollments.slice(-3).reverse().map(enroll => {
        const student = students.find(s => s.id === enroll.studentId);
        const course = courses.find(c => c.id === enroll.courseId);
        return { ...enroll, student, course };
      });
      setRecentEnrollments(recent);
    });
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-white mb-2">Dashboard</h1>
        <p className="text-slate-400">Overview of the school's current status and metrics.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Students" 
          value={stats.students} 
          subtitle="Active students enrolled" 
          icon={Users} 
          color="text-blue-400" 
          delay={0.1}
        />
        <StatCard 
          title="Total Teachers" 
          value={stats.teachers} 
          subtitle="Faculty members" 
          icon={GraduationCap} 
          color="text-purple-400" 
          delay={0.2}
        />
        <StatCard 
          title="Active Courses" 
          value={stats.courses} 
          subtitle="Courses offered this term" 
          icon={BookOpen} 
          color="text-amber-400" 
          delay={0.3}
        />
        <StatCard 
          title="Total Enrollments" 
          value={stats.enrollments} 
          subtitle="Student course registrations" 
          icon={ClipboardList} 
          color="text-emerald-400" 
          delay={0.4}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-xl font-bold text-white">Recent Enrollments</h2>
          <div className="bg-slate-900/40 border border-slate-800/60 rounded-2xl p-2 space-y-2">
            {recentEnrollments.map((item, idx) => (
              <motion.div 
                key={item.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + (idx * 0.1) }}
                className="flex items-center p-4 bg-slate-800/20 rounded-xl hover:bg-slate-800/40 transition-colors"
              >
                <Avatar src={item.student?.avatar} alt="Avatar" className="w-10 h-10 rounded-full bg-slate-700" />
                <div className="ml-4 flex-1">
                  <p className="font-medium text-slate-200">{item.student?.name}</p>
                  <p className="text-sm text-slate-500">Enrolled in <span className="text-indigo-400">{item.course?.name}</span></p>
                </div>
                <span className="text-xs font-mono text-slate-500 bg-slate-900/50 px-2 py-1 rounded">
                  {formatIST(item.date)}
                </span>
              </motion.div>
            ))}
            {recentEnrollments.length === 0 && (
              <div className="p-8 text-center text-slate-500">No enrollments found.</div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <h2 className="text-xl font-bold text-white">Quick Actions</h2>
          <div className="space-y-3">
            <QuickAction title="Enroll New Student" onClick={() => navigate('enrollments')} />
            <QuickAction title="Assign Teacher" onClick={() => navigate('courses')} />
            <QuickAction title="Add Course" onClick={() => navigate('courses')} />
          </div>
        </div>
      </div>
    </div>
  );
};
