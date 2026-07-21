# UrTrack — Home-Tailnet Server Based Project Tracker

A lightweight, self-hosted project tracker designed for home-tailnet servers. Track projects, tasks, reminders, notes, reports, and Q&A — all behind your own firewall.

## Features

- **Dashboard** — overview of all organizations, project counts, weekly progress
- **Projects** — create, filter, and manage projects with progress tracking
- **Reminders** — recurring reminders with next-run scheduling
- **Knowledge Base** — category-organized notes with search
- **Reports** — generate project status reports
- **Calendar** — monthly calendar with tasks and events
- **Q&A** — ask natural-language questions about your data
- **Settings** — backup config, export data, manage tags

## Tech Stack

| Layer     | Technology                              |
|-----------|-----------------------------------------|
| Frontend  | React 19, TypeScript, Vite, Tailwind CSS, Recharts |
| Backend   | Python 3.13+, FastAPI, SQLAlchemy, SQLite |
| Deploy    | systemd, Nginx (optional), Debian       |

## Quick Start

### Prerequisites

- Debian 12+ server (or any Linux with systemd)
- Python 3.13+, Node.js 20+, npm

### Deploy

```bash
# Clone the repo on your server
git clone https://github.com/your-org/urtrack.git /opt/urtrack
cd /opt/urtrack

# Run the setup script as root
sudo bash deploy/setup.sh

# Edit allowed IPs
sudo nano /opt/urtrack/deploy/urtrack.env
```

After setup, the app runs at `http://<server-ip>:8000`.

### Development

```bash
# Backend
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload

# Frontend
cd frontend
npm install
npm run dev
```

## Project Layout

```
urtrack/
├── backend/
│   └── app/
│       ├── config.py          # settings (db path, secret key, ...)
│       ├── database.py        # SQLite engine + session
│       ├── main.py            # FastAPI app + middleware
│       ├── models/            # SQLAlchemy models
│       ├── routers/           # API route handlers
│       ├── schemas/           # Pydantic request/response models
│       └── services/          # backup, export, sync stubs
├── frontend/
│   └── src/
│       ├── components/        # reusable UI components
│       ├── pages/             # route pages
│       ├── hooks/             # React hooks
│       ├── lib/               # API client, utilities
│       └── types/             # TypeScript interfaces
└── deploy/
    ├── setup.sh               # one-shot deploy script
    ├── update.sh              # pull + rebuild + restart
    ├── urtrack.service        # systemd unit file
    └── urtrack.env.template   # environment template
```

## IP Whitelist

By default only `127.0.0.1` is allowed. Edit `ALLOWED_IPS` in `urtrack.env`:

```ini
ALLOWED_IPS=192.168.1.100,203.0.113.50
```

Leave empty to allow all IPs (not recommended on public networks).

## License

MIT
