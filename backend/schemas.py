from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import date, datetime


# Attachment Schemas
class AttachmentBase(BaseModel):
    filename: str


class AttachmentCreate(AttachmentBase):
    task_id: int
    stored_path: str
    file_size: int


class Attachment(AttachmentBase):
    id: int
    task_id: int
    file_size: int
    uploaded_at: datetime

    class Config:
        from_attributes = True


# Task Schemas
class TaskBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=500)
    notes: Optional[str] = None
    due_date: Optional[date] = None
    completed: bool = False
    is_note: bool = False


class TaskCreate(TaskBase):
    pass


class TaskUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=500)
    notes: Optional[str] = None
    due_date: Optional[date] = None
    completed: Optional[bool] = None
    is_note: Optional[bool] = None


class Task(TaskBase):
    id: int
    sort_order: int
    created_at: datetime
    updated_at: Optional[datetime]
    attachments: List[Attachment] = []

    class Config:
        from_attributes = True


# Bulk Reorder Schema
class TaskReorderItem(BaseModel):
    id: int
    sort_order: int


class TaskReorder(BaseModel):
    tasks: List[TaskReorderItem]
