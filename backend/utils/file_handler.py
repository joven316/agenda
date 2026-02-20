import os
import uuid
import aiofiles
from pathlib import Path
from fastapi import UploadFile
from typing import Tuple


UPLOAD_DIR = os.getenv("UPLOAD_DIR", "/app/data/uploads")
TEMP_DIR = os.path.join(UPLOAD_DIR, "temp")


def ensure_upload_dirs():
    """Create upload directories if they don't exist"""
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    os.makedirs(TEMP_DIR, exist_ok=True)


def get_task_upload_dir(task_id: int) -> str:
    """Get upload directory for a specific task"""
    task_dir = os.path.join(UPLOAD_DIR, str(task_id))
    os.makedirs(task_dir, exist_ok=True)
    return task_dir


def generate_unique_filename(original_filename: str) -> str:
    """Generate unique filename: {uuid}_{original_filename}"""
    unique_id = uuid.uuid4().hex[:12]
    return f"{unique_id}_{original_filename}"


async def save_upload_file(
    upload_file: UploadFile,
    directory: str
) -> Tuple[str, int]:
    """
    Save uploaded file to directory
    Returns: (stored_path, file_size)
    """
    unique_filename = generate_unique_filename(upload_file.filename)
    file_path = os.path.join(directory, unique_filename)

    file_size = 0
    async with aiofiles.open(file_path, 'wb') as f:
        while chunk := await upload_file.read(8192):  # 8KB chunks
            await f.write(chunk)
            file_size += len(chunk)

    return file_path, file_size


async def delete_file(file_path: str) -> bool:
    """Delete a file from disk"""
    try:
        if os.path.exists(file_path):
            os.remove(file_path)
            return True
    except Exception:
        pass
    return False


def cleanup_temp_files():
    """Clean up orphaned temp files (called on startup)"""
    if os.path.exists(TEMP_DIR):
        for file in os.listdir(TEMP_DIR):
            file_path = os.path.join(TEMP_DIR, file)
            try:
                if os.path.isfile(file_path):
                    os.remove(file_path)
            except Exception:
                pass
