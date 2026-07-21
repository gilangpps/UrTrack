export interface Organization {
  id: number;
  name: string;
  slug: string;
  color: string;
}

export interface Project {
  id: number;
  organization_id: number;
  organization?: Organization;
  title: string;
  status: string;
  priority: string;
  start_date: string | null;
  deadline: string | null;
  description: string;
  evaluation: string;
  repo_url: string | null;
  archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProjectUpdate {
  id: number;
  project_id: number;
  note: string;
  progress_percent: number;
  created_at: string;
}

export interface Task {
  id: number;
  title: string;
  category: string;
  due_date: string | null;
  status: string;
  source: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface Reminder {
  id: number;
  title: string;
  recurrence_type: string;
  recurrence_rule: string | null;
  next_run_at: string | null;
  active: boolean;
  notes: string;
  linked_task_id: number | null;
}

export interface Attachment {
  id: number;
  related_type: string;
  related_id: number;
  file_name: string;
  local_path: string;
  mime_type: string;
  created_at: string;
}

export interface Report {
  id: number;
  week_label: string;
  local_path: string | null;
  content?: string;
  created_at: string;
}

export interface KnowledgeNote {
  id: number;
  title: string;
  category: string;
  content: string;
  tags: string;
  created_at: string;
  updated_at: string;
}

export interface ActivityLog {
  id: number;
  entity_type: string;
  entity_id: number | null;
  action: string;
  payload_json: string | null;
  created_at: string;
}

export interface OrgStatusCard {
  organization: string;
  active_projects: number;
  stalled_projects: number;
  completed_projects: number;
  total_projects: number;
}

export interface DashboardData {
  weekly_progress: { week_label: string; projects_updated: number; tasks_completed: number };
  active_projects: Project[];
  nearest_deadlines: Project[];
  nearest_reminders: Reminder[];
  recent_activity: ActivityLog[];
  org_status_cards: OrgStatusCard[];
}

export interface ProjectListResponse {
  items: Project[];
  total: number;
}

export interface QnAResponse {
  answer: string;
  data: any[];
}

export interface CalendarEvent {
  id: number;
  title: string;
  start: string;
  end: string;
  type: string;
  source_id: number | null;
}

export interface AppSettings {
  backup_path: string;
  notifications_enabled: boolean;
  default_org_tags: string[];
  reminder_default_time: string;
  theme: string;
}
