import React, { useEffect, useState } from 'react';
import {
  Settings as SettingsIcon,
  Save,
  RefreshCw,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { getSettings, updateSettings } from '../api/endpoints';
import type { AppSettings } from '../types';
import LoadingSkeleton from '../components/LoadingSkeleton';

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<AppSettings>({
    backup_path: '',
    notifications_enabled: true,
    default_org_tags: [],
    reminder_default_time: '09:00',
    theme: 'light',
  });
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await getSettings();
      setForm(res.data);
    } catch {
      // default values
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateSettings(form);
      toast.success('Settings saved');
    } catch {
      // handled by interceptor
    } finally {
      setSaving(false);
    }
  };

  const addTag = () => {
    const tag = tagInput.trim();
    if (tag && !form.default_org_tags.includes(tag)) {
      setForm({ ...form, default_org_tags: [...form.default_org_tags, tag] });
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setForm({ ...form, default_org_tags: form.default_org_tags.filter((t) => t !== tag) });
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <LoadingSkeleton count={6} type="row" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-urtrack-600 text-white rounded-lg text-sm font-medium hover:bg-urtrack-700 disabled:opacity-50 transition-colors"
        >
          <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>

      <div className="space-y-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Backup</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Backup Path</label>
              <input
                type="text"
                value={form.backup_path}
                onChange={(e) => setForm({ ...form, backup_path: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-urtrack-500"
                placeholder="e.g. /backups/urtrack-os"
              />
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors">
              <RefreshCw className="w-4 h-4" /> Run Backup Now
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Notifications</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700">Enable Notifications</p>
                <p className="text-xs text-gray-500">Receive email notifications for reminders and updates</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.notifications_enabled}
                  onChange={(e) => setForm({ ...form, notifications_enabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-urtrack-600 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all" />
              </label>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Default Organization Tags</h2>
          <div className="space-y-3">
            <div className="flex gap-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-urtrack-500"
                placeholder="Add a tag..."
              />
              <button onClick={addTag} className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 transition-colors">
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {form.default_org_tags.map((tag) => (
                <span key={tag} className="inline-flex items-center gap-1 px-2.5 py-1 bg-urtrack-100 text-urtrack-700 rounded-full text-xs">
                  {tag}
                  <button onClick={() => removeTag(tag)} className="hover:text-red-600">&times;</button>
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Defaults</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Default Reminder Time</label>
              <input
                type="time"
                value={form.reminder_default_time}
                onChange={(e) => setForm({ ...form, reminder_default_time: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-urtrack-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Theme</label>
              <select
                value={form.theme}
                onChange={(e) => setForm({ ...form, theme: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-urtrack-500"
              >
                <option value="light">Light</option>
                <option value="dark">Dark (coming soon)</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex justify-end pb-8">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 bg-urtrack-600 text-white rounded-lg text-sm font-medium hover:bg-urtrack-700 disabled:opacity-50 transition-colors"
          >
            <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save All Settings'}
          </button>
        </div>
      </div>
    </div>
  );
}
