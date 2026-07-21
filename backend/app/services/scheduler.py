from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from datetime import datetime, timedelta
from app.utils import add_activity_log
from app.database import SessionLocal
from app.models import Project, Reminder


def daily_sync_check():
    add_activity_log("system", None, "sync_check", {"message": "Daily sync check executed"})
    print(f"[Scheduler] Daily sync check at {datetime.now()}")


def reminder_execution():
    db = SessionLocal()
    try:
        now = datetime.now()
        due_reminders = db.query(Reminder).filter(
            Reminder.active == True,
            Reminder.next_run_at <= now,
        ).all()
        for reminder in due_reminders:
            add_activity_log(
                "reminder", reminder.id, "triggered",
                {"title": reminder.title, "next_run_at": str(reminder.next_run_at)}
            )
            if reminder.recurrence_type == "once":
                reminder.active = False
                reminder.next_run_at = None
            elif reminder.recurrence_type == "daily":
                reminder.next_run_at = now + timedelta(days=1)
            elif reminder.recurrence_type == "weekly":
                reminder.next_run_at = now + timedelta(weeks=1)
            elif reminder.recurrence_type == "biweekly":
                reminder.next_run_at = now + timedelta(weeks=2)
            elif reminder.recurrence_type == "monthly":
                reminder.next_run_at = now + timedelta(days=30)
        db.commit()
        if due_reminders:
            print(f"[Scheduler] Triggered {len(due_reminders)} reminder(s)")
    except Exception as e:
        db.rollback()
        print(f"[Scheduler] reminder_execution error: {e}")
    finally:
        db.close()


def weekly_report_generation():
    add_activity_log("system", None, "weekly_report", {"message": "Weekly report generation triggered"})
    print(f"[Scheduler] Weekly report generation at {datetime.now()}")


def stale_project_detection():
    db = SessionLocal()
    try:
        fourteen_days_ago = datetime.now() - timedelta(days=14)
        stale_projects = db.query(Project).filter(
            Project.updated_at < fourteen_days_ago,
            Project.archived == False,
            Project.status.in_(["active", "stalled"]),
        ).all()
        for project in stale_projects:
            if project.status == "active":
                project.status = "stalled"
                add_activity_log("project", project.id, "auto_stalled",
                                 {"title": project.title, "reason": "No update in 14 days"})
        db.commit()
        if stale_projects:
            print(f"[Scheduler] Stale project detection: {len(stale_projects)} project(s) auto-stalled")
    except Exception as e:
        db.rollback()
        print(f"[Scheduler] stale_project_detection error: {e}")
    finally:
        db.close()


def overdue_detection():
    db = SessionLocal()
    try:
        now = datetime.now()
        overdue_projects = db.query(Project).filter(
            Project.deadline < now,
            Project.archived == False,
            Project.status.in_(["active", "stalled"]),
        ).all()
        for project in overdue_projects:
            add_activity_log("project", project.id, "overdue",
                             {"title": project.title, "deadline": str(project.deadline)})
        if overdue_projects:
            print(f"[Scheduler] Overdue detection: {len(overdue_projects)} project(s) overdue")
    except Exception as e:
        print(f"[Scheduler] overdue_detection error: {e}")
    finally:
        db.close()


def backup_rotation():
    from app.services.backup import create_backup, rotate_backups
    try:
        path = create_backup()
        rotate_backups(keep=7)
        print(f"[Scheduler] Backup created: {path}")
    except Exception as e:
        print(f"[Scheduler] backup_rotation error: {e}")


def start_scheduler(app):
    scheduler = BackgroundScheduler()
    scheduler.add_job(daily_sync_check, CronTrigger(hour=6, minute=0), id="daily_sync_check")
    scheduler.add_job(reminder_execution, CronTrigger(minute="*/5"), id="reminder_execution")
    scheduler.add_job(weekly_report_generation, CronTrigger(day_of_week="mon", hour=8, minute=0),
                      id="weekly_report_generation")
    scheduler.add_job(stale_project_detection, CronTrigger(hour=2, minute=0), id="stale_project_detection")
    scheduler.add_job(overdue_detection, CronTrigger(hour=3, minute=0), id="overdue_detection")
    scheduler.add_job(backup_rotation, CronTrigger(day_of_week="sun", hour=4, minute=0), id="backup_rotation")
    scheduler.start()
    print("[Scheduler] Started background scheduler")

    def shutdown_scheduler():
        scheduler.shutdown(wait=False)
        print("[Scheduler] Shutdown")

    app.state.scheduler = scheduler
    return scheduler
