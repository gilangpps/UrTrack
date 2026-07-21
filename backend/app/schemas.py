from pydantic import BaseModel
from typing import Optional, List, Any
from datetime import datetime, date


class OrganizationCreate(BaseModel):
    name: str
    slug: str
    color: str = "#1890ff"


class OrganizationResponse(BaseModel):
    id: int
    name: str
    slug: str
    color: str
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ProjectCreate(BaseModel):
    organization_id: Optional[int] = None
    title: str
    status: str = "active"
    priority: str = "medium"
    start_date: Optional[datetime] = None
    deadline: Optional[datetime] = None
    description: str = ""
    evaluation: str = ""
    repo_url: Optional[str] = None


class ProjectUpdateModel(BaseModel):
    organization_id: Optional[int] = None
    title: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    start_date: Optional[datetime] = None
    deadline: Optional[datetime] = None
    description: Optional[str] = None
    evaluation: Optional[str] = None
    repo_url: Optional[str] = None
    archived: Optional[bool] = None


class ProjectResponse(BaseModel):
    id: int
    organization_id: Optional[int] = None
    title: str
    status: str
    priority: str
    start_date: Optional[datetime] = None
    deadline: Optional[datetime] = None
    description: str
    evaluation: str
    repo_url: Optional[str] = None
    archived: bool
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    organization: Optional[OrganizationResponse] = None
    updates: List[Any] = []

    class Config:
        from_attributes = True


class ProjectListResponse(BaseModel):
    items: List[ProjectResponse]
    total: int


class ProjectUpdateCreate(BaseModel):
    note: str
    progress_percent: int = 0


class ProjectUpdateResponse(BaseModel):
    id: int
    project_id: int
    note: str
    progress_percent: int
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class TaskCreate(BaseModel):
    title: str
    category: str = "general"
    due_date: Optional[datetime] = None
    status: str = "pending"
    source: str = "manual"
    notes: str = ""


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    category: Optional[str] = None
    due_date: Optional[datetime] = None
    status: Optional[str] = None
    notes: Optional[str] = None


class TaskResponse(BaseModel):
    id: int
    title: str
    category: str
    due_date: Optional[datetime] = None
    status: str
    source: str
    notes: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ReminderCreate(BaseModel):
    title: str
    recurrence_type: str = "once"
    recurrence_rule: Optional[str] = None
    next_run_at: Optional[datetime] = None
    active: bool = True
    notes: str = ""
    linked_task_id: Optional[int] = None


class ReminderUpdate(BaseModel):
    title: Optional[str] = None
    recurrence_type: Optional[str] = None
    recurrence_rule: Optional[str] = None
    next_run_at: Optional[datetime] = None
    active: Optional[bool] = None
    notes: Optional[str] = None
    linked_task_id: Optional[int] = None


class ReminderResponse(BaseModel):
    id: int
    title: str
    recurrence_type: str
    recurrence_rule: Optional[str] = None
    next_run_at: Optional[datetime] = None
    active: bool
    notes: str
    linked_task_id: Optional[int] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class AttachmentResponse(BaseModel):
    id: int
    related_type: str
    related_id: int
    file_name: str
    local_path: str
    mime_type: str
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ReportResponse(BaseModel):
    id: int
    week_label: str
    local_path: Optional[str] = None
    created_at: Optional[datetime] = None
    content: Optional[str] = None

    class Config:
        from_attributes = True


class KnowledgeNoteCreate(BaseModel):
    title: str
    category: str = "general"
    content: str = ""
    tags: str = ""


class KnowledgeNoteUpdate(BaseModel):
    title: Optional[str] = None
    category: Optional[str] = None
    content: Optional[str] = None
    tags: Optional[str] = None


class KnowledgeNoteResponse(BaseModel):
    id: int
    title: str
    category: str
    content: str
    tags: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ActivityLogResponse(BaseModel):
    id: int
    entity_type: str
    entity_id: Optional[int] = None
    action: str
    payload_json: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class OrgStatusCard(BaseModel):
    organization: str
    active_projects: int
    stalled_projects: int
    completed_projects: int
    total_projects: int


class DashboardResponse(BaseModel):
    weekly_progress: dict
    active_projects: List[ProjectResponse]
    nearest_deadlines: List[ProjectResponse]
    nearest_reminders: List[ReminderResponse]
    recent_activity: List[ActivityLogResponse]
    org_status_cards: List[OrgStatusCard]


class CalendarTaskResponse(BaseModel):
    date: str
    tasks: List[TaskResponse]
    reminders: List[ReminderResponse]


class QnARequest(BaseModel):
    query: str


class QnAResponse(BaseModel):
    answer: str
    data: List[Any] = []
