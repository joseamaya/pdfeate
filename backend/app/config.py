from pathlib import Path

UPLOAD_DIR = Path(__file__).resolve().parent.parent / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)

MAX_FILE_SIZE = 50 * 1024 * 1024
ALLOWED_EXTENSIONS = {".pdf"}
IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp", ".tiff"}
ALLOWED_MERGE_EXTENSIONS = {".pdf"} | IMAGE_EXTENSIONS
JPG_QUALITY = 90
PDF_DPI = 200
SPLIT_MAX_PAGES = 200
COMPRESS_QUALITY = 60
COMPRESS_DPI = 150
