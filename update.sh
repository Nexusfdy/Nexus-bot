#!/bin/bash
echo "🔄 Melakukan update NEXUS Bot..."
echo ""

echo "📥 Menarik kode terbaru..."
git pull

echo "📦 Menginstall dependencies (jika ada yang baru)..."
npm install

echo "🛠️ Membangun (build) ulang aplikasi..."
npm run build

echo "♻️ Merestart service PM2..."
pm2 restart nexus-bot --update-env

echo ""
echo "✅ Update Selesai!"
echo "Aplikasi telah diperbarui dan direstart."
