import io
import uuid
import zipfile
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from typing import IO

from pdf2image import convert_from_bytes
from PIL import Image

from app.config import UPLOAD_DIR, JPG_QUALITY, PDF_DPI

_executor = ThreadPoolExecutor(max_workers=4)


class PdfService:
    @staticmethod
    def _page_to_jpg(image: Image.Image) -> bytes:
        buffer = io.BytesIO()
        image.save(buffer, format="JPEG", quality=JPG_QUALITY)
        return buffer.getvalue()

    def process_pdf(self, file_bytes: bytes, filename: str) -> tuple[str, int, str]:
        base_name = Path(filename).stem
        images = convert_from_bytes(file_bytes, dpi=200)
        total = len(images)
        jpg_bytes_list = list(_executor.map(self._page_to_jpg, images))

        zip_id = uuid.uuid4().hex
        zip_path = UPLOAD_DIR / f"{zip_id}.zip"
        with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zf:
            for i, jpg_data in enumerate(jpg_bytes_list, start=1):
                zf.writestr(f"{base_name}_page_{i}.jpg", jpg_data)

        return base_name, total, zip_id

    def merge_files(self, file_list: list[tuple[bytes, str]]) -> tuple[str, int]:
        images: list[Image.Image] = []
        for file_bytes, filename in file_list:
            suffix = Path(filename).suffix.lower()
            if suffix == ".pdf":
                pages = convert_from_bytes(file_bytes, dpi=PDF_DPI)
                images.extend(pages)
            else:
                img = Image.open(io.BytesIO(file_bytes))
                if img.mode != "RGB":
                    img = img.convert("RGB")
                images.append(img)

        total = len(images)
        a4_w = int(8.27 * PDF_DPI)
        a4_h = int(11.69 * PDF_DPI)

        a4_pages: list[Image.Image] = []
        for img in images:
            page = Image.new("RGB", (a4_w, a4_h), (255, 255, 255))
            img.thumbnail((a4_w, a4_h), Image.LANCZOS)
            x = (a4_w - img.width) // 2
            y = (a4_h - img.height) // 2
            page.paste(img, (x, y))
            a4_pages.append(page)

        file_id = uuid.uuid4().hex
        output_path = UPLOAD_DIR / f"{file_id}.pdf"
        a4_pages[0].save(
            output_path,
            save_all=True,
            append_images=a4_pages[1:],
            format="PDF",
            quality=JPG_QUALITY,
        )
        return file_id, total

    @staticmethod
    def get_zip_path(zip_id: str) -> Path:
        return UPLOAD_DIR / f"{zip_id}.zip"

    @staticmethod
    def get_pdf_path(file_id: str) -> Path:
        return UPLOAD_DIR / f"{file_id}.pdf"

    @staticmethod
    def get_zip_io(zip_id: str) -> IO[bytes]:
        path = UPLOAD_DIR / f"{zip_id}.zip"
        if not path.exists():
            raise FileNotFoundError(f"ZIP {zip_id} not found")
        return open(path, "rb")
