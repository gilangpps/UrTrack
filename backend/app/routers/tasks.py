from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime
from app.database import get_db
from app.models import Task
from app.schemas import TaskCreate, TaskUpdate, TaskResponse
from app.utils import add_activity_log

router = APIRouter(prefix="/api/tasks", tags=["tasks"])


@router.get("", response_model=list[TaskResponse])
def list_tasks(
    status: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    due_date_from: Optional[datetime] = Query(None),
    due_date_to: Optional[datetime] = Query(None),
    db: Session = Depends(get_db),
):
    query = db.query(Task)
    if status:
        query = query.filter(Task.status == status)
    if category:
        query = query.filter(Task.category == category)
    if due_date_from:
        query = query.filter(Task.due_date >= due_date_from)
    if due_date_to:
        query = query.filter(Task.due_date <= due_date_to)
    query = query.order_by(Task.created_at.desc())
    return [TaskResponse.model_validate(t) for t in query.all()]


@router.post("", response_model=TaskResponse, status_code=201)
def create_task(data: TaskCreate, db: Session = Depends(get_db)):
    task = Task(
        title=data.title,
        category=data.category,
        due_date=data.due_date,
        status=data.status,
        source=data.source,
        notes=data.notes,
    )
    db.add(task)
    db.commit()
    db.refresh(task)
    add_activity_log("task", task.id, "created", {"title": task.title})
    return TaskResponse.model_validate(task)


@router.get("/{task_id}", response_model=TaskResponse)
def get_task(task_id: int, db: Session = Depends(get_db)):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return TaskResponse.model_validate(task)


@router.put("/{task_id}", response_model=TaskResponse)
def update_task(task_id: int, data: TaskUpdate, db: Session = Depends(get_db)):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(task, key, value)
    task.updated_at = datetime.now()

    db.commit()
    db.refresh(task)
    add_activity_log("task", task.id, "updated", {"title": task.title, "status": task.status})
    return TaskResponse.model_validate(task)


@router.delete("/{task_id}")
def delete_task(task_id: int, db: Session = Depends(get_db)):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    db.delete(task)
    db.commit()
    add_activity_log("task", task_id, "deleted", {})
    return {"detail": "Task deleted"}
