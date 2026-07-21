import os
from datetime import date, timedelta
from app.database import SessionLocal
from app.models import Project, ProjectUpdate
from app.config import settings


def generate_weekly_report_markdown(week_label: str) -> str:
    iso_year_str, iso_week_str = week_label.split("-W")
    iso_year = int(iso_year_str)
    iso_week = int(iso_week_str)

    jan4 = date(iso_year, 1, 4)
    start_of_year = jan4 - timedelta(days=jan4.isocalendar()[2] - 1)
    monday = start_of_year + timedelta(weeks=iso_week - 1)
    sunday = monday + timedelta(days=6)

    db = SessionLocal()
    try:
        projects = (
            db.query(Project)
            .filter(Project.archived == False)
            .order_by(Project.title)
            .all()
        )

        lines = []
        lines.append(f"# Weekly Report — {week_label}")
        lines.append(f"**Period:** {monday} — {sunday}")
        lines.append("")

        if projects:
            lines.append("## Project Summary")
            lines.append("")
            lines.append("| Project | Status | Priority | Progress | Deadline |")
            lines.append("|---------|--------|----------|----------|----------|")
            for p in projects:
                last_update = (
                    db.query(ProjectUpdate)
                    .filter(ProjectUpdate.project_id == p.id)
                    .order_by(ProjectUpdate.created_at.desc())
                    .first()
                )
                progress = f"{last_update.progress_percent}%" if last_update else "\u2014"
                deadline = p.deadline.strftime("%Y-%m-%d") if p.deadline else "\u2014"
                lines.append(f"| {p.title} | {p.status} | {p.priority} | {progress} | {deadline} |")
            lines.append("")

            lines.append("## Project Details")
            lines.append("")
            for p in projects:
                lines.append(f"### {p.title}")
                lines.append("")
                lines.append(f"- **Status:** {p.status}")
                lines.append(f"- **Priority:** {p.priority}")
                if p.deadline:
                    lines.append(f"- **Deadline:** {p.deadline.strftime('%Y-%m-%d')}")
                if p.description:
                    lines.append(f"- **Description:** {p.description}")

                week_updates = (
                    db.query(ProjectUpdate)
                    .filter(
                        ProjectUpdate.project_id == p.id,
                        ProjectUpdate.created_at >= monday,
                        ProjectUpdate.created_at < monday + timedelta(days=7),
                    )
                    .order_by(ProjectUpdate.created_at.asc())
                    .all()
                )
                if week_updates:
                    lines.append("")
                    lines.append("**Updates this week:**")
                    for u in week_updates:
                        lines.append(f"- {u.created_at.strftime('%a %d %b')} \u2014 {u.note} (progress: {u.progress_percent}%)")
                lines.append("")
        else:
            lines.append("No active projects found.")
            lines.append("")

        return "\n".join(lines)
    finally:
        db.close()


def generate_weekly_report_pdf(week_label: str) -> str | None:
    reports_dir = os.path.join(settings.DATA_DIR, "reports")
    os.makedirs(reports_dir, exist_ok=True)

    markdown_content = generate_weekly_report_markdown(week_label)

    import markdown as md_lib

    html_content = md_lib.markdown(markdown_content, extensions=["extra"])

    html_template = f"""<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
body {{ font-family: sans-serif; margin: 2em; }}
table {{ border-collapse: collapse; width: 100%; }}
th, td {{ border: 1px solid #ccc; padding: 8px; text-align: left; }}
th {{ background: #f0f0f0; }}
</style>
</head>
<body>
{html_content}
</body>
</html>"""

    from weasyprint import HTML

    pdf_path = os.path.join(reports_dir, f"{week_label}.pdf")
    try:
        HTML(string=html_template).write_pdf(pdf_path)
        return pdf_path
    except Exception:
        return None
