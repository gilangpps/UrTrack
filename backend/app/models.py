from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class Organization(Base):
    __tablename__ = "organizations"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    slug = Column(String, unique=True, nullable=False)
    color = Column(String, default="#1890ff")
    created_at = Column(DateTime, default=func.now())

    projects = relationship("Project", back_populates="organization", lazy="selectin")


class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=True)
    title = Column(String, nullable=False)
    status = Column(String, default="active")
    priority = Column(String, default="medium")
    start_date = Column(DateTime, nullable=True)
    deadline = Column(DateTime, nullable=True)
    description = Column(Text, default="")
    evaluation = Column(Text, default="")
    drive_folder_id = Column(String, nullable=True)
    calendar_event_id = Column(String, nullable=True)
    repo_url = Column(String, nullable=True)
    archived = Column(Boolean, default=False)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    organization = relationship("Organization", back_populates="projects", lazy="selectin")
    updates = relationship("ProjectUpdate", back_populates="project", lazy="selectin", cascade="all, delete-orphan")


class ProjectUpdate(Base):
    __tablename__ = "project_updates"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    note = Column(Text, nullable=False)
    progress_percent = Column(Integer, default=0)
    created_at = Column(DateTime, default=func.now())

    project = relationship("Project", back_populates="updates", lazy="selectin")


class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    category = Column(String, default="general")
    due_date = Column(DateTime, nullable=True)
    status = Column(String, default="pending")
    source = Column(String, default="manual")
    notes = Column(Text, default="")
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())


class Reminder(Base):
    __tablename__ = "reminders"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    recurrence_type = Column(String, default="once")
    recurrence_rule = Column(String, nullable=True)
    next_run_at = Column(DateTime, nullable=True)
    active = Column(Boolean, default=True)
    notes = Column(Text, default="")
    linked_task_id = Column(Integer, ForeignKey("tasks.id"), nullable=True)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())


class Attachment(Base):
    __tablename__ = "attachments"

    id = Column(Integer, primary_key=True, index=True)
    related_type = Column(String, nullable=False)
    related_id = Column(Integer, nullable=False)
    file_name = Column(String, nullable=False)
    local_path = Column(String, nullable=False)
    drive_file_id = Column(String, nullable=True)
    mime_type = Column(String, nullable=False)
    created_at = Column(DateTime, default=func.now())


class Report(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True)
    week_label = Column(String, nullable=False)
    local_path = Column(String, nullable=True)
    drive_file_id = Column(String, nullable=True)
    created_at = Column(DateTime, default=func.now())


class KnowledgeNote(Base):
    __tablename__ = "knowledge_notes"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    category = Column(String, default="general")
    content = Column(Text, default="")
    tags = Column(String, default="")
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())


class ActivityLog(Base):
    __tablename__ = "activity_log"

    id = Column(Integer, primary_key=True, index=True)
    entity_type = Column(String, nullable=False)
    entity_id = Column(Integer, nullable=True)
    action = Column(String, nullable=False)
    payload_json = Column(Text, nullable=True)
    created_at = Column(DateTime, default=func.now())
