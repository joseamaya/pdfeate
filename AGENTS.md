# AGENTS.md — PDFeate

FastAPI backend + React/Vite frontend. Upload PDFs, get a ZIP of JPGs (one per page).

## Run

```bash
make dev          # starts backend :8000 + frontend :5173 simultaneously
make backend      # backend only
make frontend     # frontend only
make clean        # kill servers, rm uploads/ and dist/
```

## Architectura quirks

- **Virtual env**: use `.venv/bin/python` / `.venv/bin/pip`. System Python is externally managed.
- **Backend must run from `backend/` directory** — `uvicorn app.main:app` won't find the `app` module from root. The Makefile handles this with `cd backend && uvicorn ...`.
- **pdf2image depends on system `poppler-utils`** (installed on this host). Not a pip package. Without it, `convert_from_bytes` raises.
- **`process_pdf` is synchronous** — the router offloads it with `asyncio.to_thread()` to avoid blocking the event loop.
- **ZIP files persist forever** in `backend/uploads/`. No automatic cleanup. `make clean` removes them.
- **Frontend Vite dev server** proxys `/api` → `http://localhost:8000` (see `vite.config.ts`).

## Key backend modules

| File | Role |
|---|---|
| `backend/app/main.py` | FastAPI app, CORS (`*`), lifespan |
| `backend/app/config.py` | `UPLOAD_DIR`, `MAX_FILE_SIZE` (50MB), `JPG_QUALITY` (90) |
| `backend/app/routers/pdf_router.py` | `POST /api/upload`, `GET /api/download/{zip_id}` |
| `backend/app/services/pdf_service.py` | `pdf2image` → per-page JPG → ZIP |

## Frontend

```bash
cd frontend
npm run dev        # dev server
npm run build      # tsc + vite build
npx tsc --noEmit   # type-check only (fast)
npm run lint       # eslint
```

No test suite, no CI, no `pyproject.toml`. Python deps in `backend/requirements.txt`.
