import AdmZip from 'adm-zip';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

console.log("Building encrypted version...");
execSync('npm run build:encrypt', { stdio: 'inherit' });

const releaseDir = path.join(process.cwd(), 'release');
if (fs.existsSync(releaseDir)) fs.rmSync(releaseDir, { recursive: true, force: true });
fs.mkdirSync(releaseDir);

// 1. Encrypted Version ZIP
console.log("Packaging Encrypted Version...");
const encryptedZip = new AdmZip();
encryptedZip.addLocalFolder(path.join(process.cwd(), 'dist'), 'dist');

// Read original package.json and modify for production/encrypted release
const pkgJson = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf8'));
const encPkg = {
  name: pkgJson.name + "-encrypted",
  version: pkgJson.version,
  description: pkgJson.description,
  author: pkgJson.author,
  type: "module",
  scripts: {
    start: "NODE_ENV=production node dist/server.cjs"
  },
  dependencies: pkgJson.dependencies
};
encryptedZip.addFile('package.json', Buffer.from(JSON.stringify(encPkg, null, 2), 'utf8'));

if (fs.existsSync(path.join(process.cwd(), '.env.example'))) {
  encryptedZip.addLocalFile(path.join(process.cwd(), '.env.example'));
}

const readmeEncrypted = `NEXUS BOT - ENCRYPTED VERSION
=============================

Cara Menjalankan:
1. Pastikan Node.js sudah terinstall
2. Jalankan perintah: npm install
3. Copy file .env.example menjadi .env dan isi konfigurasinya
4. Jalankan bot dengan perintah: npm start
`;
encryptedZip.addFile('README.txt', Buffer.from(readmeEncrypted, 'utf8'));

encryptedZip.writeZip(path.join(releaseDir, 'nexus-bot-encrypted.zip'));

// 2. Full Source Code ZIP
console.log("Packaging Source Code Version...");
const sourceZip = new AdmZip();
const addFolderToZip = (folderPath, zipPath) => {
    const items = fs.readdirSync(folderPath);
    for (const item of items) {
        if (['node_modules', 'dist', 'release', '.git', '.env', 'build-release.js', 'test-sync.ts', 'test-db.ts'].includes(item)) continue;
        const fullPath = path.join(folderPath, item);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            sourceZip.addLocalFolder(fullPath, path.join(zipPath, item));
        } else {
            sourceZip.addLocalFile(fullPath, zipPath);
        }
    }
};
addFolderToZip(process.cwd(), '');

const readmeSource = `NEXUS BOT - FULL SOURCE CODE
============================

Cara Menjalankan Mode Development:
1. Pastikan Node.js sudah terinstall
2. Jalankan perintah: npm install
3. Copy file .env.example menjadi .env dan isi konfigurasinya
4. Jalankan bot dengan perintah: npm run dev

Cara Build:
- Normal Build: npm run build
- Encrypted Build: npm run build:encrypt
`;
sourceZip.addFile('README.txt', Buffer.from(readmeSource, 'utf8'));

sourceZip.writeZip(path.join(releaseDir, 'nexus-bot-source.zip'));

console.log("✅ Release packages created successfully in the 'release/' folder!");
