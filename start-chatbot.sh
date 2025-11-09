#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}================================${NC}"
echo -e "${BLUE}Starting Chatbot Application${NC}"
echo -e "${BLUE}================================${NC}\n"

# Check if service_account.json exists
if [ ! -f "service_account.json" ]; then
    echo -e "${RED}Error: service_account.json not found!${NC}"
    echo -e "${YELLOW}Please ensure the service account file is in the root directory.${NC}"
    exit 1
fi

echo -e "${GREEN}✓${NC} Service account file found\n"

# Start backend server in background
echo -e "${BLUE}Starting backend server...${NC}"
cd backend

if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Installing backend dependencies...${NC}"
    npm install
fi

npm start &
BACKEND_PID=$!
echo -e "${GREEN}✓${NC} Backend server started (PID: $BACKEND_PID)\n"

# Wait for backend to start
sleep 3

# Start frontend server
cd ..
echo -e "${BLUE}Starting frontend server...${NC}"

if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Installing frontend dependencies...${NC}"
    npm install
fi

npm run dev &
FRONTEND_PID=$!
echo -e "${GREEN}✓${NC} Frontend server started (PID: $FRONTEND_PID)\n"

echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}Application Started Successfully!${NC}"
echo -e "${GREEN}================================${NC}\n"

echo -e "${BLUE}Backend:${NC}  http://localhost:5000"
echo -e "${BLUE}Frontend:${NC} http://localhost:5173\n"

echo -e "${YELLOW}Press Ctrl+C to stop all servers${NC}\n"

# Function to cleanup on exit
cleanup() {
    echo -e "\n${YELLOW}Stopping servers...${NC}"
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    echo -e "${GREEN}✓${NC} Servers stopped"
    exit 0
}

# Trap Ctrl+C
trap cleanup INT

# Wait for user to stop
wait
