import asyncio
from pathlib import Path

from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from fastapi.responses import FileResponse, Response
from pydantic import BaseModel

from app.config import ALLOWED_EXTENSIONS, ALLOWED_MERGE_EXTENSIONS, MAX_FILE_SIZE, IMAGE_EXTENSIONS
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


@router.post("/extract", response_model=FileResult)
async def extract_pages(
    file: UploadFile = File(...),
    pages: str = Form(...),
    output: str = Form("zip"),
):
    try:
        _validate_file(file)
        contents = await file.read()
        if len(contents) > MAX_FILE_SIZE:
            raise HTTPException(status_code=413, detail=f"{file.filename} exceeds size limit")
        if output not in ("zip", "pdf"):
            raise HTTPException(status_code=400, detail="output debe ser 'zip' o 'pdf'.")

        base_name, count, out_id = await asyncio.to_thread(
            pdf_service.extract_pages, contents, file.filename or "untitled", pages, output
        )
        return FileResult(
            id=out_id,
            filename=file.filename or "untitled",
            page_count=count,
            status="completed",
        )
    except HTTPException:
        raise
    except Exception as exc:
        return FileResult(
            filename=file.filename or "untitled",
            status="error",
            error_detail=str(exc),
        )


@router.post("/watermark", response_model=FileResult)
async def add_watermark(
    file: UploadFile = File(...),
    text: str = Form(...),
    opacity: float = Form(0.3),
    position: str = Form("center"),
):
    try:
        _validate_file(file)
        contents = await file.read()
        if len(contents) > MAX_FILE_SIZE:
            raise HTTPException(status_code=413, detail=f"{file.filename} exceeds size limit")
        if position not in ("center", "top-left", "bottom-right"):
            raise HTTPException(status_code=400, detail="Posición inválida.")
        if not text.strip():
            raise HTTPException(status_code=400, detail="El texto no puede estar vacío.")

        base_name, total_pages, file_id = await asyncio.to_thread(
            pdf_service.add_watermark, contents, file.filename or "untitled", text, opacity, position
        )
        return FileResult(
            id=file_id,
            filename=file.filename or "untitled",
            page_count=total_pages,
            status="completed",
        )
    except HTTPException:
        raise
    except Exception as exc:
        return FileResult(
            filename=file.filename or "untitled",
            status="error",
            error_detail=str(exc),
        )


@router.post("/protect", response_model=FileResult)
async def protect_pdf(
    file: UploadFile = File(...),
    password: str = Form(...),
):
    try:
        _validate_file(file)
        contents = await file.read()
        if len(contents) > MAX_FILE_SIZE:
            raise HTTPException(status_code=413, detail=f"{file.filename} exceeds size limit")
        if len(password) < 4:
            raise HTTPException(status_code=400, detail="La contraseña debe tener al menos 4 caracteres.")

        base_name, total_pages, file_id = await asyncio.to_thread(
            pdf_service.protect_pdf, contents, file.filename or "untitled", password
        )
        return FileResult(
            id=file_id,
            filename=file.filename or "untitled",
            page_count=total_pages,
            status="completed",
        )
    except HTTPException:
        raise
    except Exception as exc:
        return FileResult(
            filename=file.filename or "untitled",
            status="error",
            error_detail=str(exc),
        )


@router.post("/unlock", response_model=FileResult)
async def unlock_pdf(
    file: UploadFile = File(...),
    password: str = Form(...),
):
    try:
        _validate_file(file)
        contents = await file.read()
        if len(contents) > MAX_FILE_SIZE:
            raise HTTPException(status_code=413, detail=f"{file.filename} exceeds size limit")

        base_name, total_pages, file_id = await asyncio.to_thread(
            pdf_service.unlock_pdf, contents, file.filename or "untitled", password
        )
        return FileResult(
            id=file_id,
            filename=file.filename or "untitled",
            page_count=total_pages,
            status="completed",
        )
    except HTTPException:
        raise
    except Exception as exc:
        return FileResult(
            filename=file.filename or "untitled",
            status="error",
            error_detail=str(exc),
        )


class PageOp(BaseModel):
    page: int
    rotate: int = 0


