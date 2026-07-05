#!/bin/bash
echo "Menyiapkan NEXUS Bot..."
echo ""

# Periksa apakah Node.js sudah terinstal
if ! command -v node &> /dev/null; then
    echo "❌ Node.js tidak ditemukan! Harap install Node.js versi 18+ terlebih dahulu."
    exit 1
fi

echo "📦 Menginstall dependencies..."
npm install

echo "🛠️ Membangun (build) aplikasi..."
npm run build

echo "🚀 Menyiapkan PM2 untuk process management..."
if ! command -v pm2 &> /dev/null; then
    echo "PM2 tidak ditemukan, menginstall PM2 secara global..."
    npm install -g pm2
fi

echo "Mengecek ketersediaan port..."
PORT=3000
while lsof -i:$PORT >/dev/null 2>&1; do
    echo "Port $PORT sedang digunakan. Mencoba port berikutnya..."
    PORT=$((PORT+1))
done

echo "Menyimpan konfigurasi port $PORT ke .env..."
if grep -q "PORT=" .env 2>/dev/null; then
    sed -i "s/PORT=.*/PORT=$PORT/" .env
else
    echo "PORT=$PORT" >> .env
fi

echo "▶️ Menjalankan aplikasi dengan PM2 di port $PORT..."
pm2 start dist/server.cjs --name "nexus-bot"

echo ""
echo "✅ Instalasi Selesai!"
echo "NEXUS Bot Panel sekarang berjalan di background menggunakan PM2 pada port $PORT."
echo "Anda dapat melihat status dengan perintah: pm2 status nexus-bot"
echo "Untuk melihat log, jalankan: pm2 logs nexus-bot"
