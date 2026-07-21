from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, Any, Dict
from app.database import get_db, SessionLocal
from app.config import settings as app_settings
from app.utils import add_activity_log

router = APIRouter(prefix="/api/settings", tags=["settings"])

SETTINGS_TABLE = "app_settings"


def get_settings_from_db() -> dict:
    try:
        from app.database import engine
        from sqlalchemy import text
        with engine.connect() as conn:
            result = conn.execute(text(f"SELECT key, value FROM {SETTINGS_TABLE}"))
            return {row[0]: row[1] for row in result}
    except Exception:
        return {}


def ensure_settings_table():
    from app.database import engine
    from sqlalchemy import text, Table, Column, String, MetaData
    try:
        meta = MetaData()
        Table(SETTINGS_TABLE, meta,
              Column("key", String, primary_key=True),
              Column("value", String))
        meta.create_all(engine)
    except Exception:
        pass


@router.get("")
def get_settings():
    ensure_settings_table()
    db_settings = get_settings_from_db()
    return {
        "backup_path": db_settings.get("backup_path", app_settings.BACKUP_PATH),
        "notifications_enabled": db_settings.get("notifications_enabled", "true") == "true",
        "default_org_tags": [t.strip() for t in db_settings.get("default_org_tags", "").split(",") if t.strip()],
        "reminder_default_time": db_settings.get("reminder_default_time", "09:00"),
        "theme": db_settings.get("theme", "light"),
    }


@router.put("")
def update_settings(data: Dict[str, Any]):
    ensure_settings_table()
    from app.database import engine
    from sqlalchemy import text

    update_data = data
    with engine.connect() as conn:
        for key, value in update_data.items():
            if isinstance(value, list):
                value = ",".join(value)
            elif isinstance(value, bool):
                value = str(value).lower()
            else:
                value = str(value)
            conn.execute(
                text(f"INSERT OR REPLACE INTO {SETTINGS_TABLE} (key, value) VALUES (:key, :value)"),
                {"key": key, "value": value},
            )
        conn.commit()

    add_activity_log("settings", None, "updated", update_data)
    return get_settings()


@router.get("/health")
def health():
    return {"status": "ok"}
