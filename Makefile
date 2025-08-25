.PHONY: setup dev backend frontend test clean

setup:
	@echo "Setting up Utilify monorepo..."
	@chmod +x .tooling/bootstrap.sh
	@./.tooling/bootstrap.sh
	@echo "Setup complete!"

dev:
	@echo "Starting development servers..."
	@command -v foreman >/dev/null 2>&1 || { echo "Installing foreman..."; gem install foreman; }
	@foreman start -f Procfile.dev

backend:
	@echo "Starting Rails backend on port 4000..."
	@cd backend && bin/rails s -p 4000

frontend:
	@echo "Starting Next.js frontend on port 3000..."
	@cd frontend && npm run dev -- -p 3000

test:
	@echo "Running backend tests..."
	@cd backend && bundle exec rspec

clean:
	@echo "Cleaning temporary files..."
	@rm -rf backend/tmp/*
	@rm -rf frontend/.next
	@echo "Clean complete!"