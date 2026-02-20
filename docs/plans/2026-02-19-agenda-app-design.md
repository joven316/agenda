# Agenda Task Manager - Design Document

**Date:** 2026-02-19
**Author:** Design session with user
**Status:** Approved

---

## Overview

Agenda is a self-contained, single-user task management web application optimized for personal productivity. The app features three distinct views (Agenda, Calendar, List) with rich task editing, file attachments, drag-to-reorder functionality, and an emphasis on visual impressiveness. All data is stored locally in a single Docker container.

**Primary Use Case:** Personal productivity - daily task management with premium feel

---

## Architecture

### System Structure

```
┌─────────────────────────────────────────────┐
│  Single Docker Container (Port 8080)        │
│                                              │
│  ┌────────────────────────────────────────┐ │
│  │  FastAPI Backend                       │ │
│  │  - Serves API endpoints (/api/*)       │ │
│  │  - Serves static React build (/)       │ │
│  │  - Handles file uploads/downloads      │ │
│  └────────────────────────────────────────┘ │
│                                              │
│  ┌────────────────────────────────────────┐ │
│  │  SQLite Database                       │ │
│  │  /app/data/agenda.db (persisted)       │ │
│  └────────────────────────────────────────┘ │
│                                              │
│  ┌────────────────────────────────────────┐ │
│  │  File Storage                          │ │
│  │  /app/data/uploads/ (persisted)        │ │
│  └────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
         ▲
         │ Volume Mount: ./data:/app/data
         │ (Persists database + uploads)
```

### Tech Stack

**Frontend:**
- React 18 with Vite
- Tailwind CSS for styling
- Framer Motion for animations
- React Query for server state management
- @dnd-kit/core + @dnd-kit/sortable for drag-and-drop
- react-day-picker for date selection

**Backend:**
- Python 3.12
- FastAPI
- SQLAlchemy (ORM)
- SQLite (database)
- python-multipart (file uploads)
- aiofiles (async file operations)

**Deployment:**
- Docker (single container)
- Docker Compose for orchestration

### Data Flow

1. React app loads from FastAPI static file server
2. React Query fetches tasks from `/api/tasks`
3. User interactions trigger mutations (create, update, delete)
4. React Query optimistically updates UI, then syncs with server
5. File uploads handled via multipart POST
6. All data persisted to Docker volume mount (`./data`)

**Key Benefits:**
- Single-origin setup (no CORS needed)
- Optimistic updates for instant UI feedback
- Volume mount ensures data survives container restarts
- Self-contained - one command to run

---

## Data Model

### Task Table

```python
id: Integer (primary key, auto-increment)
title: String(500) (required)
notes: Text (nullable)
due_date: Date (nullable)  # null = "No Date"
completed: Boolean (default False)
sort_order: Integer  # For Agenda view drag ordering
created_at: DateTime (auto)
updated_at: DateTime (auto, on update)
```

### Attachment Table

```python
id: Integer (primary key, auto-increment)
task_id: Integer (foreign key → Task.id, CASCADE DELETE)
filename: String(255)  # Original filename for display
stored_path: String(500)  # e.g., "uploads/123/uuid_report.pdf"
file_size: Integer  # bytes, for display
uploaded_at: DateTime (auto)
```

**Key Decisions:**
- `sort_order` is specific to Agenda view (List view ignores it)
- Cascade delete ensures orphaned attachments are cleaned up
- File naming: `{uuid}_{original_filename}` prevents collisions
- Week calculation: Monday = start of week

---

## API Design

### Endpoints

