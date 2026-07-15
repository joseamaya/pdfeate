# PDFeate

Browser-based PDF manipulation platform. Inspired by iLovePDF.

## Features

| Feature | Description |
|---|---|
| **Merge PDFs** | Combine multiple PDFs and images into a single PDF |
| **Split PDF** | Split by page, every N pages, or custom ranges |
| **Organize pages** | Reorder, rotate, and delete pages with drag & drop |
| **Extract pages** | Extract specific pages as ZIP (individual files) or single PDF |
| **Compress PDF** | Reduce file size (Ghostscript or Pillow fallback) |
| **Watermark** | Overlay configurable text (opacity, position) |
| **Protect PDF** | Add password encryption |
| **Unlock PDF** | Remove password protection |
| **PDF → JPG** | Convert each page to JPG and download as ZIP |

## Stack

- **Backend:** Python 3.12+, FastAPI, Uvicorn
- **Frontend:** React 19, TypeScript 6, Vite 8
- **Key libraries:**
  - `pypdf` — PDF read/write (split, extract, protect, unlock, organize)
  - `pdf2image` + `Pillow` — PDF ↔ image conversion, watermark, compression
  - `Ghostscript` — professional PDF compression
  - `@dnd-kit` — drag & drop for page organization

## System requirements

- Python 3.12+
- Node.js 22+
- `poppler-utils` (required by pdf2image)
- `ghostscript` (recommended for compression)

### Install system dependencies (Debian/Ubuntu)

```bash
sudo apt install poppler-utils ghostscript
```

## Setup & run

```bash
git clone <repo-url> && cd pdfeate

make install      # install Python + Node dependencies
make dev          # start backend (:8000) and frontend (:5173)
```

Open http://localhost:5173

## Available commands

```bash
make install    # Install Python + Node dependencies
make dev        # Start backend and frontend simultaneously
make backend    # Backend only (port 8000)
make frontend   # Frontend only (port 5173)
make clean      # Kill servers and remove temporary files
```

## API

All routes are under `/api`.

| Method | Route | Description |
|---|---|---|
| `POST` | `/api/upload` | Upload PDF(s) → ZIP of JPGs |
| `GET` | `/api/download/{zip_id}` | Download ZIP |
| `POST` | `/api/merge` | Merge PDFs + images → single PDF |
| `POST` | `/api/split` | Split PDF (modes: all/every/ranges) |
| `POST` | `/api/extract` | Extract specific pages |
| `POST` | `/api/compress` | Compress PDF (quality, reduce_dpi) |
| `POST` | `/api/watermark` | Add watermark text |
| `POST` | `/api/protect` | Encrypt with password |
| `POST` | `/api/unlock` | Remove password protection |
| `POST` | `/api/organize/upload` | Upload PDF for page editing |
| `GET` | `/api/organize/thumbnail/{id}/{page}` | Page thumbnail |
| `POST` | `/api/organize/apply` | Apply page changes |
| `DELETE` | `/api/organize/cleanup/{id}` | Clean up temporary files |
| `GET` | `/api/download-pdf/{file_id}` | Download PDF |

## Project structure

```
pdfeate/
├── backend/
│   ├── app/
│   │   ├── config.py          # Limits, paths, quality settings
│   │   ├── main.py            # FastAPI app + CORS + lifespan
│   │   ├── routers/
│   │   │   └── pdf_router.py  # All endpoints
│   │   └── services/
│   │       └── pdf_service.py # Business logic (PDF → PDF)
│   ├── uploads/               # Generated ZIPs and PDFs
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── api/client.ts      # HTTP client
│   │   ├── components/        # React components (one per feature)
│   │   ├── App.tsx            # Main page
│   │   └── App.css            # Styles
│   └── package.json
├── Makefile
└── README.md
```

## Notes

- The backend must run from the `backend/` directory (handled by the Makefile).
- Generated ZIP and PDF files persist in `backend/uploads/` until `make clean`.
- No authentication, no database, no tests.
