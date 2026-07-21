import React, { useEffect, useState, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Plus,
  Trash2,
} from 'lucide-react';
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  parseISO,
} from 'date-fns';
import toast from 'react-hot-toast';
import { getTasks, createTask, deleteTask } from '../api/endpoints';
import type { Task } from '../types';
import Modal from '../components/Modal';
import EmptyState from '../components/EmptyState';

export default function CalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', category: 'general', due_date: '', notes: '' });

  useEffect(() => {
    fetchTasks();
  }, [currentMonth]);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const monthStart = format(startOfMonth(currentMonth), 'yyyy-MM-dd');
      const monthEnd = format(endOfMonth(currentMonth), 'yyyy-MM-dd');
      const res = await getTasks();
      setTasks(res.data);
    } catch {
      // handled by interceptor
    } finally {
      setLoading(false);
    }
  };

  const days = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calStart = startOfWeek(monthStart);
    const calEnd = endOfWeek(monthEnd);
    return eachDayOfInterval({ start: calStart, end: calEnd });
  }, [currentMonth]);

  const tasksForDate = (date: Date) =>
    tasks.filter(
      (t) => t.due_date && isSameDay(parseISO(t.due_date), date)
    );

  const todayTasks = tasks.filter(
    (t) => t.due_date && isSameDay(parseISO(t.due_date), new Date())
  );

  const handleCreateTask = async () => {
    if (!form.title.trim()) {
      toast.error('Title is required');
      return;
    }
    try {
      await createTask({
        title: form.title,
        category: form.category,
        due_date: form.due_date || null,
        notes: form.notes,
        status: 'pending',
        source: 'manual',
      });
      toast.success('Task created');
      setShowForm(false);
      setForm({ title: '', category: 'general', due_date: '', notes: '' });
      fetchTasks();
    } catch {
      // handled by interceptor
    }
  };

  const handleDeleteTask = async (id: number) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      await deleteTask(id);
      toast.success('Task deleted');
      fetchTasks();
    } catch {
      // handled by interceptor
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Calendar</h1>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-urtrack-600 text-white rounded-lg text-sm font-medium hover:bg-urtrack-700 transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Task
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h2 className="text-lg font-semibold text-gray-900">
            {format(currentMonth, 'MMMM yyyy')}
          </h2>
          <button
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-lg overflow-hidden">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="bg-gray-50 px-2 py-2 text-center text-xs font-semibold text-gray-500">
              {day}
            </div>
          ))}
          {days.map((day) => {
            const dayTasks = tasksForDate(day);
            const isToday = isSameDay(day, new Date());
            const isCurrent = isSameMonth(day, currentMonth);
            return (
              <div
                key={day.toISOString()}
                onClick={() => setSelectedDate(day)}
                className={`bg-white min-h-[80px] p-1.5 cursor-pointer transition-colors hover:bg-gray-50 ${
                  !isCurrent ? 'opacity-40' : ''
                } ${isToday ? 'ring-2 ring-urtrack-500 ring-inset' : ''}`}
              >
                <span className={`text-xs font-medium ${isToday ? 'text-urtrack-600' : 'text-gray-700'}`}>
                  {format(day, 'd')}
                </span>
                <div className="mt-1 space-y-0.5">
                  {dayTasks.slice(0, 2).map((task) => (
                    <div
                      key={task.id}
                      className="text-[10px] px-1 py-0.5 rounded bg-urtrack-100 text-urtrack-700 truncate"
                      title={task.title}
                    >
                      {task.title}
                    </div>
                  ))}
                  {dayTasks.length > 2 && (
                    <div className="text-[10px] text-gray-400 px-1">
                      +{dayTasks.length - 2} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Tasks for Today ({format(new Date(), 'MMM d, yyyy')})
        </h2>
        {todayTasks.length === 0 ? (
          <EmptyState icon={CalendarIcon} title="No tasks today" description="You have no tasks scheduled for today." />
        ) : (
          <div className="space-y-2">
            {todayTasks.map((task) => (
              <div key={task.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                <div className="flex items-center gap-3">
                  <span className={`w-2 h-2 rounded-full ${task.status === 'completed' ? 'bg-green-500' : 'bg-urtrack-400'}`} />
                  <span className={`text-sm ${task.status === 'completed' ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                    {task.title}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">{task.category}</span>
                  <button
                    onClick={() => handleDeleteTask(task.id)}
                    className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal open={showForm} onClose={() => setShowForm(false)} title="New Task">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-urtrack-500"
              placeholder="Task title"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-urtrack-500"
            >
              <option value="general">General</option>
              <option value="development">Development</option>
              <option value="design">Design</option>
              <option value="meeting">Meeting</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
            <input
              type="date"
              value={form.due_date}
              onChange={(e) => setForm({ ...form, due_date: e.target.value })}
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
            <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900">
              Cancel
            </button>
            <button onClick={handleCreateTask} className="px-4 py-2 bg-urtrack-600 text-white rounded-lg text-sm font-medium hover:bg-urtrack-700 transition-colors">
              Create Task
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