```
GET    /api/tasks
       Query params: ?view=agenda|list|calendar&date=YYYY-MM-DD
       Returns: List of tasks filtered by view logic
       - agenda: no date OR due in current week (Mon-Sun)
       - list: all tasks
       - calendar: has date (frontend filters by week/month)

POST   /api/tasks
       Body: {title, notes?, due_date?, completed?}
       Returns: Created task with auto-generated sort_order
       Note: New tasks get sort_order = max(sort_order) + 1

PUT    /api/tasks/:id
       Body: {title?, notes?, due_date?, completed?}
       Returns: Updated task

DELETE /api/tasks/:id
       Deletes task + all attachments (cascade)

PUT    /api/tasks/reorder
       Body: [{id: 1, sort_order: 0}, {id: 3, sort_order: 1}, ...]
       Bulk updates sort_order for drag-and-drop

POST   /api/tasks/:id/attachments
       Multipart form data (supports multiple files)
       Returns: List of created attachments

GET    /api/tasks/:id/attachments
       Returns: List of attachments for task

GET    /api/attachments/:id/download
       Streams file with proper Content-Type header

DELETE /api/attachments/:id
       Deletes attachment file from disk + DB record
```

---

## Frontend Architecture

### Component Hierarchy

```
App.jsx
├── NavTabs (Agenda | Calendar | List)
├── AgendaView
│   ├── TaskRow (repeating, draggable)
│   └── AddRowButton
├── CalendarView
│   ├── SubNav (This Week | Monthly)
│   ├── WeeklyCalendar
│   │   └── DayColumn (7x, each with tasks + "Add task")
│   └── MonthlyCalendar
│       ├── MonthYearNavigator
│       └── CalendarGrid (shows tasks on date cells)
├── ListView
│   ├── TaskRow (simpler, shows MM/DD date)
│   └── AddRowButton
└── EditPanel (modal overlay)
    ├── TitleInput
    ├── NotesTextarea
    ├── DatePicker
    │   ├── DateDisplay (shows "Mon, Nov 17")
    │   ├── CalendarDropdown (react-day-picker)
    │   └── NoDateCheckbox
    ├── FileAttachments
    │   ├── FileList (shows uploaded files with icons)
    │   ├── UploadButton
    │   └── FileItem (with hover-to-reveal delete X)
    └── ActionButtons (remove, save)
```

### State Management

**React Query (Server State):**
```javascript
useQuery(['tasks', view, date]) → fetches filtered tasks
useMutation(createTask) → optimistic create
useMutation(updateTask) → optimistic update, auto-save
useMutation(deleteTask) → optimistic delete
useMutation(reorderTasks) → updates sort_order
useMutation(uploadAttachment) → shows progress
```

**Context API (UI State):**
```javascript
const AppContext = {
  currentView: 'agenda' | 'calendar' | 'list',
  calendarSubView: 'week' | 'month',
  currentWeekStart: Date,  // for "This Week" calendar
  currentMonth: Date,      // for Monthly calendar
  editPanelState: {
    isOpen: boolean,
    taskId: number | null,  // null = new task
    mode: 'new' | 'edit'
  }
}
```

**Key State Behaviors:**
- **Optimistic Updates**: UI updates immediately, syncs with server in background
- **Auto-save for Edits**: Existing tasks auto-save on change (500ms debounce)
- **Explicit Save for New**: New tasks require clicking "save" button
- **Cache Invalidation**: After mutations, React Query refetches to stay in sync

---

## View Specifications

### Agenda View

**Display Logic:**
- Shows tasks where `due_date IS NULL` OR `due_date` falls within current week (Mon–Sun)
- Sorted by `sort_order` ASC for active tasks
- Completed tasks display at bottom with strikethrough
- Row numbers (01, 02, 03...) are display-only, calculated from position

**Sorting:**
1. Active tasks (custom drag order, mixed "No Date" and dated)
2. Completed tasks (at bottom, strikethrough)

**Interactions:**
- **Single click row** → Toggle `completed` (strikethrough + "remove" button appears, task animates to bottom)
- **Single click again** → Un-complete (task animates to TOP of list, position 01)
- **Double click row** → Opens EditPanel in edit mode
- **Drag handle** → Reorder via @dnd-kit, calls `/api/tasks/reorder`
- **"+ add row"** → Opens EditPanel in new mode with "No Date" checked by default

