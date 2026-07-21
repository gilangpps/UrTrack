import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import ProjectDetail from './pages/ProjectDetail';
import Calendar from './pages/Calendar';
import Reminders from './pages/Reminders';
import Reports from './pages/Reports';
import Knowledge from './pages/Knowledge';
import QA from './pages/QA';
import Settings from './pages/Settings';

function AppLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="lg:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-gray-600 hover:text-gray-900 focus:outline-none"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <h1 className="ml-3 text-lg font-semibold text-urtrack-800">UrTrack</h1>
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <>
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
      <Routes>
        <Route path="/" element={<AppLayout><Dashboard /></AppLayout>} />
        <Route path="/projects" element={<AppLayout><Projects /></AppLayout>} />
        <Route path="/projects/:id" element={<AppLayout><ProjectDetail /></AppLayout>} />
        <Route path="/calendar" element={<AppLayout><Calendar /></AppLayout>} />
        <Route path="/reminders" element={<AppLayout><Reminders /></AppLayout>} />
        <Route path="/reports" element={<AppLayout><Reports /></AppLayout>} />
        <Route path="/knowledge" element={<AppLayout><Knowledge /></AppLayout>} />
        <Route path="/qa" element={<AppLayout><QA /></AppLayout>} />
        <Route path="/settings" element={<AppLayout><Settings /></AppLayout>} />
      </Routes>
    </>
  );
}

export default App;
