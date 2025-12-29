#!/bin/bash

# ============================================
# SlideCast V2 - Setup Verification Script
# ============================================

set -e

echo "🚀 SlideCast V2 - Setup Verification"
echo "====================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Track failures
FAILURES=0

check() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓${NC} $1"
    else
        echo -e "${RED}✗${NC} $1"
        FAILURES=$((FAILURES + 1))
    fi
}

warn() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# Check Bun
echo "Checking runtime..."
bun --version > /dev/null 2>&1
check "Bun installed"

# Check PostgreSQL
psql --version > /dev/null 2>&1
check "PostgreSQL installed"

# Check Python
python --version > /dev/null 2>&1 || python3 --version > /dev/null 2>&1
check "Python installed"

# Check EdgeTTS
edge-tts --version > /dev/null 2>&1
check "EdgeTTS installed"

echo ""
echo "Checking project structure..."

# Check critical files
test -f package.json
check "package.json exists"

test -f src/server/server.ts
check "Server entry point exists"

test -f src/client/main.tsx
check "Client entry point exists"

test -f src/server/db/schema.sql
check "Database schema exists"

test -f vite.config.ts
check "Vite config exists"

test -f .env
if [ $? -eq 0 ]; then
    check ".env file exists"
else
    warn ".env file not found (run: cp .env.example .env)"
    FAILURES=$((FAILURES + 1))
fi

echo ""
echo "Checking dependencies..."

test -d node_modules
check "Dependencies installed"

if [ -d node_modules ]; then
    test -d node_modules/react
    check "React installed"
    
    test -d node_modules/express
    check "Express installed"
    
    test -d node_modules/zustand
    check "Zustand installed"
    
    test -d node_modules/pg
    check "PostgreSQL client installed"
fi

echo ""
echo "Checking database..."

if [ -f .env ]; then
    source .env
    
    if command -v psql > /dev/null 2>&1; then
        psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1" > /dev/null 2>&1
        if [ $? -eq 0 ]; then
            check "Database connection successful"
            
            # Check if tables exist
            TABLES=$(psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public'")
            if [ "$TABLES" -gt 0 ]; then
                check "Database tables exist"
            else
                warn "Database tables not found (run: psql $DB_NAME < src/server/db/schema.sql)"
            fi
        else
            warn "Cannot connect to database (check .env credentials)"
        fi
    fi
fi

echo ""
echo "====================================="

if [ $FAILURES -eq 0 ]; then
    echo -e "${GREEN}✓ All checks passed!${NC}"
    echo ""
    echo "You're ready to start:"
    echo "  Terminal 1: bun run dev:server"
    echo "  Terminal 2: bun run dev:client"
    echo ""
    exit 0
else
    echo -e "${RED}✗ $FAILURES check(s) failed${NC}"
    echo ""
    echo "Please fix the issues above before continuing."
    echo "See SETUP_VERIFICATION.md for detailed instructions."
    echo ""
    exit 1
fi