**New Task Placement:**
- New tasks (both "No Date" and dated for this week) appear at bottom of active tasks (above completed)

---

### Calendar View

**Sub-navigation:** "This Week" | "Monthly"

#### This Week Sub-view

**Display Logic:**
- 7 columns (Mon–Sun) for current week
- Each column shows tasks where `due_date` matches that day
- Sorted by creation time within each day
- "No Date" tasks do NOT appear

**Interactions:**
- Click task title → Opens EditPanel
- "+ Add task" in day column → Opens EditPanel with that date pre-selected, "No Date" unchecked
- Navigate weeks: < Week of Feb 19–25 >

#### Monthly Sub-view

**Display Logic:**
- Standard month grid (6 rows × 7 columns, includes overflow from prev/next months)
- Tasks appear on date cells as task titles
- Month/year navigation: < February 2026 >
- "No Date" tasks do NOT appear

**Interactions:**
- Click task → Opens EditPanel
- "+ Add task" in date cell → Opens EditPanel with that date pre-selected
- Navigate months/years with arrow buttons

---

### List View

**Display Format:**
```
Row#  Task Title                                    Date (right-aligned)
──────────────────────────────────────────────────────────────────────
01    Build Thursday Report
02    Setup meeting
03    Build Livestreams                            02/23
04    Finish Testing CMS                           02/24
──────────────────────────────────────────────────────────────────────
05    Completed task                                        [strikethrough]
06    Completed dated task                         02/18    [strikethrough]
```

**Display Logic:**
- Shows ALL tasks (both dated and "No Date")
- Layout: Row number, Task title (left), Date if any (right-aligned)
- "No Date" tasks show only title (no date column)

**Sorting:**
1. Active "No Date" tasks (at top)
2. Active dated tasks (sorted by `due_date` ASC)
3. ALL completed tasks (absolute bottom, dated first by date, then "No Date")

**Interactions:**
- **Single click** → Toggle completed (sinks to absolute bottom with animation)
- **Un-complete dated task** → Re-sorts chronologically into active dated section
- **Un-complete "No Date" task** → Goes to TOP (position 01 in "No Date" section)
- **Double click** → Opens EditPanel
- **No drag-and-drop** (order is auto-sorted)
- **"+ add row"** → Opens EditPanel with today's date pre-selected

---

## Edit Panel Behavior

### Save Behavior (Hybrid Model)

**For NEW tasks:**
- Changes held in component state (not saved to DB)
- Click "save" → Creates task, closes panel
- Click outside or Escape → Discards changes, closes panel (no task created)
- If title is empty on "save" → Show error, keep panel open

**For EXISTING tasks:**
- Auto-saves as you type (title, notes, date changes) with 500ms debounce
- Click "save" → Just closes panel (data already saved)
- Click outside or Escape → Closes panel (data already saved)
- Click "remove" → Confirmation → Deletes task, closes panel

**File Uploads:**

**For NEW tasks:**
1. User selects files → Upload to `/api/tasks/temp/attachments`
2. Frontend stores temp attachment IDs in state
3. On "save" → Task created, temp attachments moved and associated
4. On cancel → Temp files cleaned up

**For EXISTING tasks:**
1. User selects files → Immediate upload to `/api/tasks/:id/attachments`
2. Files stored at `/app/data/uploads/{task_id}/{uuid}_{filename}`
3. UI updates immediately (optimistic)

### Close Behavior

- Click "save" button → Saves (if new) and closes
- Click outside panel → Closes (auto-saves existing, discards new)
- Press Escape → Closes (same as click outside)
- Click "remove" → Confirmation → Deletes → Closes

---

## File Handling

### File Interaction (Hover Pattern)

**In EditPanel:**
- **Hover over file** → "X" button fades in (top-right corner)
- **Click file** → Opens/downloads file (single click)
- **Click "X" (on hover)** → Shows "Are you sure?" confirmation → Deletes if confirmed

