# Impact Analysis PoC

A web-based guided experience for Dependency Impact Analysis (FMEA), replacing the Excel-based template. Built for Target platform teams to assess upstream dependency risks by CI (Configuration Item).

## Running the App

### Option 1: Docker (recommended — fully self-contained)

Requires [Docker Desktop](https://www.docker.com/products/docker-desktop/).

```bash
git clone https://github.com/mgossman71/IA-PoC.git
cd IA-PoC
docker compose up --build
```

Open **http://localhost:8080** in your browser.

Data is stored in `./data/` on your workstation and persists across restarts. To use a different host port:

```bash
PORT=9090 docker compose up --build
```

### Option 2: Local dev (hot reload)

Requires Python 3.9+ and Node 18+.

```bash
# Terminal 1 — backend
pip install -r backend/requirements.txt
uvicorn backend.main:app --reload --port 8000

# Terminal 2 — frontend
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173** in your browser.

## How It Works

1. **Enter your name** — identifies your editing session
2. **Find or create your CI** — search by CI ID, or click **+ New CI**
3. **Add failure modes** — for each upstream dependency that could fail, record:
   - Function/Feature affected
   - Failure mode of the upstream dependency
   - Dependency Severity (Hard / Soft / Optional / Boot-Only)
   - Effects on your service, guests, and workers
   - SEV × OCC × DET scores → RPN calculated automatically
   - Runbook link
4. **Export** — download an `.xlsx` file matching the original template format
5. **Sign out** — releases any CI locks and clears your session

## Locking

Only one person can edit a CI at a time. When you open a CI it is locked to your session for 30 minutes (auto-renewed while you're active). Others will see a **READ ONLY** banner with the lock holder's name. The lock is released when you click **← Exit** or **Sign out**.

## Data Storage

All data is stored as JSON files in the `./data/` directory (one file per CI). No external database or network connection is required. Back up or share the `./data/` folder to migrate data between machines.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite |
| Backend | FastAPI (Python 3.11) |
| Storage | JSON files (`./data/`) |
| Container | Docker + docker-compose |
| Export | openpyxl |
