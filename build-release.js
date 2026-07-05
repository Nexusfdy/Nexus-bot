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

async function buildReleases() {
  // 1. Encrypted Version ZIP
  console.log("Packaging Encrypted Version...");
  const encryptedDir = path.join(process.cwd(), 'release', 'encrypted_temp');
  fs.mkdirSync(encryptedDir, { recursive: true });

  // Copy dist
  execSync(`cp -r dist "${encryptedDir}/"`);

  // Create package.json
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
  fs.writeFileSync(path.join(encryptedDir, 'package.json'), JSON.stringify(encPkg, null, 2));

  if (fs.existsSync(path.join(process.cwd(), '.env.example'))) {
    fs.copyFileSync(path.join(process.cwd(), '.env.example'), path.join(encryptedDir, '.env.example'));
  }

  const readmeEncrypted = `NEXUS BOT - ENCRYPTED VERSION\n=============================\n\nCara Menjalankan:\n1. Pastikan Node.js sudah terinstall\n2. Jalankan perintah: npm install\n3. Copy file .env.example menjadi .env dan isi konfigurasinya\n4. Jalankan bot dengan perintah: npm start\n`;
  fs.writeFileSync(path.join(encryptedDir, 'README.txt'), readmeEncrypted);

  try {
    execSync(`cd "${encryptedDir}" && zip -r ../nexus-bot-encrypted.zip .`, { stdio: 'inherit' });
  } catch(e) {
    console.log("Zip error", e);
  }
  fs.rmSync(encryptedDir, { recursive: true, force: true });

  // 2. Full Source Code ZIP
  console.log("Packaging Source Code Version...");
  const sourceDir = path.join(process.cwd(), 'release', 'source_temp');
  fs.mkdirSync(sourceDir, { recursive: true });

  const items = fs.readdirSync(process.cwd());
  for (const item of items) {
    if (['node_modules', 'dist', 'release', '.git', '.env', 'build-release.js', 'test-sync.ts', 'test-db.ts'].includes(item)) continue;
    execSync(`cp -r "${path.join(process.cwd(), item)}" "${sourceDir}/"`);
  }

  const readmeSource = `NEXUS BOT - FULL SOURCE CODE\n============================\n\nCara Menjalankan Mode Development:\n1. Pastikan Node.js sudah terinstall\n2. Jalankan perintah: npm install\n3. Copy file .env.example menjadi .env dan isi konfigurasinya\n4. Jalankan bot dengan perintah: npm run dev\n\nCara Build:\n- Normal Build: npm run build\n- Encrypted Build: npm run build:encrypt\n`;
  fs.writeFileSync(path.join(sourceDir, 'README.txt'), readmeSource);

  try {
    execSync(`cd "${sourceDir}" && zip -r ../nexus-bot-source.zip . -x ".*"`, { stdio: 'inherit' });
  } catch(e) {
    console.log("Zip error", e);
  }
  fs.rmSync(sourceDir, { recursive: true, force: true });

  console.log("✅ Release packages created successfully in the 'release/' folder!");
}

buildReleases().catch(console.error);
