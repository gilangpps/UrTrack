from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse
from app.config import settings


class IPWhitelistMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        if not settings.ALLOWED_IPS:
            return await call_next(request)

        client_ip = request.client.host if request.client else "unknown"
        forwarded = request.headers.get("X-Forwarded-For")
        if forwarded:
            client_ip = forwarded.split(",")[0].strip()

        if client_ip not in settings.ALLOWED_IPS and client_ip != "127.0.0.1":
            return JSONResponse(
                status_code=403,
                content={"detail": f"Akses ditolak: IP {client_ip} tidak terdaftar"},
            )

        return await call_next(request)
