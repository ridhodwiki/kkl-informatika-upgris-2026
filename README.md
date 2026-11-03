# KKL Informatika UPGRIS 2026

Website dokumentasi perjalanan Kuliah Kerja Lapangan Informatika Universitas PGRI Semarang ke Bali, 18–22 Agustus 2026. Proyek memuat perjalanan, profil pembuat, foto, video, dan kesan peserta, dengan hero 3D berbasis React dan Three.js.

## Dua versi situs

| Kemampuan | PHP / XAMPP (`public/`) | Statis / Vercel (`static/`) |
| --- | --- | --- |
| Sumber konten | Database MySQL/MariaDB | HTML dan aset yang tersimpan di Git |
| Dashboard admin | Ada | Tidak ada backend admin |
| Feedback baru | Dikirim ke database dan dimoderasi admin | Catatan pribadi di `localStorage`, tidak dikirim ke admin |
| Pembaruan konten | Melalui admin | Ekspor konten yang didukung, build, lalu commit/push |
| Pencarian galeri terbaru | Belum disinkronkan | Pencarian judul/lokasi, jumlah hasil, dan reset |

Catatan lokal hanya tersedia pada browser dan origin yang sama. Menghapus data browser menghapus catatan. Feedback yang telah disetujui di PHP dapat ikut diekspor sebagai konten publik; ini berbeda dari catatan lokal pengunjung.

## Fitur

- Hero 3D, animasi perjalanan, dan fallback saat rendering 3D tidak tersedia.
- Timeline perjalanan dengan filter hari.
- Profil pembuat, galeri foto, serta video YouTube.
- Lightbox dengan navigasi keyboard dan sentuhan.
- Navigasi responsif, skip link, dan dukungan preferensi reduced motion.
- Versi statis: pencarian galeri, validasi catatan lokal tanpa menghapus isian ketika penyimpanan gagal, serta lazy loading video.
- Versi PHP: pengelolaan profil, destinasi, galeri, video, pengaturan situs, dan moderasi feedback.

## Struktur proyek

```text
app/                  Core, controller, model, dan view PHP
config/               Konfigurasi database lokal
database/             Skema, seed, dan migrasi SQL
frontend/             Source React/Three.js, Vite, dan tes unit
public/               Front controller PHP dan aset publik
public/dist/          Hasil build Vite
static/               Situs statis yang dipublikasikan
static/build.ps1      Perakitan aset statis dan referensi bundle
static/tests/         Tes browser untuk versi statis
tools/export-static.php  Ekspor konten database ke HTML statis
tests/                Tes regresi PHP dan skrip browser lainnya
```

## Menjalankan versi PHP

Gunakan XAMPP dengan Apache, PHP, dan MySQL/MariaDB. PHP memerlukan PDO MySQL dan Fileinfo. Contoh terminal di bawah memakai PowerShell dari root repositori, bukan dari folder `static/`. Jika `php` belum tersedia di PATH, gunakan lokasi `php.exe` dari instalasi XAMPP.

1. Tempatkan repositori di folder `htdocs`, lalu aktifkan Apache dan database.
2. Salin `config.example.php` ke `config/config.php` dan sesuaikan koneksi database. File konfigurasi lokal dikecualikan dari Git.
3. Untuk database baru, impor `database/schema.sql`, kemudian `database/seed_destinations.sql` melalui phpMyAdmin. Jangan mengimpor ulang seed ke database berisi data tanpa meninjau SQL terlebih dahulu.
4. Tinjau migrasi `database/migration_*.sql` sesuai kondisi database. Skrip details memakai sintaks `ADD COLUMN IF NOT EXISTS`; pastikan kompatibel dengan server database yang digunakan.
5. Buka `http://localhost/kkl-informatika-upgris-2026/public/`. Sesuaikan nama folder jika berbeda.

Admin tersedia di `http://localhost/kkl-informatika-upgris-2026/public/admin/login.php`. Akun seed: username `admin`, password `password`. Aplikasi mewajibkan penggantian password bawaan setelah login.

Data seed dan foto bawaan merupakan titik awal; sesuaikan identitas dan foto melalui admin sebelum dipakai sebagai dokumentasi final. Backup database lokal tidak disertakan sebagai prasyarat clone repositori.

## Pengembangan frontend

Gunakan Node.js 22.12+ atau Node.js 24 beserta npm. Tes browser terbaru telah dijalankan menggunakan Node.js 24 dan Chrome di Windows.

