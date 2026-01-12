.PHONY: up up-extended down down-extended restart restart-extended build logs-backend logs-frontend docker-up docker-up-extended docker-down docker-down-extended kill start-apps

# Start all services (Docker + Apps)
up: docker-up start-apps

# Alias for up
start: up

# Create logs directory and start apps in background
start-apps:
	@mkdir -p logs
	@echo "Starting backend in background..."
	@cd backend && nohup uv run uvicorn main:app --host 0.0.0.0 --port 8888 --reload > ../logs/backend.log 2>&1 &
	@echo "Starting frontend in background..."
	@cd frontend && nohup pnpm run dev > ../logs/frontend.log 2>&1 &
	@echo "All apps started."
	@echo "Backend: http://localhost:8888 (logs: logs/backend.log)"
	@echo "Frontend: http://localhost:5173 (logs: logs/frontend.log)"

# Start all services with extended infra (Admin Tools included)
up-extended: docker-up-extended start-apps

# Stop everything
down: docker-down kill
down-extended: docker-down-extended kill

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
restart-extended: down-extended up-extended

# Docker operations
docker-up:
	docker compose up -d

docker-up-extended:
	docker compose -f docker-compose-extended.yml up -d

docker-down:
	docker compose down

docker-down-extended:
	docker compose -f docker-compose-extended.yml down

# Helper to tail logs
tail-backend:
	tail -f logs/backend.log

tail-frontend:
	tail -f logs/frontend.log

# Legacy/Alternative foreground log commands
logs-backend:
	cd backend && uv run uvicorn main:app --host 0.0.0.0 --port 8888 --reload

logs-frontend:
	cd frontend && pnpm run dev
