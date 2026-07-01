#!/bin/bash
set -e

# Warna Output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}==============================================${NC}"
echo -e "${GREEN}      Nexus Discord Bot Auto Installer        ${NC}"
echo -e "${GREEN}==============================================${NC}"

# Rollback & Error Handler Sederhana
cleanup_on_fail() {
    if [ $? -ne 0 ]; then
        echo -e "${RED}[!] Terjadi kesalahan. Instalasi dihentikan.${NC}"
        echo -e "${YELLOW}Silakan periksa log error di atas dan perbaiki sebelum menjalankan ulang script.${NC}"
    fi
}
trap cleanup_on_fail EXIT

# Variabel Database
DB_NAME="nexus_db"
DB_USER="nexus_user"
# Jika belum ada password, akan digenerate otomatis
DB_PASS=$(openssl rand -hex 16 2>/dev/null || date +%s%N | sha256sum | head -c 32)
JWT_SEC=$(openssl rand -hex 32 2>/dev/null || date +%s%N | sha256sum | head -c 64)

echo -e "${YELLOW}[1/15] Pengecekan Persyaratan Perangkat Keras...${NC}"
# Cek RAM (Min 1 GB)
TOTAL_RAM=$(free -m | awk '/^Mem:/{print $2}')
if [ "$TOTAL_RAM" -lt 900 ]; then
    echo -e "${YELLOW}Warning: RAM terbaca ${TOTAL_RAM}MB. Direkomendasikan minimal 1GB untuk performa optimal. Instalasi tetap dilanjutkan.${NC}"
fi

# Cek Free Disk (Min 2 GB = 2000 MB)
FREE_DISK=$(df -m / | tail -1 | awk '{print $4}')
if [ "$FREE_DISK" -lt 2000 ]; then
    echo -e "${RED}Error: Minimal 2GB ruang penyimpanan kosong dibutuhkan. Saat ini hanya ${FREE_DISK}MB.${NC}"
    exit 1
fi
echo -e "${GREEN}Hardware memenuhi syarat.${NC}"

echo -e "${YELLOW}[2/15] Update System Package...${NC}"
sudo apt-get update -y

echo -e "${YELLOW}[3/15] Install curl, git, unzip, build-essential, nginx, certbot...${NC}"
sudo apt-get install -y curl git unzip build-essential nginx certbot python3-certbot-nginx ufw postgresql-client

echo -e "${YELLOW}[4/15] Cek / Install Node.js v20+...${NC}"
if ! command -v node > /dev/null || [ "$(node -v | cut -d'v' -f2 | cut -d'.' -f1)" -lt 20 ]; then
    echo -e "${YELLOW}Menginstall Node.js 20 LTS...${NC}"
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
else
    echo -e "${GREEN}Node.js $(node -v) sudah terinstall.${NC}"
fi

echo -e "${YELLOW}[5/15] Cek / Install PM2...${NC}"
if ! command -v pm2 > /dev/null; then
    sudo npm install -g pm2
else
    echo -e "${GREEN}PM2 sudah terinstall.${NC}"
fi

echo -e "${YELLOW}[6/15] Cek / Install PostgreSQL...${NC}"
if ! command -v psql > /dev/null || ! systemctl is-active --quiet postgresql; then
    sudo apt-get install -y postgresql postgresql-contrib
fi
sudo systemctl start postgresql
sudo systemctl enable postgresql
echo -e "${GREEN}PostgreSQL berjalan.${NC}"

