from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from datetime import datetime, date, timedelta
from typing import Optional
from app.database import get_db
from app.models import Task, Reminder
from app.schemas import CalendarTaskResponse, TaskResponse, ReminderResponse
from app.utils import get_current_week_range

router = APIRouter(prefix="/api/calendar", tags=["calendar"])


def date_to_datetime(d: date) -> datetime:
    return datetime.combine(d, datetime.min.time())


@router.get("", response_model=list[CalendarTaskResponse])
def get_calendar(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    if start_date:
        start = date.fromisoformat(start_date)
    else:
        start = date.today() - timedelta(days=7)

    if end_date:
        end = date.fromisoformat(end_date)
    else:
        end = date.today() + timedelta(days=7)

    results = []
    current = start
    while current <= end:
        day_start = date_to_datetime(current)
        day_end = date_to_datetime(current) + timedelta(days=1)

        tasks = db.query(Task).filter(
            Task.due_date >= day_start,
            Task.due_date < day_end,
        ).order_by(Task.due_date.asc()).all()

        reminders = db.query(Reminder).filter(
            Reminder.next_run_at >= day_start,
            Reminder.next_run_at < day_end,
            Reminder.active == True,
        ).order_by(Reminder.next_run_at.asc()).all()

        if tasks or reminders:
            results.append(CalendarTaskResponse(
                date=current.isoformat(),
                tasks=[TaskResponse.model_validate(t) for t in tasks],
                reminders=[ReminderResponse.model_validate(r) for r in reminders],
            ))

        current += timedelta(days=1)

    return results


@router.get("/today", response_model=CalendarTaskResponse)
def get_today(db: Session = Depends(get_db)):
    today = date.today()
    day_start = date_to_datetime(today)
    day_end = day_start + timedelta(days=1)

    tasks = db.query(Task).filter(
        Task.due_date >= day_start,
        Task.due_date < day_end,
    ).order_by(Task.due_date.asc()).all()

    reminders = db.query(Reminder).filter(
        Reminder.next_run_at >= day_start,
        Reminder.next_run_at < day_end,
        Reminder.active == True,
    ).order_by(Reminder.next_run_at.asc()).all()

    return CalendarTaskResponse(
        date=today.isoformat(),
        tasks=[TaskResponse.model_validate(t) for t in tasks],
        reminders=[ReminderResponse.model_validate(r) for r in reminders],
    )


@router.get("/week", response_model=list[CalendarTaskResponse])
def get_week(db: Session = Depends(get_db)):
    week_start, week_end = get_current_week_range()

    results = []
    current = week_start
    while current <= week_end:
        day_start = date_to_datetime(current)
        day_end = day_start + timedelta(days=1)

        tasks = db.query(Task).filter(
            Task.due_date >= day_start,
            Task.due_date < day_end,
        ).order_by(Task.due_date.asc()).all()

        reminders = db.query(Reminder).filter(
            Reminder.next_run_at >= day_start,
            Reminder.next_run_at < day_end,
            Reminder.active == True,
        ).order_by(Reminder.next_run_at.asc()).all()

        if tasks or reminders:
            results.append(CalendarTaskResponse(
                date=current.isoformat(),
                tasks=[TaskResponse.model_validate(t) for t in tasks],
                reminders=[ReminderResponse.model_validate(r) for r in reminders],
            ))

        current += timedelta(days=1)

    return results
