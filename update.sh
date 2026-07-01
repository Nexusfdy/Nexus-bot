#!/bin/bash

# Update script for Nexus Bot

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${YELLOW}Memulai proses update...${NC}"

echo -e "${YELLOW}1. Menarik update dari repositori (jika ada)...${NC}"
git pull origin main || echo -e "${YELLOW}Tidak bisa git pull. Pastikan ini adalah repositori git.${NC}"

echo -e "${YELLOW}2. Install dependensi baru (jika ada)...${NC}"
npm install

echo -e "${YELLOW}3. Build ulang aplikasi...${NC}"
npm run build

echo -e "${YELLOW}4. Pengecekan port aplikasi dari .env...${NC}"
if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
fi

APP_PORT=${PORT:-3000}
echo -e "${GREEN}Port yang akan digunakan PM2: $APP_PORT${NC}"

echo -e "${YELLOW}5. Restart PM2 dan memuat environment terbaru...${NC}"
pm2 restart nexus-bot --update-env || pm2 start dist/server.cjs --name "nexus-bot"

echo -e "${GREEN}Update selesai! Aplikasi sekarang berjalan di background.${NC}"
echo -e "${YELLOW}Gunakan 'pm2 logs nexus-bot' untuk memantau log.${NC}"
