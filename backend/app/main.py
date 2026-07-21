from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.database import init_db
from app.services.scheduler import start_scheduler
from app.config import settings
from app.middleware.ip_whitelist import IPWhitelistMiddleware
from app.routers import (
    dashboard,
    projects,
    tasks,
    reminders,
    reports,
    knowledge,
    qa,
    settings as settings_router,
)
import os

app = FastAPI(
    title=settings.APP_NAME,
    version="0.1.0",
    description="UrTrack Backend API",
)

if settings.ALLOWED_IPS:
    app.add_middleware(IPWhitelistMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(dashboard.router)
app.include_router(projects.router)
app.include_router(tasks.router)
app.include_router(reminders.router)
app.include_router(reports.router)
app.include_router(knowledge.router)
app.include_router(qa.router)
app.include_router(settings_router.router)


@app.on_event("startup")
def on_startup():
    init_db()
    start_scheduler(app)
    print(f"[Startup] {settings.APP_NAME} v0.1.0 started")


@app.on_event("shutdown")
def on_shutdown():
    if hasattr(app.state, "scheduler"):
        app.state.scheduler.shutdown(wait=False)
    print("[Shutdown] Server stopped")


if not settings.PRODUCTION:
    @app.get("/")
    def root():
        return {
            "app": settings.APP_NAME,
            "version": "0.1.0",
            "status": "running",
            "endpoints": {
                "dashboard": "/api/dashboard",
                "projects": "/api/projects",
                "tasks": "/api/tasks",
                "reminders": "/api/reminders",
                "reports": "/api/reports",
                "knowledge": "/api/knowledge",
                "qa": "/api/qa",
                "settings": "/api/settings",
            },
        }

if settings.PRODUCTION and settings.FRONTEND_DIST:
    dist_path = settings.FRONTEND_DIST
    if os.path.isdir(dist_path):
        app.mount("/", StaticFiles(directory=dist_path, html=True), name="frontend")
    else:
        print(f"[WARN] Frontend dist not found: {dist_path}")


if __name__ == "__main__":
    import uvicorn
    reload_enabled = not settings.PRODUCTION
    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=reload_enabled,
    )
