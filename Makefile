.PHONY: up down restart build logs-backend logs-frontend docker-up docker-down kill start-apps

# Start all services (Docker + Apps)
up: docker-up start-apps

# Alias for up
start: up

# Create logs directory and start apps in background
start-apps:
	@mkdir -p logs
	@echo "Starting backend in background..."
	@cd backend && nohup uv run uvicorn main:app --host 0.0.0.0 --port 8000 --reload > ../logs/backend.log 2>&1 &
	@echo "Starting frontend in background..."
	@cd frontend && nohup pnpm run dev > ../logs/frontend.log 2>&1 &
	@echo "All apps started."
	@echo "Backend: http://localhost:8000 (logs: logs/backend.log)"
	@echo "Frontend: http://localhost:5173 (logs: logs/frontend.log)"

# Stop everything
down: docker-down kill

# Alias for down
stop: down

# Stop only the backend and frontend processes
kill:
	@echo "Stopping backend and frontend..."
	-@pkill -f "uvicorn main:app" || true
	-@pkill -f "vite" || true
	@echo "Processes stopped."

# Restart all services
restart: down up

# Docker operations
docker-up:
	docker-compose up -d

docker-down:
	docker-compose down

# Helper to tail logs
tail-backend:
	tail -f logs/backend.log

tail-frontend:
	tail -f logs/frontend.log

# Legacy/Alternative foreground log commands
logs-backend:
	cd backend && uv run uvicorn main:app --host 0.0.0.0 --port 8000 --reload

logs-frontend:
	cd frontend && pnpm run dev
