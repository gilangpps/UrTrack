import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ExternalLink,
  Calendar,
  GitBranch,
  Clock,
  BarChart3,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import toast from 'react-hot-toast';
import { getProject, getProjectUpdates, updateProject, addProjectUpdate } from '../api/endpoints';
import type { Project, ProjectUpdate as ProjectUpdateType } from '../types';
import LoadingSkeleton from '../components/LoadingSkeleton';
import EmptyState from '../components/EmptyState';

const statusColors: Record<string, string> = {
  active: 'bg-green-100 text-green-800',
  stalled: 'bg-yellow-100 text-yellow-800',
  completed: 'bg-blue-100 text-blue-800',
  archived: 'bg-gray-100 text-gray-800',
};

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [updates, setUpdates] = useState<ProjectUpdateType[]>([]);
  const [loading, setLoading] = useState(true);
  const [updateForm, setUpdateForm] = useState({ note: '', progress_percent: 0 });
  const [saving, setSaving] = useState(false);
  const [changingStatus, setChangingStatus] = useState(false);

  useEffect(() => {
    if (id) fetchProject(Number(id));
  }, [id]);

  const fetchProject = async (projectId: number) => {
    setLoading(true);
    try {
      const [projRes, updatesRes] = await Promise.all([
        getProject(projectId),
        getProjectUpdates(projectId),
      ]);
      setProject(projRes.data);
      setUpdates(updatesRes.data);
    } catch {
      toast.error('Failed to load project');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!project) return;
    setChangingStatus(true);
    try {
      await updateProject(project.id, { status: newStatus });
      setProject({ ...project, status: newStatus });
      toast.success('Status updated');
    } catch {
      // handled by interceptor
    } finally {
      setChangingStatus(false);
    }
  };

  const handleAddUpdate = async () => {
    if (!project || !updateForm.note.trim()) return;
    setSaving(true);
    try {
      const res = await addProjectUpdate(project.id, updateForm);
      setUpdates([res.data, ...updates]);
      setUpdateForm({ note: '', progress_percent: 0 });
      toast.success('Update added');
    } catch {
      // handled by interceptor
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <LoadingSkeleton type="detail" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="max-w-4xl mx-auto">
        <EmptyState
          icon={BarChart3}
          title="Project not found"
          description="The project you're looking for doesn't exist."
          action={{ label: 'Back to Projects', onClick: () => navigate('/projects') }}
        />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <button
        onClick={() => navigate('/projects')}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Projects
      </button>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{project.title}</h1>
            <p className="text-sm text-gray-500 mt-1">{project.organization?.name}</p>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={project.status}
              onChange={(e) => handleStatusChange(e.target.value)}
              disabled={changingStatus}
              className={`px-3 py-1.5 rounded-full text-sm font-medium border-0 focus:ring-2 focus:ring-urtrack-500 ${statusColors[project.status] || 'bg-gray-100 text-gray-800'}`}
            >
              <option value="active">Active</option>
              <option value="stalled">Stalled</option>
              <option value="completed">Completed</option>
              <option value="archived">Archived</option>
            </select>
            <span className={`px-3 py-1.5 rounded-full text-xs font-medium ${
              project.priority === 'critical' ? 'bg-red-100 text-red-700' :
              project.priority === 'high' ? 'bg-orange-100 text-orange-700' :
              project.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
              'bg-gray-100 text-gray-700'
            }`}>
              {project.priority.toUpperCase()}
            </span>
          </div>
        </div>

        <p className="text-gray-700 mb-6">{project.description || 'No description provided.'}</p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {project.start_date && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Calendar className="w-4 h-4 text-urtrack-500" />
              <span>Start: {format(parseISO(project.start_date), 'MMM d, yyyy')}</span>
            </div>
          )}
          {project.deadline && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Clock className="w-4 h-4 text-urtrack-500" />
              <span>Deadline: {format(parseISO(project.deadline), 'MMM d, yyyy')}</span>
            </div>
          )}
          {project.evaluation && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <BarChart3 className="w-4 h-4 text-urtrack-500" />
              <span>Eval: {project.evaluation}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span className={`w-2 h-2 rounded-full ${project.archived ? 'bg-gray-400' : 'bg-green-400'}`} />
            <span>{project.archived ? 'Archived' : 'Active'}</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          {project.repo_url && (
            <a href={project.repo_url} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 transition-colors">
              <GitBranch className="w-4 h-4" /> Repository
            </a>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Add Update</h2>
        <div className="space-y-3">
          <textarea
            value={updateForm.note}
            onChange={(e) => setUpdateForm({ ...updateForm, note: e.target.value })}
            placeholder="What's the latest progress?"
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-urtrack-500"
          />
          <div className="flex items-center gap-3">
            <label className="text-sm text-gray-600 shrink-0">Progress: {updateForm.progress_percent}%</label>
            <input
              type="range"
              min={0}
              max={100}
              value={updateForm.progress_percent}
              onChange={(e) => setUpdateForm({ ...updateForm, progress_percent: Number(e.target.value) })}
              className="flex-1 accent-urtrack-600"
            />
            <button
              onClick={handleAddUpdate}
              disabled={saving || !updateForm.note.trim()}
              className="px-4 py-2 bg-urtrack-600 text-white rounded-lg text-sm font-medium hover:bg-urtrack-700 disabled:opacity-50 transition-colors"
            >
              {saving ? 'Saving...' : 'Add Update'}
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Progress Timeline</h2>
        {updates.length === 0 ? (
          <EmptyState icon={BarChart3} title="No updates yet" description="Be the first to add a project update." />
        ) : (
          <div className="space-y-4">
            {updates.map((update) => (
              <div key={update.id} className="flex gap-4 pb-4 border-b border-gray-100 last:border-0">
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full bg-urtrack-100 flex items-center justify-center">
                    <span className="text-xs font-bold text-urtrack-600">{update.progress_percent}%</span>
                  </div>
                  <div className="w-0.5 flex-1 bg-gray-200 mt-2" />
                </div>
                <div className="flex-1 pt-1">
                  <p className="text-sm text-gray-700">{update.note}</p>
                  <p className="text-xs text-gray-400 mt-1">{format(parseISO(update.created_at), 'MMM d, yyyy HH:mm')}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {project.evaluation && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Evaluation</h2>
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{project.evaluation}</p>
        </div>
      )}
    </div>
  );
}
