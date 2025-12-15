
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Book, Mail, Search } from 'lucide-react';
import { Avatar } from './Avatar.jsx';

const API_BASE = import.meta.env.VITE_API_URL || '';
const api = {
  teachers: {
    getAll: async () => {
      const res = await fetch(`${API_BASE}/api/teachers`);
      const text = await res.text();
      const data = text ? JSON.parse(text) : [];
      return data;
    },
    add: async (teacher) => {
      const res = await fetch(`${API_BASE}/api/teachers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(teacher)
      });
      if (!res.ok) throw new Error('Failed to save teacher');
      return res.json();
    },
    update: async (id, payload) => {
      const res = await fetch(`${API_BASE}/api/teachers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('Failed to update teacher');
      return res.json();
    },
    remove: async (id) => {
      const res = await fetch(`${API_BASE}/api/teachers/${id}`, { method: 'DELETE' });
      if (!res.ok && res.status !== 204) throw new Error('Failed to delete teacher');
    }
  }
};

export const Teachers = () => {
  const [teachers, setTeachers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', gender: 'male' });
  const [actionsFor, setActionsFor] = useState(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editData, setEditData] = useState({ id: null, name: '', email: '', subject: '', gender: 'male' });
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadTeachers();
  }, []);

  const loadTeachers = async () => {
    const data = await api.teachers.getAll();
    setTeachers(data);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const tempId = Date.now();
    setTeachers((prev) => [{ id: tempId, ...formData }, ...prev]);
    try {
      await api.teachers.add(formData);
    } catch (err) {
      alert('Failed to save teacher to database');
    }
    setFormData({ name: '', email: '', subject: '', gender: 'male' });
    setIsModalOpen(false);
    loadTeachers();
  };

  const openActions = (teacher) => {
    setActionsFor(teacher.id);
    setEditData({ id: teacher.id, name: teacher.name, email: teacher.email, subject: teacher.subject || '', gender: teacher.gender || 'male' });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    const { id, name, email, subject, gender } = editData;
    setTeachers((prev) => prev.map((t) => (t.id === id ? { ...t, name, email, subject, gender } : t)));
    try {
      await api.teachers.update(id, { name, email, subject, gender });
    } catch (err) {
      alert('Failed to update teacher in database');
    }
    setIsEditOpen(false);
    setActionsFor(null);
    loadTeachers();
  };

  const confirmDelete = async () => {
    const id = editData.id;
    setTeachers((prev) => prev.filter((t) => t.id !== id));
    try {
      await api.teachers.remove(id);
    } catch (err) {
      alert('Failed to delete teacher from database');
    }
    setIsDeleteOpen(false);
    setActionsFor(null);
    loadTeachers();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Teachers</h1>
          <p className="text-slate-400 mt-1">Faculty directory and management.</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsModalOpen(true)}
          className="bg-purple-600 hover:bg-purple-500 text-white px-5 py-2.5 rounded-xl font-medium flex items-center shadow-lg shadow-purple-500/20"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Teacher
        </motion.button>
      </div>
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
          <Search className="w-4 h-4" />
        </div>
        <input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by name, email, or subject"
          className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {(teachers.filter(t => {
          const q = searchQuery.trim().toLowerCase();
          if (!q) return true;
          return (
            (t.name || '').toLowerCase().includes(q) ||
            (t.email || '').toLowerCase().includes(q) ||
            (t.subject || '').toLowerCase().includes(q)
          );
        })).map((teacher, idx) => (
          <motion.div
            key={teacher.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.05 }}
            className="group bg-slate-900/50 border border-slate-800/60 p-6 rounded-2xl hover:border-purple-500/30 transition-all hover:bg-slate-800/40 relative overflow-hidden"
            onClick={() => openActions(teacher)}
          >
            <div className="flex flex-col items-center text-center">
              <div className="relative">
                <div className="absolute inset-0 bg-purple-500/20 blur-xl rounded-full scale-0 group-hover:scale-110 transition-transform duration-500" />
                <Avatar src={teacher.avatar} alt={teacher.name} className="relative w-20 h-20 rounded-full bg-slate-800 border-4 border-slate-900 group-hover:border-purple-500/50 transition-colors" />
              </div>
              <h3 className="mt-4 font-bold text-lg text-white">{teacher.name}</h3>
              <div className="flex items-center mt-1 space-x-2">
                 <span className="text-purple-400 text-sm font-medium flex items-center">
                   <Book className="w-3 h-3 mr-1" />
                   {teacher.subject}
                 </span>
              </div>
              <div className="mt-4 w-full pt-4 border-t border-slate-800/50">
                 <a href={`mailto:${teacher.email}`} className="text-sm text-slate-500 hover:text-purple-300 transition-colors flex items-center justify-center">
                   <Mail className="w-3 h-3 mr-2" />
                   {teacher.email}
                 </a>
              </div>
            </div>
            {actionsFor === teacher.id && (
              <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center space-x-4">
                <button
                  onClick={(e) => { e.stopPropagation(); setIsEditOpen(true); }}
                  className="px-4 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-500"
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

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center min-h-screen overflow-y-auto bg-black/60 backdrop-blur-sm p-4">
          <motion.div 
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="bg-slate-900 border border-slate-700 w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl p-6 shadow-2xl"
          >
            <h2 className="text-2xl font-bold text-white mb-6">Add New Teacher</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Name</label>
                <input required type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-purple-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Email</label>
                <input required type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-purple-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Subject</label>
                <input required type="text" value={formData.subject} onChange={(e) => setFormData({...formData, subject: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-purple-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Gender</label>
                <select required value={formData.gender} onChange={(e) => setFormData({ ...formData, gender: e.target.value })} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-purple-500">
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">Cancel</button>
                <button type="submit" className="px-6 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-medium shadow-lg shadow-purple-500/20">Add Teacher</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
      {isEditOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center min-h-screen overflow-y-auto bg-black/60 backdrop-blur-sm p-4">
          <motion.div 
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="bg-slate-900 border border-slate-700 w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl p-6 shadow-2xl"
          >
            <h2 className="text-2xl font-bold text-white mb-6">Edit Teacher</h2>
            <form onSubmit={handleUpdate} className="space-y-4">
              <input className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white" value={editData.name} onChange={(e) => setEditData({ ...editData, name: e.target.value })} placeholder="Name" />
              <input className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white" value={editData.email} onChange={(e) => setEditData({ ...editData, email: e.target.value })} placeholder="Email" />
              <input className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white" value={editData.subject} onChange={(e) => setEditData({ ...editData, subject: e.target.value })} placeholder="Subject" />
              <select className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white" value={editData.gender} onChange={(e) => setEditData({ ...editData, gender: e.target.value })}>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
              <div className="flex justify-end space-x-3 mt-4">
                <button type="button" onClick={() => { setIsEditOpen(false); setActionsFor(null); }} className="px-4 py-2 text-slate-400">Cancel</button>
                <button type="submit" className="px-6 py-2 bg-purple-600 text-white rounded-lg">Save</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
      {isDeleteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center min-h-screen overflow-y-auto bg-black/60 backdrop-blur-sm p-4">
          <motion.div 
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="bg-slate-900 border border-slate-700 w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl p-6 shadow-2xl"
          >
            <h2 className="text-xl font-bold text-white mb-4">Delete Teacher?</h2>
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
