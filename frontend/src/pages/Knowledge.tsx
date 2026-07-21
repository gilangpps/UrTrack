import React, { useEffect, useState } from 'react';
import {
  BookOpen,
  Plus,
  Search,
  Trash2,
  Pencil,
  ChevronDown,
  ChevronUp,
  Tag,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import toast from 'react-hot-toast';
import {
  getKnowledgeNotes,
  createKnowledgeNote,
  updateKnowledgeNote,
  deleteKnowledgeNote,
} from '../api/endpoints';
import type { KnowledgeNote } from '../types';
import Modal from '../components/Modal';
import LoadingSkeleton from '../components/LoadingSkeleton';
import EmptyState from '../components/EmptyState';

const categories = ['general', 'technical', 'process', 'meeting', 'reference'];

export default function KnowledgePage() {
  const [notes, setNotes] = useState<KnowledgeNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<KnowledgeNote | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [form, setForm] = useState({ title: '', category: 'general', content: '', tags: '' });

  useEffect(() => { fetchNotes(); }, []);

  const fetchNotes = async (q?: string) => {
    setLoading(true);
    try {
      const res = await getKnowledgeNotes(q);
      setNotes(res.data);
    } catch {
      // handled by interceptor
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ title: '', category: 'general', content: '', tags: '' });
    setShowModal(true);
  };

  const openEdit = (note: KnowledgeNote) => {
    setEditing(note);
    setForm({
      title: note.title,
      category: note.category,
      content: note.content,
      tags: note.tags,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.content.trim()) {
      toast.error('Title and content are required');
      return;
    }
    try {
      const payload = {
        title: form.title,
        category: form.category,
        content: form.content,
        tags: form.tags,
      };
      if (editing) {
        await updateKnowledgeNote(editing.id, payload);
        toast.success('Note updated');
      } else {
        await createKnowledgeNote(payload);
        toast.success('Note created');
      }
      setShowModal(false);
      fetchNotes(search || undefined);
    } catch {
      // handled by interceptor
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this note?')) return;
    try {
      await deleteKnowledgeNote(id);
      toast.success('Note deleted');
      fetchNotes(search || undefined);
    } catch {
      // handled by interceptor
    }
  };

  const handleSearch = (value: string) => {
    setSearch(value);
    fetchNotes(value || undefined);
  };

  const filtered = notes.filter((n) => {
    if (categoryFilter && n.category !== categoryFilter) return false;
    return true;
  });

  if (loading && notes.length === 0) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between"><h1 className="text-2xl font-bold text-gray-900">Knowledge</h1></div>
        <LoadingSkeleton count={4} type="row" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Knowledge</h1>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-urtrack-600 text-white rounded-lg text-sm font-medium hover:bg-urtrack-700 transition-colors"
        >
          <Plus className="w-4 h-4" /> New Note
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search knowledge notes..."
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-urtrack-500"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setCategoryFilter('')}
          className={`px-3 py-1.5 rounded-full text-xs font-medium ${!categoryFilter ? 'bg-urtrack-600 text-white' : 'bg-gray-100 text-gray-600'}`}
        >
          All
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategoryFilter(cat)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium ${categoryFilter === cat ? 'bg-urtrack-600 text-white' : 'bg-gray-100 text-gray-600'}`}
          >
            {cat.charAt(0).toUpperCase() + cat.slice(1)}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No notes found"
          description={search || categoryFilter ? 'Try adjusting your search.' : 'Create your first knowledge note.'}
          action={{ label: 'Create Note', onClick: openCreate }}
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((note) => (
            <div key={note.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
              <div
                onClick={() => setExpandedId(expandedId === note.id ? null : note.id)}
                className="p-4 flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <BookOpen className="w-5 h-5 text-urtrack-500 shrink-0" />
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-gray-900 truncate">{note.title}</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-urtrack-100 text-urtrack-700">{note.category}</span>
                      <span className="text-xs text-gray-400">{format(parseISO(note.updated_at), 'MMM d, yyyy')}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0 ml-2">
                  <button onClick={(e) => { e.stopPropagation(); openEdit(note); }} className="p-1.5 text-gray-400 hover:text-urtrack-600 transition-colors">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); handleDelete(note.id); }} className="p-1.5 text-gray-400 hover:text-red-600 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  {expandedId === note.id ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                </div>
              </div>
              {expandedId === note.id && (
                <div className="px-4 pb-4 pt-0 border-t border-gray-100">
                  <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap mt-3">
                    {note.content}
                  </div>
                  {note.tags && note.tags.length > 0 && (
                    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                      <Tag className="w-3.5 h-3.5 text-gray-400" />
                      {note.tags.split(',').map((tag, i) => (
                        <span key={i} className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">{tag.trim()}</span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit Note' : 'New Note'}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-urtrack-500"
              placeholder="Note title"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-urtrack-500"
            >
              {categories.map((c) => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
            <textarea
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-urtrack-500 font-mono"
              placeholder="Write your knowledge note content here..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tags (comma-separated)</label>
            <input
              type="text"
              value={form.tags}
              onChange={(e) => setForm({ ...form, tags: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-urtrack-500"
              placeholder="e.g. python, workflow, setup"
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