class OrganizeApplyRequest(BaseModel):
    file_id: str
    pages: list[PageOp]


@router.post("/organize/upload", response_model=FileResult)
async def organize_upload(file: UploadFile = File(...)):
    try:
        _validate_file(file)
        contents = await file.read()
        if len(contents) > MAX_FILE_SIZE:
            raise HTTPException(status_code=413, detail=f"{file.filename} exceeds size limit")

        file_id, total_pages = await asyncio.to_thread(
            pdf_service.organize_upload, contents, file.filename or "untitled"
        )
        return FileResult(
            id=file_id,
            filename=file.filename or "untitled",
            page_count=total_pages,
            status="completed",
        )
    except HTTPException:
        raise
    except Exception as exc:
        return FileResult(
            filename=file.filename or "untitled",
            status="error",
            error_detail=str(exc),
        )


@router.get("/organize/thumbnail/{file_id}/{page}")
async def organize_thumbnail(file_id: str, page: int):
    try:
        thumb_path = pdf_service.get_thumbnail_path(file_id, page)
        return FileResponse(
            path=thumb_path,
            media_type="image/jpeg",
        )
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/organize/apply", response_model=FileResult)
async def organize_apply(req: OrganizeApplyRequest):
    try:
        if not req.pages:
            raise HTTPException(status_code=400, detail="No se especificaron páginas.")
        file_id, total_pages = await asyncio.to_thread(
            pdf_service.apply_organization, req.file_id, [p.model_dump() for p in req.pages]
        )
        return FileResult(
            id=file_id,
            filename="organizado.pdf",
            page_count=total_pages,
            status="completed",
        )
    except HTTPException:
        raise
    except Exception as exc:
        return FileResult(
            filename="organizado.pdf",
            status="error",
            error_detail=str(exc),
        )


@router.delete("/organize/cleanup/{file_id}", status_code=204)
async def organize_cleanup(file_id: str):
    await asyncio.to_thread(pdf_service.cleanup_organize, file_id)
    return Response(status_code=204)

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
async def download_pdf(file_id: str, name: str = "documento.pdf"):
    pdf_path = pdf_service.get_pdf_path(file_id)
    if not pdf_path.exists():
        raise HTTPException(status_code=404, detail="PDF not found")
    return FileResponse(
        path=pdf_path,
        media_type="application/pdf",
        filename=name,
    )


@router.post("/compress", response_model=FileResult)
async def compress_pdf(
    file: UploadFile = File(...),
    quality: int = Form(60),
    reduce_dpi: bool = Form(True),
):
    try:
        _validate_file(file)
        contents = await file.read()
        if len(contents) > MAX_FILE_SIZE:
            raise HTTPException(status_code=413, detail=f"{file.filename} exceeds size limit")

        base_name, total_pages, file_id = await asyncio.to_thread(
            pdf_service.compress_pdf, contents, file.filename or "untitled", quality, reduce_dpi
        )
        return FileResult(
            id=file_id,
            filename=file.filename or "untitled",
            page_count=total_pages,
            status="completed",
        )
    except HTTPException:
        raise
    except Exception as exc:
        return FileResult(
            filename=file.filename or "untitled",
            status="error",
            error_detail=str(exc),
        )


@router.post("/split", response_model=FileResult)
async def split_pdf(
    file: UploadFile = File(...),
    mode: str = Form("all"),
    every_n: int | None = Form(None),
    ranges: str | None = Form(None),
):
    try:
        _validate_file(file)
        contents = await file.read()
        if len(contents) > MAX_FILE_SIZE:
            raise HTTPException(status_code=413, detail=f"{file.filename} exceeds size limit")

        base_name, total_pages, zip_id = await asyncio.to_thread(
            pdf_service.split_pdf, contents, file.filename or "untitled", mode, every_n, ranges
        )
        return FileResult(
            id=zip_id,
            filename=file.filename or "untitled",
            page_count=total_pages,
            status="completed",
        )
    except HTTPException:
        raise
    except Exception as exc:
        return FileResult(
            filename=file.filename or "untitled",
            status="error",
            error_detail=str(exc),
        )