echo -e "${YELLOW}[7/15] Membuat Database dan User PostgreSQL...${NC}"
DB_EXISTS=$(sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname='$DB_NAME'")
if [ "$DB_EXISTS" != "1" ]; then
    echo -e "${YELLOW}Membuat database '$DB_NAME' dan user '$DB_USER'...${NC}"
    sudo -u postgres psql -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASS';"
    sudo -u postgres psql -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;"
else
    echo -e "${GREEN}Database '$DB_NAME' sudah ada.${NC}"
fi

echo -e "${YELLOW}[8/15] Konfigurasi .env dan Validasi...${NC}"
if [ ! -f .env ]; then
    echo -e "${YELLOW}Membuat .env dari .env.example...${NC}"
    cp .env.example .env
    
    if [ "$DB_EXISTS" != "1" ]; then
        sed -i "s|DATABASE_URL=.*|DATABASE_URL=postgresql://$DB_USER:$DB_PASS@localhost:5432/$DB_NAME|" .env
        sed -i "s/JWT_SECRET=.*/JWT_SECRET=$JWT_SEC/" .env
    fi
else
    echo -e "${GREEN}File .env sudah ada.${NC}"
fi

# Load Env
export $(grep -v '^#' .env | xargs)

if [ -z "$JWT_SECRET" ] || [ -z "$ADMIN_PASSWORD" ] || [ -z "$DATABASE_URL" ]; then
    echo -e "${RED}[!] ERROR: Variabel wajib di .env masih kosong (JWT_SECRET, ADMIN_PASSWORD, atau DATABASE_URL)!${NC}"
    echo -e "${YELLOW}Harap isi variabel di file .env terlebih dahulu, kemudian jalankan ulang installer.${NC}"
    exit 1
fi
echo -e "${GREEN}Validasi .env sukses.${NC}"

echo -e "${YELLOW}[8.5/15] Pengecekan Port Aplikasi...${NC}"
APP_PORT=$(grep -E "^PORT=" .env | cut -d '=' -f2 | tr -d '"' | tr -d "'")
if [ -z "$APP_PORT" ]; then
    APP_PORT=3000
fi

# Pastikan utility 'ss' tersedia, jika tidak coba 'netstat', jika tidak gunakan node
if command -v ss > /dev/null; then
    while ss -tuln | grep -qE ":$APP_PORT\b"; do
        echo -e "${YELLOW}Port $APP_PORT sedang digunakan. Mencari port lain...${NC}"
        APP_PORT=$((APP_PORT+1))
    done
elif command -v netstat > /dev/null; then
    while netstat -tuln | grep -qE ":$APP_PORT\b"; do
        echo -e "${YELLOW}Port $APP_PORT sedang digunakan. Mencari port lain...${NC}"
        APP_PORT=$((APP_PORT+1))
    done
else
    # Fallback to node script if ss and netstat are not available
    APP_PORT=$(node -e "
const net = require('net');
let port = parseInt('$APP_PORT', 10);
if (isNaN(port)) port = 3000;
function checkPort(p) {
  const s = net.createServer();
  s.unref();
  s.on('error', () => { console.error('Port '+p+' sedang digunakan. Mencari port lain...'); checkPort(p + 1); });
  s.listen(p, () => { s.close(() => { console.log(p); }); });
}
checkPort(port);
")
fi

echo -e "${GREEN}Port $APP_PORT tersedia dan akan digunakan.${NC}"

if grep -q "^PORT=" .env; then
    sed -i "s/^PORT=.*/PORT=$APP_PORT/" .env
else
    echo "PORT=$APP_PORT" >> .env
fi

# Reload Env after updating PORT
export $(grep -v '^#' .env | xargs)

echo -e "${YELLOW}[9/15] Menjalankan npm install...${NC}"
npm install

echo -e "${YELLOW}[10/15] Menjalankan Build Production...${NC}"
npm run build

echo -e "${YELLOW}[11/15] Database Bootstrap...${NC}"
echo -e "${GREEN}Aplikasi akan melakukan bootstrap otomatis pada tabel-tabel PostgreSQL saat dijalankan.${NC}"

echo -e "${YELLOW}[12/15] Menjalankan Aplikasi dengan PM2...${NC}"
pm2 restart nexus-bot --update-env || pm2 start dist/server.cjs --name "nexus-bot"

echo -e "${YELLOW}[13/15] Menyimpan PM2 Startup...${NC}"
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u $USER --hp $HOME || pm2 startup
pm2 save

echo -e "${YELLOW}[14/15] Konfigurasi Firewall (UFW)...${NC}"
sudo ufw allow ssh
sudo ufw allow http
sudo ufw allow https
sudo ufw allow $APP_PORT
sudo ufw --force enable

echo -e "${YELLOW}[15/15] Finalisasi...${NC}"
# Matikan trap error karena sukses
trap - EXIT

echo -e "${GREEN}==============================================${NC}"
echo -e "${GREEN}   INSTALLER SELESAI DENGAN SUKSES!           ${NC}"
echo -e "${GREEN}==============================================${NC}"
echo -e "Aplikasi sudah berjalan di background via PM2."
echo -e "Gunakan perintah berikut untuk melihat log aplikasi:"
echo -e "${YELLOW}  pm2 logs nexus-bot${NC}"
echo -e ""

PUBLIC_IP=$(curl -sS ifconfig.me 2>/dev/null || echo "IP_SERVER_ANDA")
echo -e "Akses Dashboard melalui browser:"
echo -e "${YELLOW}  http://$PUBLIC_IP:$APP_PORT${NC}"
echo -e ""
echo -e "Password Admin Default: ${YELLOW}$ADMIN_PASSWORD${NC}"
echo -e "${RED}Sangat disarankan untuk mengubah password admin di .env dan merestart aplikasi.${NC}"
echo -e ""
echo -e "Jangan lupa hubungkan domain Anda ke IP Server ini lalu atur Reverse Proxy menggunakan Nginx & Certbot."
echo -e "${GREEN}==============================================${NC}"
