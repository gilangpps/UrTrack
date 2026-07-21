import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FolderKanban,
  CheckCircle2,
  Bell,
  AlertTriangle,
  Clock,
  TrendingUp,
  Activity,
  Building2,
  Calendar,
  ChevronRight,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import toast from 'react-hot-toast';
import { getDashboard } from '../api/endpoints';
import type { DashboardData } from '../types';
import StatCard from '../components/StatCard';
import LoadingSkeleton from '../components/LoadingSkeleton';
import EmptyState from '../components/EmptyState';

export default function Dashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const res = await getDashboard();
      setData(res.data);
    } catch {
      toast.error('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 animate-pulse">
              <div className="h-3 bg-gray-200 rounded w-1/2 mb-2" />
              <div className="h-8 bg-gray-200 rounded w-1/3 mb-1" />
            </div>
          ))}
        </div>
        <LoadingSkeleton count={3} />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>
        <EmptyState
          icon={Activity}
          title="No Data Available"
          description="Could not load dashboard data. Try refreshing the page."
          action={{ label: 'Refresh', onClick: fetchDashboard }}
        />
      </div>
    );
  }

  const overdue = data.nearest_deadlines.filter(
    (p) => p.deadline && new Date(p.deadline) < new Date()
  ).length;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <span className="text-sm text-gray-500">
          <TrendingUp className="w-4 h-4 inline mr-1" />
          {data.weekly_progress.projects_updated} projects updated this week
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Active Projects"
          value={data.active_projects.length}
          icon={FolderKanban}
          color="bg-blue-500"
        />
        <StatCard
          title="Tasks Completed"
          value={data.weekly_progress.tasks_completed}
          icon={CheckCircle2}
          color="bg-green-500"
        />
        <StatCard
          title="Upcoming Reminders"
          value={data.nearest_reminders.length}
          icon={Bell}
          color="bg-purple-500"
        />
        <StatCard
          title="Overdue"
          value={overdue}
          icon={AlertTriangle}
          color="bg-red-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Active Projects</h2>
          {data.active_projects.length === 0 ? (
            <EmptyState icon={FolderKanban} title="No active projects" description="Create your first project to get started." />
          ) : (
            <div className="space-y-3">
              {data.active_projects.slice(0, 5).map((project) => (
                <div
                  key={project.id}
                  onClick={() => navigate(`/projects/${project.id}`)}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{project.title}</p>
                      <p className="text-xs text-gray-500">{project.organization?.name}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Nearest Deadlines</h2>
          {data.nearest_deadlines.length === 0 ? (
            <EmptyState icon={Calendar} title="No deadlines" description="No upcoming deadlines found." />
          ) : (
            <div className="space-y-3">
              {data.nearest_deadlines.map((project) => (
                <div
                  key={project.id}
                  onClick={() => navigate(`/projects/${project.id}`)}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Clock className="w-4 h-4 text-orange-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{project.title}</p>
                      {project.deadline && (
                        <p className="text-xs text-gray-500">{format(parseISO(project.deadline), 'MMM d, yyyy')}</p>
                      )}
                    </div>
                  </div>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    project.deadline && new Date(project.deadline) < new Date()
                      ? 'bg-red-100 text-red-700'
                      : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {project.deadline && new Date(project.deadline) < new Date() ? 'OVERDUE' : 'SOON'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Reminders</h2>
          {data.nearest_reminders.length === 0 ? (
            <EmptyState icon={Bell} title="No reminders" description="No upcoming reminders." />
          ) : (
            <div className="space-y-3">
              {data.nearest_reminders.map((reminder) => (
                <div key={reminder.id} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                  <div className="w-2 h-2 rounded-full bg-purple-500" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{reminder.title}</p>
                    {reminder.next_run_at && (
                      <p className="text-xs text-gray-500">{format(parseISO(reminder.next_run_at), 'MMM d, yyyy HH:mm')}</p>
                    )}
                  </div>
                  <span className="text-xs text-gray-400 capitalize">{reminder.recurrence_type}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Organization Status</h2>
          {data.org_status_cards.length === 0 ? (
            <EmptyState icon={Building2} title="No organizations" description="No organization data available." />
          ) : (
            <div className="space-y-3">
              {data.org_status_cards.map((org) => (
                <div key={org.organization} className="p-4 rounded-lg bg-gray-50">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-semibold text-gray-900">{org.organization}</h3>
                  </div>
                  <div className="flex gap-4 text-sm">
                    <span className="text-green-600 font-medium">{org.active_projects} active</span>
                    <span className="text-blue-600 font-medium">{org.completed_projects} completed</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
        {data.recent_activity.length === 0 ? (
          <EmptyState icon={Activity} title="No recent activity" description="Activity log is empty." />
        ) : (
          <div className="space-y-3">
            {data.recent_activity.map((activity) => (
              <div key={activity.id} className="flex items-start gap-3 pb-3 border-b border-gray-100 last:border-0">
                <div className="w-2 h-2 rounded-full bg-urtrack-400 mt-1.5 shrink-0" />
                <div>
                  <p className="text-sm text-gray-700">{activity.action} - {activity.entity_type}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{format(parseISO(activity.created_at), 'MMM d, yyyy HH:mm')}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
