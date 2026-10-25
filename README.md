# KKL Informatika UPGRIS 2026

Website dokumentasi KKL Informatika UPGRIS 2026 berbasis PHP + MySQL untuk XAMPP.

## Struktur

- `public/index.php` front controller utama.
- `app/core` core, router, auth, CSRF, database, helpers.
- `app/models` model per fitur.
- `app/controllers` controller (Home, Admin).
- `app/views` view.
- `config/config.php` konfigurasi database.
- `public/assets` aset publik.
- `public/uploads` upload dinamis.
- `database/schema.sql` skema database.

## Cara menjalankan

1. Install XAMPP dan aktifkan Apache + MySQL.
2. Salin folder `kkl-informatika-upgris-2026` ke: `C:\xampp\htdocs\`
3. Salin `config.example.php` menjadi `config/config.php` lalu sesuaikan kredensial database.
4. Buka `http://localhost/phpmyadmin`.
5. Buat/import database dengan file `database/schema.sql` dan `database/seed_destinations.sql`.
6. Buka: `http://localhost/kkl-informatika-upgris-2026/public/`

## Login admin

URL: `http://localhost/kkl-informatika-upgris-2026/public/admin/login.php`

- Username: `admin`
- Password: `password`

Segera ganti password admin untuk penggunaan nyata.

## Pengelolaan

Di dashboard admin kamu dapat:
- Mengubah judul dan logo.
- Mengedit / menambah profil pembuat (12 anggota).
- Mengunggah dokumentasi foto.
- Menambahkan link YouTube.
- Menyetujui atau menghapus feedback.

## Foto demo

Profil tanpa foto atau placeholder akan memakai foto demo dari `public/uploads/profiles/` (andi, budi, citra, dewi, eka, fajar, gita, hadi, indah, joko, kartika). Ini jelas ditandai sebagai foto demo, bukan foto anggota asli.

## Catatan keamanan

Template sudah menerapkan:
- CSRF token di semua form.
- Password hashing `password_hash`.
- Validasi upload: MIME via finfo, `getimagesize`, maksimal 3 MB, nama file acak.
- Security headers: `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, CSP ringan.
- Halaman 404 kustom, sitemap.xml, robots.txt, JSON-LD schema.

Untuk dipublikasikan, tetap lakukan:
- Ganti password admin default.
- Gunakan HTTPS.
- Backup database secara berkala.

## Struktur data

- `database/schema.sql` — skema database + seed profil & pengaturan.
- `database/seed_destinations.sql` — 20 destinasi 5 hari rundown KKL.
- `database/backup_pre_seed_20261025.sql` — backup database sebelum seeding.
