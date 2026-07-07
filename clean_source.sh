#!/bin/bash

# Pastikan bot sudah di-build sebelum menghapus source code
echo "Membangun (build) aplikasi untuk memastikan dist/ terbaru..."
npm run build

echo "Menghapus file dan folder source code (src, server, dll)..."

# Hapus folder source code
rm -rf src/
rm -rf server/
rm -rf public/

# Hapus file konfigurasi dev
rm -f server.ts
rm -f vite.config.ts
rm -f tsconfig.json
rm -f tsconfig.node.json
rm -f eslint.config.js
rm -f tailwind.config.js
rm -f index.html

echo "=================================================="
echo "✅ Pembersihan selesai!"
echo "Sekarang Anda dapat meng-compress (zip) seluruh folder ini"
echo "untuk dijual sebagai bot versi ENC (Compiled)."
echo "=================================================="
