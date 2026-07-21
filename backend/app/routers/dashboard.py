from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta, date
from app.database import get_db
from app.models import Project, Task, Reminder, ActivityLog, Organization
from app.schemas import DashboardResponse, ProjectResponse, ReminderResponse, ActivityLogResponse, OrgStatusCard
from app.utils import get_current_week_range, get_week_label

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("", response_model=DashboardResponse)
def get_dashboard(db: Session = Depends(get_db)):
    today = date.today()
    week_start, week_end = get_current_week_range()
    week_start_dt = datetime.combine(week_start, datetime.min.time())
    week_end_dt = datetime.combine(week_end, datetime.max.time())

    active_projects_q = db.query(Project).filter(
        Project.archived == False,
        Project.status == "active",
    ).order_by(Project.updated_at.desc()).limit(5).all()

    nearest_deadlines_q = db.query(Project).filter(
        Project.archived == False,
        Project.deadline.isnot(None),
        Project.status.in_(["active", "stalled"]),
    ).order_by(Project.deadline.asc()).limit(5).all()

    nearest_reminders_q = db.query(Reminder).filter(
        Reminder.active == True,
        Reminder.next_run_at.isnot(None),
    ).order_by(Reminder.next_run_at.asc()).limit(5).all()

    recent_activity_q = db.query(ActivityLog).order_by(
        ActivityLog.created_at.desc()
    ).limit(10).all()

    projects_updated_this_week = db.query(Project).filter(
        Project.updated_at >= week_start_dt,
        Project.updated_at <= week_end_dt,
    ).count()

    tasks_completed_this_week = db.query(Task).filter(
        Task.status == "completed",
        Task.updated_at >= week_start_dt,
        Task.updated_at <= week_end_dt,
    ).count()

    weekly_progress = {
        "week_label": get_week_label(today),
        "projects_updated": projects_updated_this_week,
        "tasks_completed": tasks_completed_this_week,
    }

    orgs = db.query(Organization).all()

    org_status_cards = []
    for org in orgs:
        total = db.query(func.count(Project.id)).filter(
            Project.organization_id == org.id,
            Project.archived == False,
        ).scalar() or 0

        active_cnt = db.query(func.count(Project.id)).filter(
            Project.organization_id == org.id,
            Project.archived == False,
            Project.status == "active",
        ).scalar() or 0

        stalled_cnt = db.query(func.count(Project.id)).filter(
            Project.organization_id == org.id,
            Project.archived == False,
            Project.status == "stalled",
        ).scalar() or 0

        completed_cnt = db.query(func.count(Project.id)).filter(
            Project.organization_id == org.id,
            Project.archived == False,
            Project.status == "completed",
        ).scalar() or 0

        org_status_cards.append(OrgStatusCard(
            organization=org.name,
            active_projects=active_cnt,
            stalled_projects=stalled_cnt,
            completed_projects=completed_cnt,
            total_projects=total,
        ))

    active_project_responses = []
    for p in active_projects_q:
        pr = ProjectResponse.model_validate(p)
        pr.updates = []
        active_project_responses.append(pr)

    deadline_responses = []
    for p in nearest_deadlines_q:
        pr = ProjectResponse.model_validate(p)
        pr.updates = []
        deadline_responses.append(pr)

    return DashboardResponse(
        weekly_progress=weekly_progress,
        active_projects=active_project_responses,
        nearest_deadlines=deadline_responses,
        nearest_reminders=[ReminderResponse.model_validate(r) for r in nearest_reminders_q],
        recent_activity=[ActivityLogResponse.model_validate(a) for a in recent_activity_q],
        org_status_cards=org_status_cards,
    )
