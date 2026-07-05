#!/bin/bash
echo "Memulai proses build dan enkripsi untuk Termux..."

# 1. Install dependencies (termasuk devDependencies)
echo "Menginstall dependencies..."
npm install

# 2. Jalankan build dan enkripsi
echo "Melakukan enkripsi kode sumber..."
npm run build:encrypt

# 3. Setup file environment
if [ ! -f .env ]; then
  echo "Membuat file .env dari .env.example..."
  cp .env.example .env
fi

echo ""
echo "===================================================="
echo "✅ Enkripsi Selesai!"
echo "File hasil enkripsi ada di folder: dist/server.cjs"
echo ""
echo "Cara menjalankan bot:"
echo "1. Edit file .env dan isi API Key / Token kamu (contoh: nano .env)"
echo "2. Jalankan perintah: npm start"
echo "===================================================="
