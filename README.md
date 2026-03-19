# Impact Analysis - Demo

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

1. **Enter your name** — identifies your editing session (stored per browser tab)
2. **Find or create your CI** — search by CI ID, or click **+ New CI**
3. **Add failure modes** — for each upstream dependency that could fail, record:
   - Function/Feature affected
   - Failure mode of the upstream dependency
   - Dependency Severity (Hard / Soft / Optional / Boot-Only)
   - Effect on your service
   - SEV × OCC × DET scores → RPN calculated automatically and color-coded (green / orange / red)
   - Runbook link
4. **View JSON** — click the `{ }` button on any row to inspect the raw JSON for that failure mode
5. **Export** — download an `.xlsx` file matching the original template format (green header row)
5. **Sign out** — releases any CI locks and clears your session

The browser **Back** button navigates within the app (CI editor → CI list) rather than leaving the page. Refreshing the page at any point restores the correct view.

## Locking

Only one person can edit a CI at a time. When you open a CI it is locked to your session for **30 minutes**, auto-renewed every 5 minutes while you're active.

- Other users see a **READ ONLY** banner showing the lock holder's name and a **live countdown** ticking down to expiry
- When the countdown hits zero the banner turns red and a **Take Edit Lock** button appears so the waiting user can immediately claim it
- The lock is released when you click **← Exit**, **Sign out**, or close the tab
- CI cards on the list page show the lock holder and relative time remaining (e.g. *28m left*)

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
