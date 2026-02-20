# Agenda Task Manager

A visually impressive, self-contained task management web application with three views (Agenda, Calendar, List), file attachments, and drag-to-reorder functionality.

## Features

- **Three Views:**
  - **Agenda**: Your priority workspace with drag-and-drop reordering for tasks with no date or due this week
  - **Calendar**: Weekly and monthly calendar views with task visualization
  - **List**: Chronological list of all tasks sorted by date and completion status

- **Rich Task Management:**
  - Create, edit, and delete tasks
  - Add notes and file attachments
  - Set due dates or mark as "No Date"
  - Drag-to-reorder tasks in Agenda view
  - Single-click to mark complete, double-click to edit

- **File Attachments:**
  - Upload multiple files per task
  - File type icons for common formats (Word, Excel, PDF, images)
  - Download files with single click
  - Delete with confirmation

- **Visual Design:**
  - Dark theme with purple accent (#7c3aed)
  - Playfair Display serif font for headings and numbers
  - DM Sans for body text
  - Smooth animations powered by Framer Motion
  - Responsive layout (optimized for desktop 1024px+)

## Tech Stack

**Frontend:**
- React 18 with Vite
- Tailwind CSS for styling
- Framer Motion for animations
- React Query for server state management
- @dnd-kit for drag-and-drop
- react-day-picker for date selection
- Lucide React for icons

**Backend:**
- Python 3.12
- FastAPI
- SQLAlchemy ORM
- SQLite database
- Async file handling with aiofiles

**Deployment:**
- Docker (single container)
- Docker Compose for orchestration

## Quick Start

### Prerequisites
- Docker and Docker Compose installed
- No other dependencies required!

### Run with Docker (Recommended)

```bash
# Clone the repository
git clone <repository-url>
cd Agenda

# Build and run
docker compose up --build

# App available at http://localhost:8080
```

The app will start on port 8080. If this port is in use, edit `docker-compose.yml`:
```yaml
ports:
  - "3000:8080"  # Change 3000 to your preferred port
```

### Development Mode

#### Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8080
```

#### Frontend
```bash
cd frontend
npm install
npm run dev
```

Frontend dev server runs on http://localhost:5173 and proxies API requests to backend on port 8080.

## Project Structure

```
agenda-app/
├── docker-compose.yml
├── Dockerfile
├── .dockerignore
├── README.md
├── docs/
│   └── plans/
│       ├── 2026-02-19-agenda-app-design.md
│       └── 2026-02-19-agenda-implementation-plan.md
├── backend/
│   ├── main.py              # FastAPI app
│   ├── models.py            # SQLAlchemy models
│   ├── database.py          # DB connection
│   ├── crud.py              # Database operations
│   ├── schemas.py           # Pydantic schemas
│   ├── requirements.txt
│   └── utils/
│       └── file_handler.py  # File upload/download
├── frontend/
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── src/
│   │   ├── main.jsx
│   │   ├── App.jsx
│   │   ├── api/
│   │   │   └── client.js    # API client
│   │   ├── components/
│   │   │   ├── AgendaView.jsx
│   │   │   ├── CalendarView.jsx
│   │   │   ├── ListView.jsx
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
└── data/                    # Created by Docker (volume mount)
    ├── agenda.db            # SQLite database
    └── uploads/             # Uploaded files
```

## Data Persistence

All data (SQLite database and uploaded files) is stored in the `./data` directory via Docker volume mount.

### Backup Data
```bash
cp -r ./data ./data-backup-$(date +%Y%m%d)
```

### Reset Data
```bash
# Warning: This deletes all tasks and files
rm -rf ./data
```

## API Documentation

When running, visit http://localhost:8080/docs for interactive API documentation (FastAPI auto-generated).

### Key Endpoints

- `GET /api/tasks?view=agenda|list|calendar` - Get filtered tasks
- `POST /api/tasks` - Create task
- `PUT /api/tasks/{id}` - Update task
- `DELETE /api/tasks/{id}` - Delete task
- `PUT /api/tasks/reorder` - Reorder tasks (drag-and-drop)
- `POST /api/tasks/{id}/attachments` - Upload files
- `GET /api/attachments/{id}/download` - Download file

## View Specifications

### Agenda View
- Shows tasks with no date OR due within current week (Mon-Sun)
- Manual drag-and-drop ordering
- Single-click to toggle completion (tasks sink to bottom)
- Double-click to edit
- Completed tasks stay visible at bottom until removed

### Calendar View
- **This Week**: 7-column grid showing current week
- **Monthly**: Full month calendar with task visualization
- Click task to edit
- "+ Add task" on each day pre-fills date
- Only shows tasks with dates

### List View
- Shows ALL tasks
- Sort order: "No Date" tasks first, then dated chronologically, completed at bottom
- Format: Row number, Title, Date (if any)
- Single-click to toggle completion
- Double-click to edit

## Design Philosophy

- **Visual Impressiveness**: Dark theme with purple accents, elegant typography, smooth animations
- **Single-User Focus**: Optimized for personal productivity, no authentication needed
- **Self-Contained**: Everything runs in one Docker container
- **Data Ownership**: Your data stays on your machine in SQLite + local filesystem

## Contributing

This is a personal productivity app. Feel free to fork and customize for your needs!

## License

MIT License

---

Built with ❤️ using React, FastAPI, and modern web technologies.
