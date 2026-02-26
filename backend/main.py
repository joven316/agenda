from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Query
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date
import os

import models
import schemas
import crud
from database import engine, get_db, init_db
from utils.file_handler import (
    ensure_upload_dirs,
    cleanup_temp_files,
    save_upload_file,
    delete_file,
    get_task_upload_dir,
    TEMP_DIR
)

# Create tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Agenda Task Manager")


@app.on_event("startup")
async def startup_event():
    """Initialize database and cleanup temp files on startup"""
    init_db()
    ensure_upload_dirs()
    cleanup_temp_files()


# Task Endpoints
@app.get("/api/tasks", response_model=List[schemas.Task])
def read_tasks(
    view: str = Query("agenda", regex="^(agenda|list|calendar|notes)$"),
    date_filter: Optional[date] = None,
    db: Session = Depends(get_db)
):
    """Get tasks filtered by view"""
    return crud.get_tasks(db, view=view, filter_date=date_filter)


@app.get("/api/tasks/{task_id}", response_model=schemas.Task)
def read_task(task_id: int, db: Session = Depends(get_db)):
    """Get a single task"""
    task = crud.get_task(db, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task


@app.post("/api/tasks", response_model=schemas.Task, status_code=201)
def create_task(task: schemas.TaskCreate, db: Session = Depends(get_db)):
    """Create a new task"""
    return crud.create_task(db, task)


@app.put("/api/tasks/reorder", status_code=200)
def reorder_tasks(reorder: schemas.TaskReorder, db: Session = Depends(get_db)):
    """Bulk update sort_order for drag-and-drop"""
    crud.reorder_tasks(db, reorder)
    return {"message": "Tasks reordered successfully"}


@app.put("/api/tasks/{task_id}", response_model=schemas.Task)
def update_task(
    task_id: int,
    task_update: schemas.TaskUpdate,
    db: Session = Depends(get_db)
):
    """Update a task"""
    updated_task = crud.update_task(db, task_id, task_update)
    if not updated_task:
        raise HTTPException(status_code=404, detail="Task not found")
    return updated_task


@app.delete("/api/tasks/{task_id}", status_code=204)
async def delete_task(task_id: int, db: Session = Depends(get_db)):
    """Delete a task and its attachments"""
    # Get attachments for file cleanup
    attachments = crud.get_attachments(db, task_id)

    # Delete task (cascade deletes DB records)
    success = crud.delete_task(db, task_id)
    if not success:
        raise HTTPException(status_code=404, detail="Task not found")

    # Clean up files
    for attachment in attachments:
        await delete_file(attachment.stored_path)


# Attachment Endpoints
@app.get("/api/tasks/{task_id}/attachments", response_model=List[schemas.Attachment])
def read_task_attachments(task_id: int, db: Session = Depends(get_db)):
    """Get all attachments for a task"""
    task = crud.get_task(db, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return crud.get_attachments(db, task_id)


@app.post("/api/tasks/{task_id}/attachments", response_model=List[schemas.Attachment])
async def upload_attachments(
    task_id: int,
    files: List[UploadFile] = File(...),
    db: Session = Depends(get_db)
):
    """Upload one or more files for a task"""
    task = crud.get_task(db, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    task_dir = get_task_upload_dir(task_id)
    created_attachments = []

    for file in files:
        # Save file
        stored_path, file_size = await save_upload_file(file, task_dir)

        # Create DB record
        attachment_data = schemas.AttachmentCreate(
            task_id=task_id,
            filename=file.filename,
            stored_path=stored_path,
            file_size=file_size
        )
        attachment = crud.create_attachment(db, attachment_data)
        created_attachments.append(attachment)

    return created_attachments


@app.get("/api/attachments/{attachment_id}/download")
async def download_attachment(attachment_id: int, db: Session = Depends(get_db)):
    """Download/serve an attachment"""
    attachment = crud.get_attachment(db, attachment_id)
    if not attachment:
        raise HTTPException(status_code=404, detail="Attachment not found")

    if not os.path.exists(attachment.stored_path):
        raise HTTPException(status_code=404, detail="File not found on disk")

    return FileResponse(
        attachment.stored_path,
        filename=attachment.filename,
        media_type="application/octet-stream"
    )


@app.delete("/api/attachments/{attachment_id}", status_code=204)
async def delete_attachment(attachment_id: int, db: Session = Depends(get_db)):
    """Delete an attachment"""
    attachment = crud.delete_attachment(db, attachment_id)
    if not attachment:
        raise HTTPException(status_code=404, detail="Attachment not found")

    # Delete file from disk
    await delete_file(attachment.stored_path)


# Serve static frontend (in production)
if os.path.exists("static"):
    app.mount("/", StaticFiles(directory="static", html=True), name="static")
