#!/bin/bash

# ============================================
# SlideCast V2 - Quick Start Script
# ============================================

set -e

echo "🚀 SlideCast V2 - Quick Start"
echo "============================="
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

step() {
    echo -e "${BLUE}➤${NC} $1"
}

success() {
    echo -e "${GREEN}✓${NC} $1"
}

warn() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# Check if already setup
if [ -f .env ] && [ -d node_modules ]; then
    warn "Project appears to be already setup."
    read -p "Do you want to re-run setup? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Skipping setup. Running servers..."
        echo ""
        step "Starting backend server..."
        bun run dev:server &
        BACKEND_PID=$!
        
        sleep 3
        
        step "Starting frontend server..."
        bun run dev:client &
        FRONTEND_PID=$!
        
        echo ""
        success "Servers started!"
        echo "  Backend:  http://localhost:3001"
        echo "  Frontend: http://localhost:5173"
        echo ""
        echo "Press Ctrl+C to stop both servers"
        
        wait
        exit 0
    fi
fi

# Step 1: Install dependencies
step "Installing dependencies..."
bun install
success "Dependencies installed"
echo ""

# Step 2: Install EdgeTTS
step "Installing EdgeTTS..."
if command -v pip3 > /dev/null 2>&1; then
    pip3 install edge-tts --quiet
else
    pip install edge-tts --quiet
fi
success "EdgeTTS installed"
echo ""

# Step 3: Setup environment
if [ ! -f .env ]; then
    step "Creating .env file..."
    cp .env.example .env
    success ".env file created"
    echo ""
    warn "IMPORTANT: Edit .env file with your database credentials!"
    echo "  nano .env  # or use your preferred editor"
    echo ""
    read -p "Press Enter after updating .env file..."
else
    success ".env file already exists"
fi

echo ""

# Step 4: Database setup
step "Setting up database..."

source .env

# Check if database exists
if command -v psql > /dev/null 2>&1; then
    if psql -lqt | cut -d \| -f 1 | grep -qw "$DB_NAME"; then
        success "Database '$DB_NAME' already exists"
    else
        warn "Database '$DB_NAME' not found. Creating..."
        createdb "$DB_NAME" || {
            echo "Failed to create database. Please create it manually:"
            echo "  createdb $DB_NAME"
            exit 1
        }
        success "Database created"
    fi
    
    # Run migrations
    step "Running database migrations..."
    psql "$DB_NAME" < src/server/db/schema.sql > /dev/null 2>&1 || {
        warn "Failed to run migrations (tables may already exist)"
    }
    success "Database migrations complete"
else
    warn "psql not found. Please setup database manually:"
    echo "  createdb $DB_NAME"
    echo "  psql $DB_NAME < src/server/db/schema.sql"
fi

echo ""

# Step 5: Verify setup
step "Verifying setup..."
bash scripts/verify-setup.sh || {
    warn "Some checks failed. Please review and fix."
    exit 1
}

echo ""
success "Setup complete!"
echo ""
echo "To start the application:"
echo "  Terminal 1: bun run dev:server"
echo "  Terminal 2: bun run dev:client"
echo ""
echo "Or run both at once:"
echo "  bash scripts/quick-start.sh"
echo ""
