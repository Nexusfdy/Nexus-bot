# Nexus Bot

Aplikasi Nexus Bot dilengkapi dengan installer otomatis (`install.sh`) yang dirancang untuk production-ready.

## Pengaturan Port (Auto-Resolve)
- Secara default, aplikasi akan berjalan pada port **3000**.
- **Jika terjadi bentrok (port sudah digunakan oleh aplikasi lain)**, installer otomatis akan mencari port terdekat yang kosong (misal: 3001, 3002, dst).
- Port yang terpilih akan disimpan ke dalam file `.env` pada variabel `PORT`.
- User tetap bisa mengubah port secara manual kapan saja dengan mengedit nilai `PORT` di dalam file `.env`, lalu menjalankan ulang PM2.

## Update Aplikasi
Untuk memperbarui aplikasi ke versi terbaru tanpa harus menginstall ulang, cukup jalankan:
```bash
bash update.sh
```
Script `update.sh` ini akan menarik kode terbaru, menginstal dependencies, membuild ulang aplikasi, dan merestart service PM2 dengan membawa environment terbaru (termasuk jika ada perubahan port).

## Konfigurasi Nginx
Jika Anda melakukan setup Nginx sebagai reverse proxy, pastikan Anda menggunakan port yang sesuai dengan nilai di `PORT` pada `.env` (secara default `3000`, atau port alternatif jika terjadi bentrok), **bukan hardcoded ke 3000**. Contoh proxy pass:
```nginx
location / {
    proxy_pass http://127.0.0.1:PORT_ANDA;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
}
```