```powershell
cd frontend
npm ci
npm run build
cd ..
```

Vite menghasilkan bundle beserta manifest ke `public/dist/`. `npm run dev` tersedia untuk pengembangan Vite; server tersebut tidak menggantikan backend PHP/MySQL.

## Memperbarui versi statis

Perubahan admin tidak otomatis masuk ke situs Vercel. Dari root repositori, setelah konten database diperiksa:

```powershell
php tools/export-static.php
powershell -ExecutionPolicy Bypass -File static/build.ps1
```

Jika source frontend berubah, jalankan build Vite terlebih dahulu.

- Exporter memperbarui blok profil, galeri, video, dan feedback yang disetujui di `static/index.html`, serta menyalin foto yang dirujuk. Exporter bukan generator seluruh halaman; perubahan timeline atau bagian di luar blok ekspor perlu diperiksa secara terpisah.
- Build menyalin aset dari `public/`, mengganti isi `static/dist/`, memperbarui referensi JS/CSS berdasarkan manifest Vite, dan menerapkan lazy loading pada iframe hasil ekspor.
- `static/assets/js/main.js` dipelihara terpisah dari versi PHP dan sengaja tidak ditimpa build. Penyesuaian UI statis juga memakai `static/assets/css/improvements.css`.
- Ekspor/build dapat membersihkan foto statis yang tidak lagi dirujuk. Periksa diff dan hasil halaman sebelum commit.

Untuk preview statis lokal, jalankan dari root repositori:

```powershell
php -S 127.0.0.1:8080 -t static
```

Buka `http://127.0.0.1:8080/`. Gunakan server HTTP pada root `static/`, karena tautan navigasi memakai path dari root; jangan membuka HTML langsung melalui `file://`.

## Pengujian

Tes unit frontend:

```powershell
npm --prefix frontend test
```

Tes regresi PHP:

```powershell
php tests/regression_check.php
```

Tes browser statis:

```powershell
node static/tests/ui-check.mjs
```

Tes browser menjalankan server lokal dan Chrome headless sendiri. Cakupannya: lebar 375/768/1440 piksel, pencarian/reset/hasil kosong galeri, scroll dengan reduced motion, validasi catatan, kegagalan penyimpanan, penyimpanan berhasil, dan lazy iframe. Ini bukan audit Lighthouse atau pengujian seluruh backend.

Lokasi Chrome default adalah `C:\Program Files\Google\Chrome\Application\chrome.exe`. Jika berbeda:

```powershell
$env:CHROME_PATH = 'C:\lokasi\chrome.exe'
node static/tests/ui-check.mjs
```

Runner ini saat ini memakai pemeriksaan path Windows. Skrip browser lama di `tests/` juga memiliki dependensi CDP dengan path lokal pengembang; jangan menganggapnya portabel atau siap CI tanpa penyesuaian.

## Publikasi ke Vercel

Versi statis menggunakan konfigurasi `static/vercel.json`: output `.`, tanpa install atau build command. Root Directory proyek Vercel harus menunjuk ke `static`. Aset siap publikasi disimpan dalam repositori; Vercel tidak menjalankan PHP, mengambil database lokal, atau melakukan ekspor konten.

Setelah ekspor/build dan pengujian, periksa `git diff`, commit file yang relevan, lalu push ke branch yang terhubung ke proyek Vercel. Deployment otomatis bergantung pada pengaturan integrasi Git dan production branch proyek Vercel. Periksa status deployment di dashboard Vercel setelah push.

Jika domain berubah, sesuaikan canonical URL serta URL Open Graph/Twitter di `static/index.html`.

## Keamanan dan pemeliharaan

- Versi PHP memiliki CSRF, password hashing, validasi upload gambar, dan moderasi feedback. Fitur backend tersebut tidak tersedia pada deployment statis.
- Versi statis memiliki security headers dan kebijakan cache di `static/vercel.json`.
- Ganti kredensial bawaan, gunakan HTTPS pada situs publik, dan buat backup database sebelum perubahan data.
- Jangan commit kredensial, konfigurasi lokal, atau backup database. `.gitignore` mengecualikan backup SQL, dengan pengecualian untuk skema, seed, dan migrasi proyek.
- Routing 404, sitemap, dan robots versi PHP tidak otomatis tersedia pada versi statis; konfigurasi statis saat ini memiliki rewrite menuju halaman utama.
