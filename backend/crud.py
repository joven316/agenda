from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from datetime import date, timedelta
import models
import schemas
from typing import List, Optional


def get_week_start(today: date) -> date:
    """Get Monday of the current week"""
    return today - timedelta(days=today.weekday())


def get_week_end(week_start: date) -> date:
    """Get Sunday of the current week"""
    return week_start + timedelta(days=6)


def get_tasks(
    db: Session,
    view: str = "agenda",
    filter_date: Optional[date] = None
) -> List[models.Task]:
    """
    Get tasks filtered by view type
    - agenda: no date OR due in current week
    - list: all tasks
    - calendar: has date (frontend filters further)
    """
    query = db.query(models.Task)

    if view == "agenda":
        today = filter_date or date.today()
        week_start = get_week_start(today)
        week_end = get_week_end(week_start)

        query = query.filter(
            or_(
                models.Task.due_date.is_(None),
                and_(
                    models.Task.due_date >= week_start,
                    models.Task.due_date <= week_end
                )
            )
        )
        # Sort: active tasks by sort_order, completed at bottom
        query = query.order_by(
            models.Task.completed.asc(),
            models.Task.sort_order.asc()
        )

    elif view == "list":
        # All tasks, sorted by completion status, then date/creation
        query = query.order_by(
            models.Task.completed.asc(),
            models.Task.due_date.asc().nullsfirst(),
            models.Task.created_at.asc()
        )

    elif view == "calendar":
        # Only tasks with dates
        query = query.filter(models.Task.due_date.isnot(None))
        query = query.order_by(models.Task.due_date.asc())

    return query.all()


def get_task(db: Session, task_id: int) -> Optional[models.Task]:
    """Get a single task by ID"""
    return db.query(models.Task).filter(models.Task.id == task_id).first()


def create_task(db: Session, task: schemas.TaskCreate) -> models.Task:
    """Create a new task with auto-generated sort_order"""
    # Get max sort_order and increment
    max_sort = db.query(models.Task.sort_order).order_by(
        models.Task.sort_order.desc()
    ).first()
    next_sort = (max_sort[0] + 1) if max_sort else 0

    db_task = models.Task(
        **task.model_dump(),
        sort_order=next_sort
    )
    db.add(db_task)
    db.commit()
    db.refresh(db_task)
    return db_task


def update_task(
    db: Session,
    task_id: int,
    task_update: schemas.TaskUpdate
) -> Optional[models.Task]:
    """Update a task"""
    db_task = get_task(db, task_id)
    if not db_task:
        return None

    update_data = task_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_task, field, value)

    db.commit()
    db.refresh(db_task)
    return db_task


def delete_task(db: Session, task_id: int) -> bool:
    """Delete a task (attachments cascade)"""
    db_task = get_task(db, task_id)
    if not db_task:
        return False

    db.delete(db_task)
    db.commit()
    return True


def reorder_tasks(db: Session, reorder_data: schemas.TaskReorder) -> bool:
    """Bulk update sort_order for tasks"""
    for item in reorder_data.tasks:
        db_task = get_task(db, item.id)
        if db_task:
            db_task.sort_order = item.sort_order

    db.commit()
    return True


def get_attachments(db: Session, task_id: int) -> List[models.Attachment]:
    """Get all attachments for a task"""
    return db.query(models.Attachment).filter(
        models.Attachment.task_id == task_id
    ).all()


def get_attachment(db: Session, attachment_id: int) -> Optional[models.Attachment]:
    """Get a single attachment by ID"""
    return db.query(models.Attachment).filter(
        models.Attachment.id == attachment_id
    ).first()


def create_attachment(
    db: Session,
    attachment: schemas.AttachmentCreate
) -> models.Attachment:
    """Create an attachment record"""
    db_attachment = models.Attachment(**attachment.model_dump())
    db.add(db_attachment)
    db.commit()
    db.refresh(db_attachment)
    return db_attachment


def delete_attachment(db: Session, attachment_id: int) -> Optional[models.Attachment]:
    """Delete an attachment (returns attachment for file cleanup)"""
    db_attachment = get_attachment(db, attachment_id)
    if not db_attachment:
        return None

    db.delete(db_attachment)
    db.commit()
    return db_attachment