**Visual States:**
- Default: File icon + filename
- Hover: Subtle background highlight + "X" appears
- No selection state needed (single click opens)

### File Type Icons (Lucide React)

- `.docx` → FileText icon (blue tint)
- `.xlsx` → FileSpreadsheet icon (green tint)
- `.pdf` → FileType icon (red tint)
- Images (.png, .jpg, etc.) → FileImage icon
- Generic → File icon

### Storage Structure

```
/app/data/
├── agenda.db
└── uploads/
    ├── temp/                    # Temporary uploads for new tasks
    │   └── {uuid}_{filename}
    └── {task_id}/              # Task-specific uploads
        ├── {uuid}_{filename}
        └── {uuid}_{filename}
```

### Technical Details

- **File size limit:** 50MB per file (configurable)
- **Allowed types:** All types (single user, no security risk)
- **Cleanup:** Orphaned temp files cleaned up on app startup
- **Download:** FastAPI streams with proper `Content-Type` header
- **Delete:** Removes both DB record and file from disk

---

## Visual Design

### Typography

- **Heading font:** Playfair Display (serif) for "Agenda" title and row numbers
- **Body font:** DM Sans or Inter (clean geometric sans-serif)
- **Row numbers:** Large (3xl), bold, purple

### Color Palette

- **Background:** Deep charcoal (#1a1a2e)
- **Text:** Cream/off-white (#f5f5f0)
- **Accent:** Vibrant purple (#7c3aed) for numbers, buttons, tabs
- **Subtle:** Gray borders, muted text for secondary info

### Animations (Framer Motion)

**1. Task Row Entrance (on page load):**
- Staggered fade-in from bottom
- 50ms delay between each row
- Slight slide-up effect

**2. Strikethrough on Complete:**
- Line draws across text left to right (0.3s)
- Row background dims slightly
- "remove" button fades in

**3. Sink to Bottom (when completed):**
- Layout animation (Framer's `layoutId`)
- Other tasks shift smoothly to fill gap
- Duration: 0.4s ease-out

**4. Return to Top/Position (when un-completed):**
- Slides up from bottom to new position
- Other tasks shift down smoothly
- Same 0.4s ease-out

**5. Edit Panel Open:**
- Backdrop blur fades in (0.2s)
- Panel slides up from bottom + scale (0.95 → 1.0)
- Spring animation for natural feel

**6. Drag and Drop:**
- Active drag: scale(1.02), shadow, slight rotation
- Drop zones: subtle highlight
- Reorder: smooth layout animation

**7. View Transitions:**
- Crossfade between Agenda/Calendar/List (0.3s)
- Tab indicator slides smoothly under active tab

**8. File Upload:**
- Progress bar with purple fill
- Fade in when file added

### UI Details

- **Hover states:** Subtle glow or background shift
- **Button press:** scale(0.98) for tactile feedback
- **Generous whitespace:** Editorial feel
- **Floating edit panel:** Backdrop blur effect
- **Tab indicator:** Slides smoothly between active tabs

---

## Docker Configuration

### Dockerfile

```dockerfile
# Stage 1: Build frontend
FROM node:20-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Stage 2: Production
FROM python:3.12-slim
WORKDIR /app

# Install Python dependencies
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY backend/ ./

# Copy built frontend to static directory
COPY --from=frontend-build /app/frontend/dist ./static

# Create data directory
RUN mkdir -p /app/data/uploads

EXPOSE 8080
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"]
```

### docker-compose.yml

```yaml
version: '3.8'

services:
  agenda:
    build: .
    container_name: agenda-app
    ports:
      - "8080:8080"  # Change to "3000:8080" if port 8080 is in use
    volumes:
      - ./data:/app/data    # Persists SQLite DB + uploads
    restart: unless-stopped
    environment:
      - DATABASE_URL=/app/data/agenda.db
```

**Note:** Port is configurable - change `8080:8080` to `{your_port}:8080` if needed.

### First-Run Initialization

- FastAPI startup event checks if `/app/data/agenda.db` exists
- If not, creates database and runs migrations (`SQLAlchemy.create_all()`)
- Creates upload directories if missing

### Deployment Commands

```bash
# First time / updates
docker compose up --build

# Run in background
docker compose up --build -d

# View logs
docker compose logs -f agenda

# Stop
docker compose down

# Backup data
cp -r ./data ./data-backup-$(date +%Y%m%d)

# Reset (warning: deletes all data)
rm -rf ./data
```

---

## Project Structure

```
agenda-app/
├── docker-compose.yml
├── Dockerfile
├── README.md
├── docs/
│   └── plans/
│       └── 2026-02-19-agenda-app-design.md
├── backend/
│   ├── main.py              # FastAPI app, serves API + static
│   ├── models.py            # SQLAlchemy models (Task, Attachment)
│   ├── database.py          # DB setup, session management
│   ├── crud.py              # Database operations
│   ├── schemas.py           # Pydantic schemas for validation
│   ├── requirements.txt
│   └── utils/
│       └── file_handler.py  # File upload/download utilities
├── frontend/
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── index.html
│   ├── src/
│   │   ├── main.jsx
│   │   ├── App.jsx
│   │   ├── api/
│   │   │   └── client.js    # API functions, React Query setup
│   │   ├── components/
│   │   │   ├── AgendaView.jsx
│   │   │   ├── CalendarView.jsx
│   │   │   ├── ListView.jsx
│   │   │   ├── TaskRow.jsx
│   │   │   ├── EditPanel.jsx
│   │   │   ├── DatePicker.jsx
│   │   │   ├── FileAttachments.jsx
│   │   │   └── NavTabs.jsx
│   │   ├── context/
│   │   │   └── AppContext.jsx
│   │   ├── hooks/
│   │   │   └── useTasks.js
│   │   └── styles/
│   │       └── globals.css
│   └── public/
└── data/                    # Created at runtime (volume mount)
    ├── agenda.db
    └── uploads/
```

---

## Development Workflow

### Development Mode

```bash
# Terminal 1: Backend
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8080

# Terminal 2: Frontend
cd frontend
npm install
npm run dev  # Vite dev server on port 5173
```

### Production Mode

```bash
docker compose up --build
# App available at http://localhost:8080
```

---

## Key Design Decisions

1. **Single container, single user** - Optimized for personal use, no authentication needed
2. **React Query for state** - Automatic caching, optimistic updates, background sync
3. **Hybrid save model** - Auto-save edits (fast), explicit save for new (prevents accidents)
4. **View-specific sorting** - Agenda (manual), List (chronological), Calendar (by date)
5. **Completed tasks sink to bottom** - Consistent across all views, absolute bottom in List
6. **Un-complete goes to top** - Re-activating a task prioritizes it (Agenda) or re-sorts it (List)
7. **File hover pattern** - Clean UI, single-click to open, hover to delete
8. **Week starts Monday** - For "current week" calculations
9. **Volume mount persistence** - Data survives container restarts
10. **Dark theme with purple accent** - Visually impressive, editorial aesthetic

---

## Success Criteria

- ✅ Visually impressive - matches mockup aesthetic with polished animations
- ✅ Fast and responsive - optimistic updates, smooth animations
- ✅ Self-contained - one command to run (`docker compose up`)
- ✅ Data persistence - SQLite + uploads survive restarts
- ✅ Intuitive UX - drag-to-reorder, single-click complete, double-click edit
- ✅ File handling - upload, download, delete with confirmation
- ✅ Three views - Agenda (priority), Calendar (time-based), List (chronological)

---

## Next Steps

1. Create implementation plan (via writing-plans skill)
2. Set up project structure
3. Implement backend (FastAPI + SQLAlchemy)
4. Implement frontend (React + Tailwind + Framer Motion)
5. Add animations and polish
6. Docker configuration and testing
7. Documentation (README, deployment guide)

---

**Design Status:** ✅ Approved and ready for implementation
