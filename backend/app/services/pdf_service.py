import io
import os
import subprocess
import uuid
import zipfile
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from typing import IO

from pdf2image import convert_from_bytes
from PIL import Image
from pypdf import PdfReader, PdfWriter

from app.config import (
    UPLOAD_DIR,
    JPG_QUALITY,
    PDF_DPI,
    SPLIT_MAX_PAGES,
    COMPRESS_QUALITY,
    COMPRESS_DPI,
    THUMBNAIL_SIZE,
    THUMBNAIL_QUALITY,
    ORGANIZE_MAX_PAGES,
)

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
    def _parse_ranges(ranges_str: str, total_pages: int) -> list[list[int]]:
        groups: list[list[int]] = []
        seen: set[int] = set()
        for part in ranges_str.split(","):
            part = part.strip()
            if not part:
                continue
            if "-" in part:
                start_str, end_str = part.split("-", 1)
                start = int(start_str.strip())
                end = int(end_str.strip())
            else:
                start = end = int(part)
            if start < 1 or end > total_pages or start > end:
                raise ValueError(
                    f"Rango inválido: {part}. El PDF tiene {total_pages} páginas (1-{total_pages})."
                )
            page_nums = list(range(start, end + 1))
            if any(p in seen for p in page_nums):
                raise ValueError(f"Rango {part} se solapa con otro rango.")
            seen.update(page_nums)
            groups.append(page_nums)
        if not groups:
            raise ValueError("No se especificaron rangos válidos.")
        return groups

    @staticmethod
    def _compute_page_groups(
        total_pages: int, mode: str, every_n: int | None = None, ranges: str | None = None
    ) -> list[list[int]]:
        if mode == "all":
            return [[i] for i in range(1, total_pages + 1)]
        if mode == "every":
            n = every_n or 1
            return [list(range(i, min(i + n, total_pages + 1))) for i in range(1, total_pages + 1, n)]
        if mode == "ranges":
            if not ranges:
                raise ValueError("El modo 'ranges' requiere el parámetro 'ranges'.")
            return PdfService._parse_ranges(ranges, total_pages)
        raise ValueError(f"Modo de división desconocido: {mode}")

    def split_pdf(
        self,
        file_bytes: bytes,
        filename: str,
        mode: str,
        every_n: int | None = None,
        ranges: str | None = None,
    ) -> tuple[str, int, str]:
        base_name = Path(filename).stem
        reader = PdfReader(io.BytesIO(file_bytes))
        total_pages = len(reader.pages)
        if total_pages == 0:
            raise ValueError("El PDF no contiene páginas.")
        if total_pages > SPLIT_MAX_PAGES:
            raise ValueError(
                f"El PDF tiene {total_pages} páginas. "
                f"El límite máximo es {SPLIT_MAX_PAGES}."
            )
        groups = self._compute_page_groups(total_pages, mode, every_n, ranges)
        zip_id = uuid.uuid4().hex
        zip_path = UPLOAD_DIR / f"{zip_id}.zip"
        with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zf:
            for idx, page_nums in enumerate(groups, start=1):
                writer = PdfWriter()
                for pn in page_nums:
                    writer.add_page(reader.pages[pn - 1])
                buf = io.BytesIO()
                writer.write(buf)
                buf.seek(0)
                if len(groups) == 1:
                    zf.writestr(f"{base_name}.pdf", buf.read())
                else:
                    zf.writestr(f"{base_name}_parte_{idx}.pdf", buf.read())
        return base_name, total_pages, zip_id

    def compress_pdf(
        self, file_bytes: bytes, filename: str, quality: int = COMPRESS_QUALITY, reduce_dpi: bool = True
    ) -> tuple[str, int, str]:
        base_name = Path(filename).stem
        file_id = uuid.uuid4().hex
        output_path = UPLOAD_DIR / f"{file_id}.pdf"

        try:
            subprocess.run(["gs", "--version"], capture_output=True, check=True)
            self._compress_with_gs(file_bytes, output_path, quality)
            total_pages = len(PdfReader(io.BytesIO(file_bytes)).pages)
        except (FileNotFoundError, subprocess.CalledProcessError):
            total_pages = self._compress_with_pillow(file_bytes, output_path, quality, reduce_dpi)

        return base_name, total_pages, file_id

    @staticmethod
    def _compress_with_gs(file_bytes: bytes, output_path: Path, quality: int) -> None:
        if quality >= 80:
            pdf_settings = "/printer"
        elif quality >= 40:
            pdf_settings = "/ebook"
        else:
            pdf_settings = "/screen"

        subprocess.run(
            [
                "gs",
                "-sDEVICE=pdfwrite",
                "-dCompatibilityLevel=1.4",
                f"-dPDFSETTINGS={pdf_settings}",
                "-dNOPAUSE",
                "-dQUIET",
                "-dBATCH",
                "-dNumRenderingThreads=4",
                f"-sOutputFile={output_path}",
                "-",
            ],
            input=file_bytes,
            capture_output=True,
            check=True,
        )

    @staticmethod
    def _compress_with_pillow(file_bytes: bytes, output_path: Path, quality: int, reduce_dpi: bool) -> int:
        dpi = COMPRESS_DPI if reduce_dpi else PDF_DPI
        images = convert_from_bytes(file_bytes, dpi=dpi)
        total = len(images)
        images[0].save(
            output_path,
            save_all=True,
            append_images=images[1:],
            format="PDF",
            quality=quality,
        )
        return total

    def organize_upload(self, file_bytes: bytes, filename: str) -> tuple[str, int]:
        file_id = uuid.uuid4().hex
        pdf_path = UPLOAD_DIR / f"{file_id}.pdf"
        pdf_path.write_bytes(file_bytes)

        reader = PdfReader(io.BytesIO(file_bytes))
        total_pages = len(reader.pages)
        if total_pages == 0:
            raise ValueError("El PDF no contiene páginas.")
        if total_pages > ORGANIZE_MAX_PAGES:
            raise ValueError(
                f"El PDF tiene {total_pages} páginas. "
                f"El límite máximo es {ORGANIZE_MAX_PAGES}."
            )

        images = convert_from_bytes(file_bytes, dpi=72)
        for i, img in enumerate(images, start=1):
            thumb = img.copy()
            thumb.thumbnail((THUMBNAIL_SIZE, int(THUMBNAIL_SIZE * 1.4)))
            thumb_path = UPLOAD_DIR / f"{file_id}_thumb_{i}.jpg"
            thumb.save(thumb_path, "JPEG", quality=THUMBNAIL_QUALITY)
        return file_id, total_pages

    @staticmethod
    def get_thumbnail_path(file_id: str, page: int) -> Path:
        thumb_path = UPLOAD_DIR / f"{file_id}_thumb_{page}.jpg"
        if not thumb_path.exists():
            pdf_path = UPLOAD_DIR / f"{file_id}.pdf"
            if not pdf_path.exists():
                raise FileNotFoundError(f"PDF {file_id} not found")
            pdf_bytes = pdf_path.read_bytes()
            images = convert_from_bytes(pdf_bytes, dpi=72, first_page=page, last_page=page)
            if not images:
                raise ValueError(f"Página {page} no encontrada")
            thumb = images[0]
            thumb.thumbnail((THUMBNAIL_SIZE, int(THUMBNAIL_SIZE * 1.4)))
            thumb.save(thumb_path, "JPEG", quality=THUMBNAIL_QUALITY)
        return thumb_path

    def apply_organization(self, file_id: str, page_ops: list[dict]) -> tuple[str, int]:
        pdf_path = UPLOAD_DIR / f"{file_id}.pdf"
        if not pdf_path.exists():
            raise FileNotFoundError(f"PDF {file_id} no encontrado")

        reader = PdfReader(pdf_path)
        writer = PdfWriter()
        for op in page_ops:
            orig = op["page"]
            rotate = op.get("rotate", 0)
            if orig < 1 or orig > len(reader.pages):
                raise ValueError(
                    f"Número de página {orig} fuera de rango (1-{len(reader.pages)})"
                )
            page = reader.pages[orig - 1]
            if rotate:
                page.rotate(rotate)
            writer.add_page(page)

        output_id = uuid.uuid4().hex
        output_path = UPLOAD_DIR / f"{output_id}.pdf"
        writer.write(output_path)
        return output_id, len(page_ops)

    @staticmethod
    def cleanup_organize(file_id: str) -> None:
        pdf_path = UPLOAD_DIR / f"{file_id}.pdf"
        if pdf_path.exists():
            pdf_path.unlink()
        for p in UPLOAD_DIR.glob(f"{file_id}_thumb_*.jpg"):
            p.unlink()

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
