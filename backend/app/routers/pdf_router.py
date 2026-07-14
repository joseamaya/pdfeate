import asyncio
from pathlib import Path

from fastapi import APIRouter, File, HTTPException, UploadFile
from fastapi.responses import FileResponse
from pydantic import BaseModel

from app.config import ALLOWED_EXTENSIONS, ALLOWED_MERGE_EXTENSIONS, MAX_FILE_SIZE
from app.services.pdf_service import PdfService

router = APIRouter(prefix="/api", tags=["pdf"])
pdf_service = PdfService()


class FileResult(BaseModel):
    id: str | None = None
    filename: str
    page_count: int = 0
    status: str
    error_detail: str | None = None


def _validate_file(file: UploadFile) -> None:
    suffix = Path(file.filename or "").suffix.lower()
    if suffix not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type: {suffix}. Only PDF allowed.",
        )


def _validate_merge_file(file: UploadFile) -> None:
    suffix = Path(file.filename or "").suffix.lower()
    if suffix not in ALLOWED_MERGE_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type: {suffix}. Only PDF and image files allowed.",
        )


@router.post("/upload", response_model=list[FileResult])
async def upload_pdfs(files: list[UploadFile] = File(...)):
    results: list[FileResult] = []
    for file in files:
        try:
            _validate_file(file)
            contents = await file.read()
            if len(contents) > MAX_FILE_SIZE:
                raise HTTPException(status_code=413, detail=f"{file.filename} exceeds size limit")

            base_name, page_count, zip_id = await asyncio.to_thread(
                pdf_service.process_pdf, contents, file.filename or "untitled"
            )
            results.append(
                FileResult(
                    id=zip_id,
                    filename=file.filename or "untitled",
                    page_count=page_count,
                    status="completed",
                )
            )
        except HTTPException:
            raise
        except Exception as exc:
            results.append(
                FileResult(
                    filename=file.filename or "untitled",
                    status="error",
                    error_detail=str(exc),
                )
            )
    return results


@router.get("/download/{zip_id}")
async def download_zip(zip_id: str):
    zip_path = pdf_service.get_zip_path(zip_id)
    if not zip_path.exists():
        raise HTTPException(status_code=404, detail="ZIP not found")
    return FileResponse(
        path=zip_path,
        media_type="application/zip",
        filename=f"{zip_id}.zip",
    )


@router.post("/merge", response_model=FileResult)
async def merge_files(files: list[UploadFile] = File(...)):
    file_data: list[tuple[bytes, str]] = []
    filenames: list[str] = []
    for file in files:
        try:
            _validate_merge_file(file)
            contents = await file.read()
            if len(contents) > MAX_FILE_SIZE:
                raise HTTPException(status_code=413, detail=f"{file.filename} exceeds size limit")
            file_data.append((contents, file.filename or "untitled"))
            filenames.append(file.filename or "untitled")
        except HTTPException:
            raise
        except Exception as exc:
            return FileResult(
                filename=file.filename or "untitled",
                status="error",
                error_detail=str(exc),
            )

    try:
        file_id, total_pages = await asyncio.to_thread(
            pdf_service.merge_files, file_data
        )
        return FileResult(
            id=file_id,
            filename="merged_output.pdf",
            page_count=total_pages,
            status="completed",
        )
    except Exception as exc:
        return FileResult(
            filename="merged_output.pdf",
            status="error",
            error_detail=str(exc),
        )


@router.get("/download-pdf/{file_id}")
async def download_pdf(file_id: str):
    pdf_path = pdf_service.get_pdf_path(file_id)
    if not pdf_path.exists():
        raise HTTPException(status_code=404, detail="PDF not found")
    return FileResponse(
        path=pdf_path,
        media_type="application/pdf",
        filename="merged_output.pdf",
    )
