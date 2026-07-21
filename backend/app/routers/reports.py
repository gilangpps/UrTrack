import os
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Report
from app.schemas import ReportResponse
from app.services.export import generate_weekly_report_markdown, generate_weekly_report_pdf
from app.utils import add_activity_log
from app.config import settings

router = APIRouter(prefix="/api/reports", tags=["reports"])


@router.get("", response_model=list[ReportResponse])
def list_reports(db: Session = Depends(get_db)):
    reports = db.query(Report).order_by(Report.created_at.desc()).all()
    return [ReportResponse.model_validate(r) for r in reports]


@router.post("/generate", response_model=ReportResponse)
def generate_report(week_label: str = Query(..., description="ISO week label like 2026-W29"),
                    db: Session = Depends(get_db)):
    existing = db.query(Report).filter(Report.week_label == week_label).first()
    if existing:
        content = generate_weekly_report_markdown(week_label)
        resp = ReportResponse.model_validate(existing)
        resp.content = content
        return resp

    reports_dir = os.path.join(settings.DATA_DIR, "reports")
    os.makedirs(reports_dir, exist_ok=True)

    md_path = os.path.join(reports_dir, f"{week_label}.md")
    markdown_content = generate_weekly_report_markdown(week_label)

    with open(md_path, "w", encoding="utf-8") as f:
        f.write(markdown_content)

    report = Report(
        week_label=week_label,
        local_path=md_path,
    )
    db.add(report)
    db.commit()
    db.refresh(report)

    add_activity_log("report", report.id, "generated", {"week_label": week_label})
    resp = ReportResponse.model_validate(report)
    resp.content = markdown_content
    return resp


@router.get("/{report_id}", response_model=ReportResponse)
def get_report(report_id: int, db: Session = Depends(get_db)):
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    content = None
    if report.local_path and os.path.exists(report.local_path):
        with open(report.local_path, "r", encoding="utf-8") as f:
            content = f.read()

    resp = ReportResponse.model_validate(report)
    resp.content = content
    return resp


@router.get("/{report_id}/export/markdown")
def export_report_markdown(report_id: int, db: Session = Depends(get_db)):
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    if report.local_path and os.path.exists(report.local_path):
        return FileResponse(
            report.local_path,
            media_type="text/markdown",
            filename=f"report_{report.week_label}.md",
        )

    content = generate_weekly_report_markdown(report.week_label)
    from fastapi.responses import PlainTextResponse
    return PlainTextResponse(content, media_type="text/markdown")


@router.get("/{report_id}/export/pdf")
def export_report_pdf(report_id: int, db: Session = Depends(get_db)):
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    pdf_path = generate_weekly_report_pdf(report.week_label)

    if pdf_path and os.path.exists(pdf_path) and pdf_path.endswith(".pdf"):
        return FileResponse(
            pdf_path,
            media_type="application/pdf",
            filename=f"report_{report.week_label}.pdf",
        )

    md_content = generate_weekly_report_markdown(report.week_label)
    from fastapi.responses import PlainTextResponse
    return PlainTextResponse(md_content, media_type="text/markdown")
