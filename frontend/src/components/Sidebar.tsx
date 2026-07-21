import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderKanban,
  Calendar,
  Bell,
  FileText,
  BookOpen,
  MessageSquare,
  Settings,
  X,
} from 'lucide-react';

const links = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/projects', label: 'Projects', icon: FolderKanban },
  { to: '/calendar', label: 'Calendar', icon: Calendar },
  { to: '/reminders', label: 'Reminders', icon: Bell },
  { to: '/reports', label: 'Reports', icon: FileText },
  { to: '/knowledge', label: 'Knowledge', icon: BookOpen },
  { to: '/qa', label: 'Q&A', icon: MessageSquare },
  { to: '/settings', label: 'Settings', icon: Settings },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  return (
    <>
      {open && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={onClose}
        />
      )}
      <aside
        className={`
          fixed inset-y-0 left-0 z-30 w-64 bg-urtrack-900 text-white transform transition-transform duration-200 ease-in-out
          lg:relative lg:translate-x-0
          ${open ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="flex items-center justify-between h-16 px-6 border-b border-urtrack-700">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-urtrack-500 flex items-center justify-center">
              <span className="text-white font-bold text-sm">B</span>
            </div>
            <span className="text-xl font-semibold">UrTrack</span>
          </div>
          <button onClick={onClose} className="lg:hidden text-urtrack-300 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
        <nav className="mt-4 px-3 space-y-1">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/'}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-urtrack-700 text-white'
                    : 'text-urtrack-300 hover:text-white hover:bg-urtrack-800'
                }`
              }
            >
              <link.icon className="w-5 h-5" />
              {link.label}
            </NavLink>
          ))}
        </nav>
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-urtrack-700">
          <p className="text-xs text-urtrack-400 text-center">UrTrack v0.1</p>
        </div>
      </aside>
    </>
  );
}
