VENV := $(PWD)/.venv/bin

.PHONY: install backend frontend dev clean

install:
	$(VENV)/pip install -r backend/requirements.txt
	cd frontend && npm install

backend:
	cd backend && $(VENV)/uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

frontend:
	cd frontend && npm run dev

dev:
	@echo "Starting backend (port 8000) and frontend (port 5173)..."
	@fuser -k 8000/tcp 2>/dev/null; fuser -k 5173/tcp 2>/dev/null; true
	cd backend && $(VENV)/uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 &
	cd frontend && npx vite --host &
	@echo "Backend  → http://localhost:8000"
	@echo "Frontend → http://localhost:5173"
	@echo "Press Ctrl+C to stop both"
	@trap 'kill 0; exit' INT; wait

clean:
	fuser -k 8000/tcp 2>/dev/null; fuser -k 5173/tcp 2>/dev/null; true
	rm -rf backend/uploads frontend/dist
