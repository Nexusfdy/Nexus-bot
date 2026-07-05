#!/bin/bash
echo "Building encrypted version..."
npm run build:encrypt

mkdir -p release
rm -rf release/*

echo "Packaging Encrypted Version..."
mkdir -p release/encrypted_temp
cp -r dist release/encrypted_temp/
cp .env.example release/encrypted_temp/ 2>/dev/null || true

node -e "
const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const encPkg = {
  name: pkg.name + '-encrypted',
  version: pkg.version,
  description: pkg.description,
  author: pkg.author,
  type: 'module',
  scripts: { start: 'NODE_ENV=production node dist/server.cjs' },
  dependencies: pkg.dependencies
};
fs.writeFileSync('release/encrypted_temp/package.json', JSON.stringify(encPkg, null, 2));
"

cat << 'README' > release/encrypted_temp/README.txt
NEXUS BOT - ENCRYPTED VERSION
=============================

Cara Menjalankan:
1. Pastikan Node.js sudah terinstall
2. Jalankan perintah: npm install
3. Copy file .env.example menjadi .env dan isi konfigurasinya
4. Jalankan bot dengan perintah: npm start
README

cd release/encrypted_temp
tar -czf ../nexus-bot-encrypted.tar.gz * .env* 2>/dev/null || tar -czf ../nexus-bot-encrypted.tar.gz *
cd ../..
rm -rf release/encrypted_temp

echo "Packaging Source Code Version..."
mkdir -p release/source_temp
ls -A | grep -v -E "^node_modules$|^dist$|^release$|^\.git$" | xargs -I {} cp -r {} release/source_temp/

cat << 'README' > release/source_temp/README.txt
NEXUS BOT - FULL SOURCE CODE
============================

Cara Menjalankan Mode Development:
1. Pastikan Node.js sudah terinstall
2. Jalankan perintah: npm install
3. Copy file .env.example menjadi .env dan isi konfigurasinya
4. Jalankan bot dengan perintah: npm run dev

Cara Build:
- Normal Build: npm run build
- Encrypted Build: npm run build:encrypt
README

cd release/source_temp
tar -czf ../nexus-bot-source.tar.gz * .env* 2>/dev/null || tar -czf ../nexus-bot-source.tar.gz *
cd ../..
rm -rf release/source_temp

echo "Release packages created successfully in the 'release/' folder!"
