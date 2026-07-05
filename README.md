# Nexus Bot Panel

Dashboard admin web responsif untuk mengelola bot Discord auto-store produk digital, sistem klaim otomatis, kustomisasi perintah, statistik real-time, dan auto-moderasi tingkat lanjut.

## Persiapan Awal (Wajib)

Sebelum menjalankan installer, pastikan Anda telah menyiapkan database PostgreSQL dan mengonfigurasi pengaturan:

1. Salin file konfigurasi:
   ```bash
   cp .env.example .env
   ```
2. Edit file `.env`:
   ```bash
   nano .env
   ```
3. **PENTING**: Isi bagian `DATABASE_URL` dengan URL PostgreSQL Anda. Ubah juga `JWT_SECRET` dan `ADMIN_PASSWORD` untuk keamanan dashboard admin Anda.

## Instalasi

Jalankan script instalasi otomatis:
```bash
bash install.sh
```

## Pengaturan Port (Auto-Resolve)

- Secara default, aplikasi akan berjalan pada port **3000**.
- **Jika terjadi bentrok**, installer otomatis akan mencari port terdekat yang kosong (misal: 3001, 3002, dst).
- Port yang terpilih akan disimpan ke dalam file `.env` pada variabel `PORT`.
- Anda dapat mengubah port manual kapan saja dengan mengedit `.env`, lalu menjalankan ulang PM2.

## Update Aplikasi

Untuk memperbarui aplikasi ke versi terbaru tanpa harus menginstall ulang:
```bash
bash update.sh
```
Script `update.sh` akan menarik kode terbaru, menginstal dependencies, membuild ulang aplikasi, dan merestart service PM2.

## Konfigurasi Reverse Proxy (Nginx)

Jika Anda menggunakan Nginx, pastikan Anda proxy_pass ke port yang sesuai dengan nilai di `PORT` pada `.env` (misal 3000):

```nginx
server {
    listen 80;
    server_name domainanda.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```
