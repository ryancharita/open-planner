#!/bin/bash

# Script to run both API and Web servers concurrently

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}Starting development servers...${NC}"
echo -e "${GREEN}API Server:${NC} http://localhost:3001"
echo -e "${GREEN}Web Server:${NC} http://localhost:3000"
echo ""

# Function to cleanup background processes on exit
cleanup() {
    echo ""
    echo "Stopping servers..."
    kill $API_PID $WEB_PID 2>/dev/null
    exit
}

# Trap Ctrl+C and call cleanup
trap cleanup INT TERM

# Start API server on port 3001
cd backend/api
PORT=3001 bun run --hot src/index.tsx &
API_PID=$!
cd ../..

# Start Web server on port 3000
cd web/open-planner
bun run dev &
WEB_PID=$!
cd ../..

# Wait for both processes
wait $API_PID $WEB_PID
