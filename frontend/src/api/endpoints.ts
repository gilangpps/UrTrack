import apiClient from './client';
import type {
  DashboardData,
  Project,
  ProjectUpdate,
  Task,
  Reminder,
  Report,
  KnowledgeNote,
  QnAResponse,
  CalendarEvent,
  AppSettings,
  ProjectListResponse,
} from '../types';

const toParams = (filters?: Record<string, string | number | boolean | undefined | null>) => {
  if (!filters) return {};
  const params: Record<string, string> = {};
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== null && value !== '') {
      params[key] = String(value);
    }
  }
  return params;
};

export const getDashboard = () =>
  apiClient.get<DashboardData>('/dashboard');

export const getProjects = (filters?: { status?: string; organization_id?: number; search?: string; archived?: boolean }) =>
  apiClient.get<ProjectListResponse>('/projects', { params: toParams(filters as any) });

export const createProject = (data: Partial<Project>) =>
  apiClient.post<Project>('/projects', data);

export const getProject = (id: number) =>
  apiClient.get<Project>(`/projects/${id}`);

export const updateProject = (id: number, data: Partial<Project>) =>
  apiClient.put<Project>(`/projects/${id}`, data);

export const archiveProject = (id: number) =>
  apiClient.delete(`/projects/${id}`);

export const addProjectUpdate = (id: number, data: { note: string; progress_percent: number }) =>
  apiClient.post<ProjectUpdate>(`/projects/${id}/updates`, data);

export const getProjectUpdates = (id: number) =>
  apiClient.get<ProjectUpdate[]>(`/projects/${id}/updates`);

export const getTasks = (filters?: { status?: string; category?: string; due_date?: string }) =>
  apiClient.get<Task[]>('/tasks', { params: toParams(filters as any) });

export const createTask = (data: Partial<Task>) =>
  apiClient.post<Task>('/tasks', data);

export const updateTask = (id: number, data: Partial<Task>) =>
  apiClient.put<Task>(`/tasks/${id}`, data);

export const deleteTask = (id: number) =>
  apiClient.delete(`/tasks/${id}`);

export const getReminders = (filters?: { active?: boolean }) =>
  apiClient.get<Reminder[]>('/reminders', { params: toParams(filters as any) });

export const createReminder = (data: Partial<Reminder>) =>
  apiClient.post<Reminder>('/reminders', data);

export const updateReminder = (id: number, data: Partial<Reminder>) =>
  apiClient.put<Reminder>(`/reminders/${id}`, data);

export const deleteReminder = (id: number) =>
  apiClient.delete(`/reminders/${id}`);

export const duplicateReminder = (id: number) =>
  apiClient.post<Reminder>(`/reminders/${id}/duplicate`);

export const pauseReminder = (id: number) =>
  apiClient.put<Reminder>(`/reminders/${id}/pause`);

export const getCalendarEvents = (start: string, end: string) =>
  apiClient.get<CalendarEvent[]>('/calendar/events', { params: { start, end } });

export const getReports = () =>
  apiClient.get<Report[]>('/reports');

export const generateReport = (weekLabel: string) =>
  apiClient.post<Report>('/reports/generate', { week_label: weekLabel });

export const getKnowledgeNotes = (search?: string) =>
  apiClient.get<KnowledgeNote[]>('/knowledge', { params: search ? { search } : {} });

export const createKnowledgeNote = (data: Partial<KnowledgeNote>) =>
  apiClient.post<KnowledgeNote>('/knowledge', data);

export const updateKnowledgeNote = (id: number, data: Partial<KnowledgeNote>) =>
  apiClient.put<KnowledgeNote>(`/knowledge/${id}`, data);

export const deleteKnowledgeNote = (id: number) =>
  apiClient.delete(`/knowledge/${id}`);

export const askQuestion = (query: string) =>
  apiClient.post<QnAResponse>('/qa/ask', { query });

export const getSettings = () =>
  apiClient.get<AppSettings>('/settings');

export const updateSettings = (data: Partial<AppSettings>) =>
  apiClient.put<AppSettings>('/settings', data);
