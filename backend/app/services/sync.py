async def test_google_connection():
    return {"status": "ok", "connected": False, "message": "Google integration not available"}

async def sync_calendar():
    return {"status": "ok", "message": "Calendar sync not available"}

async def sync_drive():
    return {"status": "ok", "message": "Drive sync not available"}

async def sync_sheets():
    return {"status": "ok", "message": "Sheets sync not available"}
