
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, User, BookOpen } from 'lucide-react';
import { Avatar } from './Avatar.jsx';
async function jsonOr(res, fallback) {
  const text = await res.text();
  if (!text) return fallback;
  try { return JSON.parse(text); } catch { return fallback; }
}
const api = {
  courses: {
    getAll: async () => {
      const res = await fetch('/api/courses');
      const data = await jsonOr(res, []);
      return data.map(c => ({
        ...c,
        id: Number(c.id),
        teacherId: c.teacher_id != null ? Number(c.teacher_id) : null
      }));
    },
    add: async (course) => {
      const res = await fetch('/api/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(course)
      });
      const c = await jsonOr(res, null);
      return {
        ...c,
        id: Number(c.id),
        teacherId: c.teacher_id != null ? Number(c.teacher_id) : null
      };
    },
    assignTeacher: async (courseId, teacherId) => {
      const res = await fetch(`/api/courses/${courseId}/assign`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teacherId })
      });
      const c = await jsonOr(res, null);
      return {
        ...c,
        id: Number(c.id),
        teacherId: c.teacher_id != null ? Number(c.teacher_id) : null
      };
    }
  },
  teachers: {
    getAll: async () => {
      const res = await fetch('/api/teachers');
      const data = await jsonOr(res, []);
      return data.map(t => ({ ...t, id: Number(t.id) }));
    }
  }
};

export const Courses = () => {
  const [courses, setCourses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  
  const [formData, setFormData] = useState({ name: '', code: '', description: '' });
  const [assignData, setAssignData] = useState({ teacherId: '' });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [cData, tData] = await Promise.all([api.courses.getAll(), api.teachers.getAll()]);
    setCourses(cData);
    setTeachers(tData);
  };

  const handleAddCourse = async (e) => {
    e.preventDefault();
    await api.courses.add(formData);
    setFormData({ name: '', code: '', description: '' });
    setIsModalOpen(false);
    loadData();
  };

  const handleAssignTeacher = async (e) => {
    e.preventDefault();
    if (selectedCourse && assignData.teacherId) {
      await api.courses.assignTeacher(selectedCourse.id, assignData.teacherId);
      setIsAssignModalOpen(false);
      setSelectedCourse(null);
      setAssignData({ teacherId: '' });
      loadData();
    }
  };

  const openAssignModal = (course) => {
    setSelectedCourse(course);
    setAssignData({ teacherId: course.teacherId || '' });
    setIsAssignModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Courses</h1>
          <p className="text-slate-400 mt-1">Curriculum and teacher assignments.</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsModalOpen(true)}
          className="bg-amber-600 hover:bg-amber-500 text-white px-5 py-2.5 rounded-xl font-medium flex items-center shadow-lg shadow-amber-500/20"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Course
        </motion.button>
      </div>

      <div className="space-y-4">
        {courses.map((course, idx) => {
          const teacher = teachers.find(t => t.id === course.teacherId);
          return (
            <motion.div
              key={course.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="group flex flex-col md:flex-row md:items-center justify-between bg-slate-900/40 border border-slate-800/60 p-6 rounded-2xl hover:border-amber-500/30 transition-all"
            >
              <div className="flex items-start space-x-4">
                <div className="p-3 rounded-lg bg-amber-500/10 text-amber-500">
                  <BookOpen className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">{course.name}</h3>
                  <div className="flex items-center space-x-2 text-sm text-slate-500 mt-1">
                    <span className="bg-slate-800 px-2 py-0.5 rounded text-slate-400 border border-slate-700 font-mono">{course.code}</span>
                    <span>•</span>
                    <span className="line-clamp-1">{course.description}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 md:mt-0 flex items-center space-x-4">
                <div className="flex items-center">
                  {teacher ? (
                    <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-800/50 border border-slate-700/50">
                      <Avatar src={teacher.avatar} className="w-6 h-6 rounded-full" alt="" />
                      <span className="text-sm text-slate-300">{teacher.name}</span>
                    </div>
                  ) : (
                    <span className="text-sm text-slate-500 italic px-3">No teacher assigned</span>
                  )}
                </div>
                <button
                  onClick={() => openAssignModal(course)}
                  className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors"
                >
                  {teacher ? 'Reassign' : 'Assign Teacher'}
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Add Course Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl p-6 shadow-2xl">
            <h2 className="text-2xl font-bold text-white mb-6">Create Course</h2>
            <form onSubmit={handleAddCourse} className="space-y-4">
              <input required placeholder="Course Name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white" />
              <input required placeholder="Course Code (e.g. CS101)" value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white" />
              <textarea placeholder="Description" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white h-24" />
              <div className="flex justify-end space-x-3 mt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-400">Cancel</button>
                <button type="submit" className="px-6 py-2 bg-amber-600 text-white rounded-lg">Create</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Assign Teacher Modal */}
      {isAssignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl p-6 shadow-2xl">
            <h2 className="text-2xl font-bold text-white mb-2">Assign Teacher</h2>
            <p className="text-slate-400 mb-6">For course: <span className="text-amber-500">{selectedCourse?.name}</span></p>
            <form onSubmit={handleAssignTeacher} className="space-y-4">
              <select 
                required 
                value={assignData.teacherId} 
                onChange={e => setAssignData({ teacherId: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white appearance-none"
              >
                <option value="">Select a teacher...</option>
                {teachers.map(t => (
                  <option key={t.id} value={t.id}>{t.name} ({t.subject})</option>
                ))}
              </select>
              <div className="flex justify-end space-x-3 mt-4">
                <button type="button" onClick={() => setIsAssignModalOpen(false)} className="px-4 py-2 text-slate-400">Cancel</button>
                <button type="submit" className="px-6 py-2 bg-indigo-600 text-white rounded-lg">Save Assignment</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};
