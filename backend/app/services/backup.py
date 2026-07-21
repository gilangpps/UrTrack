import shutil
import os
from datetime import datetime
from app.config import settings


def create_backup() -> str:
    backup_dir = settings.BACKUP_PATH
    os.makedirs(backup_dir, exist_ok=True)

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_filename = f"urtrack_backup_{timestamp}.db"
    backup_path = os.path.join(backup_dir, backup_filename)

    db_path = settings.DATABASE_PATH
    if os.path.exists(db_path):
        shutil.copy2(db_path, backup_path)
        print(f"[Backup] Created backup: {backup_path}")
    else:
        print(f"[Backup] Database not found at {db_path}")

    return backup_path


def rotate_backups(keep: int = 7):
    backup_dir = settings.BACKUP_PATH
    if not os.path.exists(backup_dir):
        return

    files = [
        os.path.join(backup_dir, f)
        for f in os.listdir(backup_dir)
        if f.startswith("urtrack_backup_") and f.endswith(".db")
    ]
    files.sort(key=os.path.getmtime, reverse=True)

    for old_file in files[keep:]:
        try:
            os.remove(old_file)
            print(f"[Backup] Removed old backup: {old_file}")
        except OSError as e:
            print(f"[Backup] Error removing {old_file}: {e}")


def list_backups():
    backup_dir = settings.BACKUP_PATH
    if not os.path.exists(backup_dir):
        return []

    files = [
        os.path.join(backup_dir, f)
        for f in os.listdir(backup_dir)
        if f.startswith("urtrack_backup_") and f.endswith(".db")
    ]
    files.sort(key=os.path.getmtime, reverse=True)

    result = []
    for f in files:
        stat = os.stat(f)
        result.append({
            "path": f,
            "filename": os.path.basename(f),
            "size_bytes": stat.st_size,
            "created_at": datetime.fromtimestamp(stat.st_mtime).isoformat(),
        })
    return result
