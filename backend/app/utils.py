from datetime import datetime, timedelta, date
from app.database import SessionLocal
from app.models import ActivityLog
import os


def get_week_label(dt: date = None) -> str:
    if dt is None:
        dt = date.today()
    iso_year, iso_week, _ = dt.isocalendar()
    return f"{iso_year}-W{iso_week:02d}"


def get_current_week_range():
    today = date.today()
    start = today - timedelta(days=today.weekday())
    end = start + timedelta(days=6)
    return start, end


def add_activity_log(entity_type: str, entity_id, action: str, payload: dict = None):
    import json
    db = SessionLocal()
    try:
        log = ActivityLog(
            entity_type=entity_type,
            entity_id=entity_id,
            action=action,
            payload_json=json.dumps(payload) if payload else None,
        )
        db.add(log)
        db.commit()
    except Exception:
        db.rollback()
    finally:
        db.close()


def create_local_folder(path: str):
    os.makedirs(path, exist_ok=True)
