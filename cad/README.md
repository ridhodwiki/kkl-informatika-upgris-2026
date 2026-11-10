# Miniatur perjalanan

Model asli untuk adegan scroll KKL, dibuat dengan Text-to-CAD / build123d.
Palet hijau, pasir, dan putih mengikuti halaman. Bentuk bergaya miniatur,
bukan model kendaraan untuk manufaktur.

Jalankan dari root repo dengan Text-to-CAD 0.10.3:

```powershell
cad run cad/exports.py
npm --prefix frontend run build
powershell -ExecutionPolicy Bypass -File static/build.ps1
```

`vehicles.py` memakai milimeter, Z ke atas, haluan/depan ke -Y.
Ekspor GLB mengubahnya menjadi meter, Y ke atas, depan ke +Z.
Posisi lokal sengaja cocok dengan grup kendaraan di `world.jsx`.
`exports.py` menulis `public/assets/models/kkl-{bus,ferry}.glb`;
build static menyalinnya ke `static/assets/models/`.

GLB dimuat hanya saat tampilan 3D aktif. Bentuk prosedural tetap tampil
saat loading atau gagal memuat; mode ringan dan reduced motion tidak
memuat model kendaraan. Animasi mengikuti scroll yang sudah ada.

Validasi aset: `node --test frontend/tests/vehicles.test.js`.
