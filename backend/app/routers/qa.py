from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import datetime, date, timedelta
from app.database import get_db
from app.models import Project, Task, Reminder, ActivityLog, Organization
from app.schemas import QnARequest, QnAResponse
from app.utils import get_current_week_range

router = APIRouter(prefix="/api/qa", tags=["qa"])


def get_this_week_range():
    week_start, week_end = get_current_week_range()
    return (
        datetime.combine(week_start, datetime.min.time()),
        datetime.combine(week_end, datetime.max.time()),
    )


@router.post("/ask", response_model=QnAResponse)
def ask_question(data: QnARequest, db: Session = Depends(get_db)):
    query = data.query.strip().lower()
    response_data = []

    if "deadline minggu ini" in query:
        week_start, week_end = get_this_week_range()
        projects = db.query(Project).filter(
            Project.deadline >= week_start,
            Project.deadline <= week_end,
            Project.archived == False,
        ).order_by(Project.deadline.asc()).all()

        response_data = [
            {
                "type": "project",
                "id": p.id,
                "title": p.title,
                "deadline": p.deadline.isoformat() if p.deadline else None,
                "status": p.status,
            }
            for p in projects
        ]

        if projects:
            lines = [f"- **{p.title}** (deadline: {p.deadline.strftime('%d %b %Y') if p.deadline else 'N/A'})" for p in projects]
            answer = f"Berikut deadline minggu ini:\n" + "\n".join(lines)
        else:
            answer = "Tidak ada deadline minggu ini."

    elif "project aktif" in query:
        projects = db.query(Project).filter(
            Project.status == "active",
            Project.archived == False,
        ).all()
        response_data = [
            {"type": "project", "id": p.id, "title": p.title, "priority": p.priority,
             "deadline": p.deadline.isoformat() if p.deadline else None}
            for p in projects
        ]
        if projects:
            lines = [f"- **{p.title}** (priority: {p.priority})" for p in projects]
            answer = f"Project aktif ({len(projects)}):\n" + "\n".join(lines)
        else:
            answer = "Tidak ada project aktif."

    elif "project terlambat" in query:
        now = datetime.now()
        projects = db.query(Project).filter(
            Project.deadline < now,
            Project.archived == False,
            Project.status.in_(["active", "stalled"]),
        ).order_by(Project.deadline.asc()).all()
        response_data = [
            {"type": "project", "id": p.id, "title": p.title,
             "deadline": p.deadline.isoformat() if p.deadline else None, "status": p.status}
            for p in projects
        ]
        if projects:
            lines = [f"- **{p.title}** (deadline: {p.deadline.strftime('%d %b %Y') if p.deadline else 'N/A'}, status: {p.status})" for p in projects]
            answer = f"Project terlambat ({len(projects)}):\n" + "\n".join(lines)
        else:
            answer = "Tidak ada project yang terlambat."

    elif "reminder terdekat" in query:
        now = datetime.now()
        reminders = db.query(Reminder).filter(
            Reminder.active == True,
            Reminder.next_run_at >= now,
        ).order_by(Reminder.next_run_at.asc()).limit(10).all()
        response_data = [
            {"type": "reminder", "id": r.id, "title": r.title,
             "next_run_at": r.next_run_at.isoformat() if r.next_run_at else None}
            for r in reminders
        ]
        if reminders:
            lines = [f"- **{r.title}** ({r.next_run_at.strftime('%d %b %Y %H:%M') if r.next_run_at else 'N/A'})" for r in reminders]
            answer = f"Reminder terdekat:\n" + "\n".join(lines)
        else:
            answer = "Tidak ada reminder terdekat."

    elif "update" in query and "org" in query:
        parts = query.lower().split()
        org_slug = parts[-1] if len(parts) > 1 else "default"
        org = db.query(Organization).filter(Organization.slug == org_slug).first()
        if org:
            project_ids = [p.id for p in db.query(Project.id).filter(Project.organization_id == org.id).all()]
            if not project_ids:
                answer = f"Belum ada update untuk {org.name}."
            else:
                activities = db.query(ActivityLog).filter(
                    ActivityLog.entity_type == "project_update",
                    ActivityLog.entity_id.in_(project_ids),
                ).order_by(ActivityLog.created_at.desc()).limit(10).all()
                response_data = [
                    {"type": "activity", "id": a.id, "action": a.action,
                     "created_at": a.created_at.isoformat() if a.created_at else None}
                    for a in activities
                ]
                if activities:
                    lines = [f"- [{a.created_at.strftime('%d %b %Y %H:%M')}] {a.action}" for a in activities]
                    answer = f"Update terbaru {org.name}:\n" + "\n".join(lines)
                else:
                    answer = f"Belum ada update untuk {org.name}."
        else:
            answer = f"Organisasi {org_slug} tidak ditemukan."

    elif "coune labworks minggu ini" in query:
        org = db.query(Organization).filter(Organization.slug == "coune-labworks").first()
        if org:
            week_start, week_end = get_this_week_range()
            project_ids = [p.id for p in db.query(Project.id).filter(Project.organization_id == org.id).all()]
            if not project_ids:
                answer = "Tidak ada aktivitas Coune LabWorks minggu ini."
            else:
                activities = db.query(ActivityLog).filter(
                    ActivityLog.entity_type == "project_update",
                    ActivityLog.entity_id.in_(project_ids),
                    ActivityLog.created_at >= week_start,
                    ActivityLog.created_at <= week_end,
                ).order_by(ActivityLog.created_at.desc()).all()
                response_data = [
                    {"type": "activity", "id": a.id, "action": a.action,
                     "created_at": a.created_at.isoformat() if a.created_at else None}
                    for a in activities
                ]
                if activities:
                    lines = [f"- [{a.created_at.strftime('%d %b %Y %H:%M')}] {a.action}" for a in activities]
                    answer = f"Coune LabWorks minggu ini:\n" + "\n".join(lines)
                else:
                    answer = "Tidak ada aktivitas Coune LabWorks minggu ini."
        else:
            answer = "Organisasi Coune LabWorks tidak ditemukan."

    elif "tugas hari ini" in query:
        today = date.today()
        day_start = datetime.combine(today, datetime.min.time())
        day_end = day_start + timedelta(days=1)
        tasks = db.query(Task).filter(
            Task.due_date >= day_start,
            Task.due_date < day_end,
        ).order_by(Task.due_date.asc()).all()
        response_data = [
            {"type": "task", "id": t.id, "title": t.title,
             "status": t.status, "category": t.category}
            for t in tasks
        ]
        if tasks:
            lines = [f"- [{t.status}] **{t.title}** ({t.category})" for t in tasks]
            answer = f"Tugas hari ini ({len(tasks)}):\n" + "\n".join(lines)
        else:
            answer = "Tidak ada tugas untuk hari ini."

    else:
          answer = "Maaf, saya tidak mengerti pertanyaan Anda. Coba: deadline minggu ini, project aktif, project terlambat, reminder terdekat, update <org-slug>, tugas hari ini"

    return QnAResponse(answer=answer, data=response_data)
