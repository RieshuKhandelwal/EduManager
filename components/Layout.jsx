
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, Users, GraduationCap, BookOpen, ClipboardList, LogOut } from 'lucide-react';

const SidebarItem = ({ icon: Icon, label, isActive, onClick }) => {
  return (
    <motion.button
      whileHover={{ scale: 1.02, x: 4 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
        isActive 
          ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30' 
          : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50'
      }`}
    >
      <Icon className={`w-5 h-5 ${isActive ? 'text-indigo-400' : 'text-slate-500 group-hover:text-slate-300'}`} />
      <span className="font-medium text-sm">{label}</span>
      {isActive && (
        <motion.div
          layoutId="activeTab"
          className="absolute left-0 w-1 h-8 bg-indigo-500 rounded-r-full"
        />
      )}
    </motion.button>
  );
};

export const Layout = ({ children, activeTab, setActiveTab }) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'students', label: 'Students', icon: Users },
    { id: 'teachers', label: 'Teachers', icon: GraduationCap },
    { id: 'courses', label: 'Courses', icon: BookOpen },
    { id: 'enrollments', label: 'Enrollments', icon: ClipboardList },
  ];

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans selection:bg-indigo-500/30">
      {/* Dynamic Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-900/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-900/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      {/* Sidebar */}
      <aside className="relative z-20 w-72 h-screen border-r border-slate-800/60 bg-slate-900/50 backdrop-blur-xl flex flex-col p-6 shadow-2xl">
        <div className="flex items-center space-x-3 mb-10 px-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
            EduManager
          </span>
        </div>

        <nav className="flex-1 space-y-2">
          {navItems.map((item) => (
            <SidebarItem
              key={item.id}
              icon={item.icon}
              label={item.label}
              isActive={activeTab === item.id}
              onClick={() => setActiveTab(item.id)}
            />
          ))}
        </nav>

        <div className="mt-auto pt-6 border-t border-slate-800/60">
          <div className="flex items-center p-3 rounded-xl bg-slate-800/40 border border-slate-700/50">
            <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
              A
            </div>
            <div className="ml-3">
              <p className="text-sm font-semibold text-slate-200">Admin User</p>
              <p className="text-xs text-slate-500">admin@school.edu</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="relative z-10 flex-1 h-screen overflow-y-auto bg-slate-950/50">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20, filter: 'blur(10px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -20, filter: 'blur(10px)' }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="p-8 max-w-7xl mx-auto"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
};
