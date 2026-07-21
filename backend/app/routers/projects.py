from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
from app.database import get_db
from app.models import Project, ProjectUpdate, Organization
from app.schemas import (
    ProjectCreate, ProjectUpdateModel, ProjectResponse,
    ProjectListResponse, ProjectUpdateCreate, ProjectUpdateResponse,
)
from app.utils import add_activity_log, create_local_folder
from app.config import settings
from datetime import datetime
import os

router = APIRouter(prefix="/api/projects", tags=["projects"])


def project_to_response(p: Project, db: Session) -> ProjectResponse:
    updates = db.query(ProjectUpdate).filter(
        ProjectUpdate.project_id == p.id
    ).order_by(ProjectUpdate.created_at.desc()).all()
    pr = ProjectResponse.model_validate(p)
    pr.updates = [ProjectUpdateResponse.model_validate(u) for u in updates]
    return pr


@router.get("", response_model=ProjectListResponse)
def list_projects(
    tag: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    organization_id: Optional[int] = Query(None),
    search: Optional[str] = Query(None),
    archived: Optional[bool] = Query(None),
    db: Session = Depends(get_db),
):
    query = db.query(Project)
    if status:
        query = query.filter(Project.status == status)
    if organization_id:
        query = query.filter(Project.organization_id == organization_id)
    if search:
        query = query.filter(Project.title.contains(search))
    if archived is not None:
        query = query.filter(Project.archived == archived)
    else:
        query = query.filter(Project.archived == False)
    if tag:
        query = query.filter(Project.description.contains(tag))

    query = query.order_by(Project.updated_at.desc())
    projects = query.all()
    items = [project_to_response(p, db) for p in projects]
    return ProjectListResponse(items=items, total=len(items))


@router.post("", response_model=ProjectResponse, status_code=201)
def create_project(data: ProjectCreate, db: Session = Depends(get_db)):
    project = Project(
        organization_id=data.organization_id,
        title=data.title,
        status=data.status,
        priority=data.priority,
        start_date=data.start_date,
        deadline=data.deadline,
        description=data.description,
        evaluation=data.evaluation,
        repo_url=data.repo_url,
    )
    db.add(project)
    db.commit()
    db.refresh(project)

    project_dir = os.path.join(settings.DATA_DIR, "projects", f"project_{project.id}")
    create_local_folder(project_dir)

    add_activity_log("project", project.id, "created", {"title": project.title})
    return project_to_response(project, db)


@router.get("/{project_id}", response_model=ProjectResponse)
def get_project(project_id: int, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project_to_response(project, db)


@router.put("/{project_id}", response_model=ProjectResponse)
def update_project(project_id: int, data: ProjectUpdateModel, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(project, key, value)

    db.commit()
    db.refresh(project)
    add_activity_log("project", project.id, "updated", {"title": project.title})
    return project_to_response(project, db)


@router.delete("/{project_id}")
def archive_project(project_id: int, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    project.archived = True
    db.commit()
    add_activity_log("project", project.id, "archived", {"title": project.title})
    return {"detail": "Project archived"}


@router.post("/{project_id}/updates", response_model=ProjectUpdateResponse, status_code=201)
def add_project_update(project_id: int, data: ProjectUpdateCreate, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    update = ProjectUpdate(
        project_id=project_id,
        note=data.note,
        progress_percent=data.progress_percent,
    )
    db.add(update)

    project.updated_at = datetime.now()
    db.commit()
    db.refresh(update)
    add_activity_log("project_update", update.id, "created",
                     {"project_id": project_id, "progress": data.progress_percent})
    return ProjectUpdateResponse.model_validate(update)


@router.get("/{project_id}/updates", response_model=list[ProjectUpdateResponse])
def list_project_updates(project_id: int, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    updates = db.query(ProjectUpdate).filter(
        ProjectUpdate.project_id == project_id
    ).order_by(ProjectUpdate.created_at.desc()).all()
    return [ProjectUpdateResponse.model_validate(u) for u in updates]
