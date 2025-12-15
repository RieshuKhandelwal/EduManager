
import React, { useState } from 'react';
import { Layout } from './components/Layout.jsx';
import { Dashboard } from './components/Dashboard.jsx';
import { Students } from './components/Students.jsx';
import { Teachers } from './components/Teachers.jsx';
import { Courses } from './components/Courses.jsx';
import { Enrollments } from './components/Enrollments.jsx';

const App = () => {
  const [activeTab, setActiveTab] = useState('dashboard');

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard navigate={setActiveTab} />;
      case 'students':
        return <Students />;
      case 'teachers':
        return <Teachers />;
      case 'courses':
        return <Courses />;
      case 'enrollments':
        return <Enrollments />;
      default:
        return <Dashboard navigate={setActiveTab} />;
    }
  };

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      {renderContent()}
    </Layout>
  );
};

export default App;
