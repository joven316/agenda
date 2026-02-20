from sqlalchemy import Column, Integer, String, Text, Date, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base


class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(500), nullable=False)
    notes = Column(Text, nullable=True)
    due_date = Column(Date, nullable=True)  # null = "No Date"
    completed = Column(Boolean, default=False, nullable=False)
    sort_order = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationship
    attachments = relationship("Attachment", back_populates="task", cascade="all, delete-orphan")


class Attachment(Base):
    __tablename__ = "attachments"

    id = Column(Integer, primary_key=True, index=True)
    task_id = Column(Integer, ForeignKey("tasks.id", ondelete="CASCADE"), nullable=False)
    filename = Column(String(255), nullable=False)  # Original filename
    stored_path = Column(String(500), nullable=False)  # Path on disk
    file_size = Column(Integer, nullable=False)  # bytes
    uploaded_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationship
    task = relationship("Task", back_populates="attachments")
