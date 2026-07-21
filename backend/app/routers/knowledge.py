from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime
from app.database import get_db
from app.models import KnowledgeNote
from app.schemas import KnowledgeNoteCreate, KnowledgeNoteUpdate, KnowledgeNoteResponse
from app.utils import add_activity_log

router = APIRouter(prefix="/api/knowledge", tags=["knowledge"])


@router.get("", response_model=list[KnowledgeNoteResponse])
def list_knowledge(
    search: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    query = db.query(KnowledgeNote)
    if search:
        query = query.filter(
            KnowledgeNote.title.contains(search) |
            KnowledgeNote.content.contains(search) |
            KnowledgeNote.tags.contains(search)
        )
    if category:
        query = query.filter(KnowledgeNote.category == category)
    query = query.order_by(KnowledgeNote.updated_at.desc())
    return [KnowledgeNoteResponse.model_validate(n) for n in query.all()]


@router.post("", response_model=KnowledgeNoteResponse, status_code=201)
def create_knowledge(data: KnowledgeNoteCreate, db: Session = Depends(get_db)):
    note = KnowledgeNote(
        title=data.title,
        category=data.category,
        content=data.content,
        tags=data.tags,
    )
    db.add(note)
    db.commit()
    db.refresh(note)
    add_activity_log("knowledge", note.id, "created", {"title": note.title})
    return KnowledgeNoteResponse.model_validate(note)


@router.get("/{note_id}", response_model=KnowledgeNoteResponse)
def get_knowledge(note_id: int, db: Session = Depends(get_db)):
    note = db.query(KnowledgeNote).filter(KnowledgeNote.id == note_id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Knowledge note not found")
    return KnowledgeNoteResponse.model_validate(note)


@router.put("/{note_id}", response_model=KnowledgeNoteResponse)
def update_knowledge(note_id: int, data: KnowledgeNoteUpdate, db: Session = Depends(get_db)):
    note = db.query(KnowledgeNote).filter(KnowledgeNote.id == note_id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Knowledge note not found")

    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(note, key, value)
    note.updated_at = datetime.now()

    db.commit()
    db.refresh(note)
    add_activity_log("knowledge", note.id, "updated", {"title": note.title})
    return KnowledgeNoteResponse.model_validate(note)


@router.delete("/{note_id}")
def delete_knowledge(note_id: int, db: Session = Depends(get_db)):
    note = db.query(KnowledgeNote).filter(KnowledgeNote.id == note_id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Knowledge note not found")
    db.delete(note)
    db.commit()
    add_activity_log("knowledge", note_id, "deleted", {})
    return {"detail": "Knowledge note deleted"}
