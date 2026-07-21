import React, { useEffect, useState } from 'react';
import {
  Bell,
  Plus,
  Copy,
  Pause,
  Play,
  Trash2,
  Pencil,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import toast from 'react-hot-toast';
import {
  getReminders,
  createReminder,
  updateReminder,
  deleteReminder,
  duplicateReminder,
  pauseReminder,
} from '../api/endpoints';
import type { Reminder } from '../types';
import Modal from '../components/Modal';
import FilterBar from '../components/FilterBar';
import LoadingSkeleton from '../components/LoadingSkeleton';
import EmptyState from '../components/EmptyState';

const recurrenceTypes = ['daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'yearly', 'custom'];

export default function RemindersPage() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'paused'>('all');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Reminder | null>(null);
  const [form, setForm] = useState({
    title: '',
    recurrence_type: 'weekly',
    next_run_at: '',
    notes: '',
    linked_task_id: null as number | null,
  });

  useEffect(() => { fetchReminders(); }, []);

  const fetchReminders = async () => {
    setLoading(true);
    try {
      const res = await getReminders();
      setReminders(res.data);
    } catch {
      // handled by interceptor
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ title: '', recurrence_type: 'weekly', next_run_at: '', notes: '', linked_task_id: null });
    setShowModal(true);
  };

  const openEdit = (reminder: Reminder) => {
    setEditing(reminder);
    setForm({
      title: reminder.title,
      recurrence_type: reminder.recurrence_type,
      next_run_at: reminder.next_run_at || '',
      notes: reminder.notes,
      linked_task_id: reminder.linked_task_id,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.title.trim()) {
      toast.error('Title is required');
      return;
    }
    try {
      const payload = { ...form, next_run_at: form.next_run_at || null };
      if (editing) {
        await updateReminder(editing.id, payload);
        toast.success('Reminder updated');
      } else {
        await createReminder(payload);
        toast.success('Reminder created');
      }
      setShowModal(false);
      fetchReminders();
    } catch {
      // handled by interceptor
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this reminder?')) return;
    try {
      await deleteReminder(id);
      toast.success('Reminder deleted');
      fetchReminders();
    } catch {
      // handled by interceptor
    }
  };

  const handleDuplicate = async (id: number) => {
    try {
      await duplicateReminder(id);
      toast.success('Reminder duplicated');
      fetchReminders();
    } catch {
      // handled by interceptor
    }
  };

  const handlePauseToggle = async (reminder: Reminder) => {
    try {
      await pauseReminder(reminder.id);
      toast.success(reminder.active ? 'Reminder paused' : 'Reminder activated');
      fetchReminders();
    } catch {
      // handled by interceptor
    }
  };

  const filtered = reminders.filter((r) => {
    if (search && !r.title.toLowerCase().includes(search.toLowerCase())) return false;
    if (filter === 'active' && !r.active) return false;
    if (filter === 'paused' && r.active) return false;
    return true;
  });

  const filterChips = [
    { label: 'All', value: 'all', active: filter === 'all', onClick: () => setFilter('all') },
    { label: 'Active', value: 'active', active: filter === 'active', onClick: () => setFilter('active') },
    { label: 'Paused', value: 'paused', active: filter === 'paused', onClick: () => setFilter('paused') },
  ];

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between"><h1 className="text-2xl font-bold text-gray-900">Reminders</h1></div>
        <LoadingSkeleton count={5} type="row" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Reminders</h1>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-urtrack-600 text-white rounded-lg text-sm font-medium hover:bg-urtrack-700 transition-colors"
        >
          <Plus className="w-4 h-4" /> New Reminder
        </button>
      </div>

      <FilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search reminders..."
        chips={filterChips}
      />

      {filtered.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="No reminders found"
          description={search || filter !== 'all' ? 'Try adjusting your filters.' : 'Create your first reminder.'}
          action={{ label: 'Create Reminder', onClick: openCreate }}
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((reminder) => (
            <div
              key={reminder.id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex items-center gap-4 hover:shadow-md transition-shadow"
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${reminder.active ? 'bg-purple-100' : 'bg-gray-100'}`}>
                <Bell className={`w-5 h-5 ${reminder.active ? 'text-purple-600' : 'text-gray-400'}`} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-gray-900 truncate">{reminder.title}</h3>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-xs text-gray-500 capitalize">{reminder.recurrence_type}</span>
                  {reminder.next_run_at && (
                    <span className="text-xs text-gray-500">
                      Next: {format(parseISO(reminder.next_run_at), 'MMM d, yyyy HH:mm')}
                    </span>
                  )}
                  <span className={`text-xs px-2 py-0.5 rounded-full ${reminder.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {reminder.active ? 'Active' : 'Paused'}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => openEdit(reminder)} className="p-2 text-gray-400 hover:text-urtrack-600 transition-colors" title="Edit">
                  <Pencil className="w-4 h-4" />
                </button>
                <button onClick={() => handlePauseToggle(reminder)} className="p-2 text-gray-400 hover:text-yellow-600 transition-colors" title={reminder.active ? 'Pause' : 'Activate'}>
                  {reminder.active ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </button>
                <button onClick={() => handleDuplicate(reminder.id)} className="p-2 text-gray-400 hover:text-blue-600 transition-colors" title="Duplicate">
                  <Copy className="w-4 h-4" />
                </button>
                <button onClick={() => handleDelete(reminder.id)} className="p-2 text-gray-400 hover:text-red-600 transition-colors" title="Delete">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit Reminder' : 'New Reminder'}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-urtrack-500"
              placeholder="Reminder title"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Recurrence</label>
            <select
              value={form.recurrence_type}
              onChange={(e) => setForm({ ...form, recurrence_type: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-urtrack-500"
            >
              {recurrenceTypes.map((t) => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Next Run</label>
            <input
              type="datetime-local"
              value={form.next_run_at}
              onChange={(e) => setForm({ ...form, next_run_at: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-urtrack-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-urtrack-500"
              placeholder="Optional notes"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900">
              Cancel
            </button>
            <button onClick={handleSave} className="px-4 py-2 bg-urtrack-600 text-white rounded-lg text-sm font-medium hover:bg-urtrack-700 transition-colors">
              {editing ? 'Update' : 'Create'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
