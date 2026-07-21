import React, { useEffect, useState, useCallback } from 'react';
import { Plus, FolderKanban, Archive, RotateCcw } from 'lucide-react';
import toast from 'react-hot-toast';
import { getProjects, createProject, updateProject, archiveProject } from '../api/endpoints';
import type { Project } from '../types';
import ProjectCard from '../components/ProjectCard';
import Modal from '../components/Modal';
import FilterBar from '../components/FilterBar';
import LoadingSkeleton from '../components/LoadingSkeleton';
import EmptyState from '../components/EmptyState';

const statuses = ['active', 'stalled', 'completed', 'archived'];
const priorities = ['critical', 'high', 'medium', 'low'];

export default function Projects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [orgFilter, setOrgFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [form, setForm] = useState({
    title: '',
    organization_id: 1,
    status: 'active',
    priority: 'medium',
    start_date: '',
    deadline: '',
    description: '',
  });

  useEffect(() => { fetchProjects(); }, []);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const res = await getProjects();
      setProjects(res.data.items);
    } catch {
      // error handled by interceptor
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditingProject(null);
    setForm({ title: '', organization_id: 1, status: 'active', priority: 'medium', start_date: '', deadline: '', description: '' });
    setShowModal(true);
  };

  const openEdit = (project: Project) => {
    setEditingProject(project);
    setForm({
      title: project.title,
      organization_id: project.organization_id,
      status: project.status,
      priority: project.priority,
      start_date: project.start_date || '',
      deadline: project.deadline || '',
      description: project.description,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.title.trim()) {
      toast.error('Title is required');
      return;
    }
    try {
      const payload = {
        ...form,
        start_date: form.start_date || null,
        deadline: form.deadline || null,
      };
      if (editingProject) {
        await updateProject(editingProject.id, payload);
        toast.success('Project updated');
      } else {
        await createProject(payload);
        toast.success('Project created');
      }
      setShowModal(false);
      fetchProjects();
    } catch {
      // handled by interceptor
    }
  };

  const handleArchive = async (id: number) => {
    if (!window.confirm('Archive this project?')) return;
    try {
      await archiveProject(id);
      toast.success('Project archived');
      fetchProjects();
    } catch {
      // handled by interceptor
    }
  };

  const filtered = projects.filter((p) => {
    if (search && !p.title.toLowerCase().includes(search.toLowerCase())) return false;
    if (statusFilter && p.status !== statusFilter) return false;
    if (orgFilter && p.organization_id !== Number(orgFilter)) return false;
    return true;
  });

  const statusChips = [
    { label: 'All', value: '', active: statusFilter === '', onClick: () => setStatusFilter('') },
    ...statuses.map((s) => ({
      label: s.charAt(0).toUpperCase() + s.slice(1),
      value: s,
      active: statusFilter === s,
      onClick: () => setStatusFilter(s),
    })),
  ];

  const orgs = [...new Set(projects.map((p) => p.organization?.name).filter(Boolean))];

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
        </div>
        <LoadingSkeleton count={6} />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-urtrack-600 text-white rounded-lg text-sm font-medium hover:bg-urtrack-700 transition-colors"
        >
          <Plus className="w-4 h-4" /> New Project
        </button>
      </div>

      <FilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search projects..."
        chips={statusChips}
      />

      {orgs.length > 1 && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setOrgFilter('')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium ${!orgFilter ? 'bg-urtrack-600 text-white' : 'bg-gray-100 text-gray-600'}`}
          >
            All Orgs
          </button>
          {orgs.map((name) => (
            <button
              key={name}
              onClick={() => setOrgFilter(projects.find((p) => p.organization?.name === name)?.organization_id.toString() || '')}
              className={`px-3 py-1.5 rounded-full text-xs font-medium ${orgFilter === projects.find((p) => p.organization?.name === name)?.organization_id.toString() ? 'bg-urtrack-600 text-white' : 'bg-gray-100 text-gray-600'}`}
            >
              {name}
            </button>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title="No projects found"
          description={search || statusFilter ? 'Try adjusting your filters.' : 'Create your first project to get started.'}
          action={!search && !statusFilter ? { label: 'Create Project', onClick: openCreate } : undefined}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((project) => (
            <div key={project.id} className="relative group">
              <ProjectCard project={project} />
              <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => { e.stopPropagation(); openEdit(project); }}
                  className="p-1.5 bg-white rounded-lg shadow-sm border border-gray-200 text-gray-500 hover:text-urtrack-600"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
                {!project.archived && (
                  <button
                    onClick={(e) => { e.stopPropagation(); handleArchive(project.id); }}
                    className="p-1.5 bg-white rounded-lg shadow-sm border border-gray-200 text-gray-500 hover:text-red-600"
                  >
                    <Archive className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editingProject ? 'Edit Project' : 'New Project'}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-urtrack-500"
              placeholder="Project title"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Organization</label>
            <select
              value={form.organization_id}
              onChange={(e) => setForm({ ...form, organization_id: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-urtrack-500"
            >
                <option value={1}>Default</option>
              <option value={2}>Coune LabWorks</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-urtrack-500"
              >
                {statuses.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <select
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-urtrack-500"
              >
                {priorities.map((p) => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                value={form.start_date}
                onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-urtrack-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Deadline</label>
              <input
                type="date"
                value={form.deadline}
                onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-urtrack-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-urtrack-500"
              placeholder="Project description"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900">
              Cancel
            </button>
            <button onClick={handleSave} className="px-4 py-2 bg-urtrack-600 text-white rounded-lg text-sm font-medium hover:bg-urtrack-700 transition-colors">
              {editingProject ? 'Update' : 'Create'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
