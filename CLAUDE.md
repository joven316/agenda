# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Run Everything (Recommended for local dev)
```bash
npm install          # Install concurrently at repo root (one-time)
npm start            # Starts backend on :8023 and frontend on :3023 concurrently
```

### Backend only
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8023
```

### Frontend only
```bash
cd frontend
npm install
npm run dev          # Vite dev server on :3023, proxies /api to :8023
npm run build        # Production build to frontend/dist/
```

### Docker (production)
```bash
docker compose up --build   # App on :8080
```

### Backend tests
```bash
cd backend
pytest
```

## Architecture

This is a single-user task management app with a React frontend and FastAPI backend in a monorepo.

**Data flow:** React components → `useTasks` hook (React Query) → `api/client.js` (fetch) → FastAPI → SQLAlchemy → SQLite

### Backend (`backend/`)

- **`main.py`** — FastAPI app with all route definitions. In production, also serves the built frontend from `static/`.
- **`models.py`** — SQLAlchemy ORM: `Task` (title, notes, due_date, completed, sort_order) and `Attachment` (with cascade delete). `sort_order` drives drag-and-drop ordering.
- **`schemas.py`** — Pydantic schemas for request/response validation.
- **`crud.py`** — All database operations. The `get_tasks()` function handles view-specific filtering: agenda view returns tasks with no date OR due within the current Mon–Sun week; list view returns all tasks; calendar view returns only dated tasks.
- **`database.py`** — SQLite connection. DB path is `DATABASE_URL` env var, defaulting to `/app/data/agenda.db`.
- **`utils/file_handler.py`** — Async file I/O for uploads. Files stored at `data/uploads/<task_id>/`.

Key API routes:
- `PUT /api/tasks/reorder` — Must be registered before `PUT /api/tasks/{task_id}` to avoid route collision (already correct in main.py).
- `GET /api/tasks?view=agenda|list|calendar` — View filter applied server-side.

### Frontend (`frontend/src/`)

- **`App.jsx`** — Root: wraps everything in `QueryClientProvider` + `AppProvider`. Renders one of three view components based on `currentView`, plus the always-mounted `EditPanel`.
- **`context/AppContext.jsx`** — Global UI state: `currentView`, `calendarSubView`, `currentWeekStart`, `currentMonth`, and `editPanelState` (open/closed, taskId, mode, defaultDate). No server state here.
- **`hooks/useTasks.js`** — Single hook wrapping all React Query mutations (create, update, delete, reorder). Update and reorder use optimistic updates with rollback on error. All mutations invalidate `['tasks']` on settle.
- **`api/client.js`** — Thin fetch wrapper. Attachment uploads use raw `FormData` (no JSON header); all other calls use JSON.
- **`components/EditPanel.jsx`** — Slide-in panel for creating/editing tasks. Opened via `openEditPanel(taskId, defaultDate)` from AppContext.

### View Logic

Each view component calls `useTasks(viewName)` which fetches `/api/tasks?view=<viewName>`:
- **AgendaView** — Drag-and-drop via `@dnd-kit`. On drop, calls `reorderTasks` with the full reordered array (optimistic update).
- **CalendarView** — Has week/month sub-views controlled by `calendarSubView` in context. Only shows tasks with dates; further filters client-side by day.
- **ListView** — Read-only display; single-click toggles completion, double-click opens EditPanel.

### Styling Conventions

Tailwind with custom theme (defined in `tailwind.config.js`):
- `bg-background` / `text-text` for base dark theme (`#1a1a2e` / `#f5f5f0`)
- `accent` (`#7c3aed`) / `accent-hover` (`#6d28d9`) for interactive elements
- `font-serif` = Playfair Display (headings, numbers), `font-sans` = DM Sans (body)
- Framer Motion (`motion.div`) used for list item animations and panel slide-ins

### Data Persistence

`./data/` directory (created at runtime):
- `agenda.db` — SQLite database
- `uploads/<task_id>/` — Uploaded attachments per task

In Docker this is a volume mount. In dev it's relative to where uvicorn runs (i.e., `backend/data/` unless `DATABASE_URL` env var overrides).
