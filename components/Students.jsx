
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, Mail } from 'lucide-react';
import { Avatar } from './Avatar.jsx';
import { apiClient, formatError } from '../services/apiClient.js';

const api = {
  students: {
    getAll: async () => apiClient.get('/api/students'),
    add: async (student) => apiClient.post('/api/students', student),
    update: async (id, payload) => apiClient.put(`/api/students/${id}`, payload),
    remove: async (id) => apiClient.delete(`/api/students/${id}`)
  }
};

export const Students = () => {
  const [students, setStudents] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', grade: '', gender: 'male' });
  const [actionsFor, setActionsFor] = useState(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editData, setEditData] = useState({ id: null, name: '', email: '', grade: '', gender: 'male' });
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const data = await api.students.getAll();
      setStudents(data);
    } catch (err) {
      setError(formatError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const tempId = Date.now();
    setStudents((prev) => [{ id: tempId, ...formData }, ...prev]);
    try {
      await api.students.add(formData);
      setSuccess('Student added successfully.');
    } catch (err) {
      setError(formatError(err));
    }
    setFormData({ name: '', email: '', grade: '', gender: 'male' });
    setIsModalOpen(false);
    loadStudents();
  };

  const openActions = (student) => {
    setActionsFor(student.id);
    setEditData({ id: student.id, name: student.name, email: student.email, grade: student.grade || '', gender: student.gender || 'male' });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    const { id, name, email, grade, gender } = editData;
    setStudents((prev) => prev.map((s) => (s.id === id ? { ...s, name, email, grade, gender } : s)));
    try {
      await api.students.update(id, { name, email, grade, gender });
      setSuccess('Student updated successfully.');
    } catch (err) {
      setError(formatError(err));
    }
    setIsEditOpen(false);
    setActionsFor(null);
    loadStudents();
  };

  const confirmDelete = async () => {
    const id = editData.id;
    setStudents((prev) => prev.filter((s) => s.id !== id));
    try {
      await api.students.remove(id);
      setSuccess('Student deleted.');
    } catch (err) {
      setError(formatError(err));
    }
    setIsDeleteOpen(false);
    setActionsFor(null);
    loadStudents();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Students</h1>
          <p className="text-slate-400 mt-1">Manage and view all registered students.</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsModalOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl font-medium flex items-center shadow-lg shadow-indigo-500/20"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Student
        </motion.button>
      </div>
      {error && (
        <div className="p-3 rounded-lg border border-rose-700/40 bg-rose-900/30 text-rose-200 text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="p-3 rounded-lg border border-emerald-700/40 bg-emerald-900/30 text-emerald-200 text-sm">
          {success}
        </div>
      )}
      {loading && (
        <div className="p-2 text-slate-400 text-sm">Loading students…</div>
      )}
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
          <Search className="w-4 h-4" />
        </div>
        <input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by name or email"
          className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {/* List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {(students.filter(s => {
          const q = searchQuery.trim().toLowerCase();
          if (!q) return true;
          return (
            (s.name || '').toLowerCase().includes(q) ||
            (s.email || '').toLowerCase().includes(q) ||
            (s.grade || '').toLowerCase().includes(q)
          );
        })).map((student, idx) => (
          <motion.div
            key={student.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="group bg-slate-900/50 border border-slate-800/60 p-6 rounded-2xl hover:border-indigo-500/30 transition-all hover:bg-slate-800/40 relative overflow-hidden"
            onClick={() => openActions(student)}
          >
            <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
               <div className="w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />
            </div>
            
            <div className="flex items-center space-x-4 mb-4">
              <Avatar src={student.avatar} alt={student.name} className="w-14 h-14 rounded-full bg-slate-800 border-2 border-slate-700 group-hover:border-indigo-500/50 transition-colors" />
              <div>
                <h3 className="font-bold text-lg text-white group-hover:text-indigo-300 transition-colors">{student.name}</h3>
                <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-slate-800 text-slate-400 border border-slate-700">
                  {student.grade}
                </span>
              </div>
            </div>
            
            <div className="flex items-center text-sm text-slate-500 mt-4 pt-4 border-t border-slate-800/50">
              <Mail className="w-4 h-4 mr-2" />
              {student.email}
            </div>
            {actionsFor === student.id && (
              <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center space-x-4">
                <button
                  onClick={(e) => { e.stopPropagation(); setIsEditOpen(true); }}
                  className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-500"
                >
                  Edit
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setIsDeleteOpen(true); }}
                  className="px-4 py-2 rounded-lg bg-rose-600 text-white hover:bg-rose-500"
                >
                  Delete
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setActionsFor(null); }}
                  className="px-4 py-2 rounded-lg bg-slate-700 text-white hover:bg-slate-600"
                >
                  Close
                </button>
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center min-h-screen overflow-y-auto bg-black/60 backdrop-blur-sm p-4">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-slate-900 border border-slate-700 w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl p-6 shadow-2xl"
          >
            <h2 className="text-2xl font-bold text-white mb-6">Add New Student</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Full Name</label>
                <input
                  required
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g. Alex Doe"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Email</label>
                <input
                  required
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="alex@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Grade</label>
                <input
                  required
                  type="text"
                  value={formData.grade}
                  onChange={(e) => setFormData({...formData, grade: e.target.value})}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g. 10th Grade"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Gender</label>
                <select
                  required
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium shadow-lg shadow-indigo-500/20"
                >
                  Add Student
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
      {isEditOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center min-h-screen overflow-y-auto bg-black/60 backdrop-blur-sm p-4">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-slate-900 border border-slate-700 w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl p-6 shadow-2xl"
          >
            <h2 className="text-2xl font-bold text-white mb-6">Edit Student</h2>
            <form onSubmit={handleUpdate} className="space-y-4">
              <input className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white" value={editData.name} onChange={(e) => setEditData({ ...editData, name: e.target.value })} placeholder="Full Name" />
              <input className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white" value={editData.email} onChange={(e) => setEditData({ ...editData, email: e.target.value })} placeholder="Email" />
              <input className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white" value={editData.grade} onChange={(e) => setEditData({ ...editData, grade: e.target.value })} placeholder="Grade" />
              <select className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white" value={editData.gender} onChange={(e) => setEditData({ ...editData, gender: e.target.value })}>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
              <div className="flex justify-end space-x-3 mt-4">
                <button type="button" onClick={() => { setIsEditOpen(false); setActionsFor(null); }} className="px-4 py-2 text-slate-400">Cancel</button>
                <button type="submit" className="px-6 py-2 bg-indigo-600 text-white rounded-lg">Save</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
      {isDeleteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center min-h-screen overflow-y-auto bg-black/60 backdrop-blur-sm p-4">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-slate-900 border border-slate-700 w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl p-6 shadow-2xl"
          >
            <h2 className="text-xl font-bold text-white mb-4">Delete Student?</h2>
            <p className="text-slate-400 mb-6">This action cannot be undone.</p>
            <div className="flex justify-end space-x-3">
              <button onClick={() => { setIsDeleteOpen(false); setActionsFor(null); }} className="px-4 py-2 text-slate-400">Cancel</button>
              <button onClick={confirmDelete} className="px-6 py-2 bg-rose-600 text-white rounded-lg">Delete</button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};
