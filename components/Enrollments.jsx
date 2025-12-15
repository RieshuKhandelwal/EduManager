
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, UserPlus, Search } from 'lucide-react';
import { Avatar } from './Avatar.jsx';
import { apiClient, formatError } from '../services/apiClient.js';
const api = {
  students: {
    getAll: async () => {
      const data = await apiClient.get('/api/students');
      return data.map(s => ({ ...s, id: Number(s.id) }));
    }
  },
  courses: {
    getAll: async () => {
      const data = await apiClient.get('/api/courses');
      return data.map(c => ({
        ...c,
        id: Number(c.id),
        teacherId: c.teacher_id != null ? Number(c.teacher_id) : null
      }));
    }
  },
  teachers: {
    getAll: async () => {
      const data = await apiClient.get('/api/teachers');
      return data.map(t => ({ ...t, id: Number(t.id) }));
    }
  },
  enrollments: {
    getAll: async () => {
      const data = await apiClient.get('/api/enrollments');
      return data.map(e => ({
        ...e,
        id: Number(e.id),
        studentId: Number(e.student_id),
        courseId: Number(e.course_id)
      }));
    },
    add: async (studentId, courseId) => {
      return apiClient.post('/api/enrollments', { studentId, courseId });
    }
  }
};

export const Enrollments = () => {
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ studentId: '', courseId: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [sData, cData, tData, eData] = await Promise.all([
        api.students.getAll(), 
        api.courses.getAll(), 
        api.teachers.getAll(),
        api.enrollments.getAll()
      ]);
      setStudents(sData);
      setCourses(cData);
      setTeachers(tData);
      setEnrollments(eData);
    } catch (err) {
      setError(formatError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async (e) => {
    e.preventDefault();
    if (formData.studentId && formData.courseId) {
      // Check if already enrolled
      const exists = enrollments.some(e => e.studentId == formData.studentId && e.courseId == formData.courseId);
      if (!exists) {
        try {
          await api.enrollments.add(formData.studentId, formData.courseId);
        } catch (err) {
          setError(formatError(err));
        } finally {
          setFormData({ studentId: '', courseId: '' });
          setIsModalOpen(false);
          loadData();
        }
      } else {
        setError('Student already enrolled in this course');
      }
    }
  };

  // Helper to check enrollment status for matrix
  const isEnrolled = (studentId, courseId) => {
    return enrollments.some(e => e.studentId === studentId && e.courseId === courseId);
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Enrollment Status</h1>
          <p className="text-slate-400 mt-1">Track student participation across courses.</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsModalOpen(true)}
          className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-xl font-medium flex items-center shadow-lg shadow-emerald-500/20"
        >
          <UserPlus className="w-5 h-5 mr-2" />
          Enroll Student
        </motion.button>
      </div>
      {error && (
        <div className="p-3 rounded-lg border border-rose-700/40 bg-rose-900/30 text-rose-200 text-sm">
          {error}
        </div>
      )}
      {loading && (
        <div className="p-2 text-slate-400 text-sm">Loading enrollments…</div>
      )}

      {/* Matrix View */}
      <div className="bg-slate-900/50 border border-slate-800/60 rounded-2xl overflow-hidden overflow-x-auto shadow-2xl">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr>
              <th className="p-4 border-b border-slate-800 bg-slate-900/80 text-slate-400 font-medium sticky left-0 z-10 backdrop-blur-md min-w-[200px]">Student / Course</th>
              {courses.map(course => (
                <th key={course.id} className="p-4 border-b border-slate-800 bg-slate-900/40 text-slate-300 font-medium whitespace-nowrap min-w-[150px]">
                  <div className="flex flex-col">
                    <span>{course.name}</span>
                    <span className="text-xs text-slate-500 font-normal">{course.code}</span>
                    <div className="mt-2 flex items-center space-x-2 text-xs text-slate-400">
                      {(() => {
                        const teacher = teachers.find(t => t.id === course.teacherId);
                        if (teacher) {
                          return (
                            <>
                              <Avatar src={teacher.avatar} className="w-5 h-5 rounded-full" alt={teacher.name} />
                              <span>{teacher.name}</span>
                              <span className="text-slate-500">({teacher.subject})</span>
                            </>
                          );
                        }
                        return <span className="text-slate-500">Unassigned</span>;
                      })()}
                    </div>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {students.map((student, idx) => (
              <motion.tr 
                key={student.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="hover:bg-slate-800/30 transition-colors border-b border-slate-800/40 last:border-0"
              >
                <td className="p-4 bg-slate-900/20 font-medium text-slate-200 sticky left-0 backdrop-blur-sm border-r border-slate-800/40">
                  <div className="flex items-center space-x-3">
                    <Avatar src={student.avatar} className="w-8 h-8 rounded-full" alt={student.name} />
                    <span>{student.name}</span>
                  </div>
                </td>
                {courses.map(course => {
                  const enrolled = isEnrolled(student.id, course.id);
                  return (
                    <td key={course.id} className="p-4 text-center">
                      {enrolled ? (
                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="inline-flex justify-center items-center w-8 h-8 bg-emerald-500/20 rounded-full text-emerald-400">
                          <CheckCircle2 className="w-5 h-5" />
                        </motion.div>
                      ) : (
                        <span className="block w-2 h-2 rounded-full bg-slate-800 mx-auto" />
                      )}
                    </td>
                  );
                })}
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Enroll Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl p-6 shadow-2xl">
            <h2 className="text-2xl font-bold text-white mb-6">Enroll Student</h2>
            <form onSubmit={handleEnroll} className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Student</label>
                <select 
                  required 
                  value={formData.studentId} 
                  onChange={e => setFormData({...formData, studentId: e.target.value})}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white"
                >
                  <option value="">Select Student...</option>
                  {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Course</label>
                <select 
                  required 
                  value={formData.courseId} 
                  onChange={e => setFormData({...formData, courseId: e.target.value})}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white"
                >
                  <option value="">Select Course...</option>
                  {courses.map(c => <option key={c.id} value={c.id}>{c.name} ({c.code})</option>)}
                </select>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-400">Cancel</button>
                <button type="submit" className="px-6 py-2 bg-emerald-600 text-white rounded-lg">Confirm Enrollment</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};
