import io
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_upload_no_files(client: AsyncClient):
    """POST /api/upload with no files should return 422."""
    response = await client.post("/api/upload")
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_upload_invalid_extension(client: AsyncClient):
    """POST /api/upload with a .txt file should return 400."""
    files = {"files": ("test.txt", io.BytesIO(b"hello"), "text/plain")}
    response = await client.post("/api/upload", files=files)
    assert response.status_code == 400


@pytest.mark.asyncio
async def test_download_nonexistent_zip(client: AsyncClient):
    """GET /api/download/{zip_id} for a nonexistent ID should return 404."""
    response = await client.get("/api/download/nonexistent")
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_merge_no_files(client: AsyncClient):
    """POST /api/merge with no files should return 422."""
    response = await client.post("/api/merge")
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_split_no_file(client: AsyncClient):
    """POST /api/split with no file should return 422."""
    response = await client.post("/api/split")
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_compress_no_file(client: AsyncClient):
    """POST /api/compress with no file should return 422."""
    response = await client.post("/api/compress")
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_protect_no_file(client: AsyncClient):
    """POST /api/protect with no file should return 422."""
    response = await client.post("/api/protect")
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_unlock_no_file(client: AsyncClient):
    """POST /api/unlock with no file should return 422."""
    response = await client.post("/api/unlock")
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_extract_no_file(client: AsyncClient):
    """POST /api/extract with no file should return 422."""
    response = await client.post("/api/extract")
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_watermark_no_file(client: AsyncClient):
    """POST /api/watermark with no file should return 422."""
    response = await client.post("/api/watermark")
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_organize_upload_no_file(client: AsyncClient):
    """POST /api/organize/upload with no file should return 422."""
    response = await client.post("/api/organize/upload")
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_organize_thumbnail_nonexistent(client: AsyncClient):
    """GET /api/organize/thumbnail for nonexistent file should return 404."""
    response = await client.get("/api/organize/thumbnail/nonexistent/1")
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_download_pdf_nonexistent(client: AsyncClient):
    """GET /api/download-pdf for nonexistent ID should return 404."""
    response = await client.get("/api/download-pdf/nonexistent")
    assert response.status_code == 404
