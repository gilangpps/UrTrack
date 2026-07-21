from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime
from app.database import get_db
from app.models import Reminder
from app.schemas import ReminderCreate, ReminderUpdate, ReminderResponse
from app.utils import add_activity_log

router = APIRouter(prefix="/api/reminders", tags=["reminders"])


@router.get("", response_model=list[ReminderResponse])
def list_reminders(
    active: Optional[bool] = Query(None),
    db: Session = Depends(get_db),
):
    query = db.query(Reminder)
    if active is not None:
        query = query.filter(Reminder.active == active)
    query = query.order_by(Reminder.next_run_at.asc().nullslast())
    return [ReminderResponse.model_validate(r) for r in query.all()]


@router.post("", response_model=ReminderResponse, status_code=201)
def create_reminder(data: ReminderCreate, db: Session = Depends(get_db)):
    reminder = Reminder(
        title=data.title,
        recurrence_type=data.recurrence_type,
        recurrence_rule=data.recurrence_rule,
        next_run_at=data.next_run_at,
        active=data.active,
        notes=data.notes,
        linked_task_id=data.linked_task_id,
    )
    db.add(reminder)
    db.commit()
    db.refresh(reminder)
    add_activity_log("reminder", reminder.id, "created", {"title": reminder.title})
    return ReminderResponse.model_validate(reminder)


@router.put("/{reminder_id}", response_model=ReminderResponse)
def update_reminder(reminder_id: int, data: ReminderUpdate, db: Session = Depends(get_db)):
    reminder = db.query(Reminder).filter(Reminder.id == reminder_id).first()
    if not reminder:
        raise HTTPException(status_code=404, detail="Reminder not found")

    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(reminder, key, value)
    reminder.updated_at = datetime.now()

    db.commit()
    db.refresh(reminder)
    add_activity_log("reminder", reminder.id, "updated", {"title": reminder.title})
    return ReminderResponse.model_validate(reminder)


@router.delete("/{reminder_id}")
def delete_reminder(reminder_id: int, db: Session = Depends(get_db)):
    reminder = db.query(Reminder).filter(Reminder.id == reminder_id).first()
    if not reminder:
        raise HTTPException(status_code=404, detail="Reminder not found")
    db.delete(reminder)
    db.commit()
    add_activity_log("reminder", reminder_id, "deleted", {})
    return {"detail": "Reminder deleted"}


@router.post("/{reminder_id}/duplicate", response_model=ReminderResponse, status_code=201)
def duplicate_reminder(reminder_id: int, db: Session = Depends(get_db)):
    original = db.query(Reminder).filter(Reminder.id == reminder_id).first()
    if not original:
        raise HTTPException(status_code=404, detail="Reminder not found")

    reminder = Reminder(
        title=f"{original.title} (copy)",
        recurrence_type=original.recurrence_type,
        recurrence_rule=original.recurrence_rule,
        next_run_at=original.next_run_at,
        active=original.active,
        notes=original.notes,
        linked_task_id=original.linked_task_id,
    )
    db.add(reminder)
    db.commit()
    db.refresh(reminder)
    add_activity_log("reminder", reminder.id, "duplicated", {"source_id": reminder_id})
    return ReminderResponse.model_validate(reminder)


@router.post("/{reminder_id}/pause", response_model=ReminderResponse)
def toggle_reminder_pause(reminder_id: int, db: Session = Depends(get_db)):
    reminder = db.query(Reminder).filter(Reminder.id == reminder_id).first()
    if not reminder:
        raise HTTPException(status_code=404, detail="Reminder not found")

    reminder.active = not reminder.active
    reminder.updated_at = datetime.now()
    db.commit()
    db.refresh(reminder)
    action = "paused" if not reminder.active else "resumed"
    add_activity_log("reminder", reminder.id, action, {"title": reminder.title})
    return ReminderResponse.model_validate(reminder)
