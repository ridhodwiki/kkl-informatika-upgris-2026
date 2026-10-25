UPDATE destinations SET
    place_description = CASE id
        WHEN 1 THEN 'Titik kumpul dan persiapan keberangkatan peserta KKL dari Kampus 1 UPGRIS sebelum perjalanan dimulai.'
        WHEN 2 THEN 'Kunjungan industri ke perusahaan manufaktur kosmetik dan perlengkapan mandi. Sumber resmi perusahaan menyebut pabriknya berada di Semarang dan memproduksi antara lain produk perawatan tubuh, rambut, serta kebersihan.'
        WHEN 3 THEN 'Persinggahan makan siang rombongan di Caruban sebelum perjalanan dilanjutkan menuju Bali.'
        WHEN 5 THEN 'Tahap penyeberangan rombongan dari Pelabuhan Ketapang menuju Pelabuhan Gilimanuk sebagai jalur penghubung Jawa dan Bali.'
        WHEN 6 THEN 'Kunjungan ke Joger Luwus, lokasi suvenir dan produk kata-kata khas Bali dalam agenda perjalanan.'
        WHEN 7 THEN 'Kunjungan ke kawasan Candikuning dan Ulun Danu Beratan. Lanskap budaya Bali terkait sistem subak memadukan teras sawah, pura air, dan pengelolaan air bersama.'
        WHEN 9 THEN 'Menonton pertunjukan Devdan di kawasan Nusa Dua sebagai bagian dari agenda eksplorasi seni pertunjukan.'
        WHEN 11 THEN 'Kunjungan industri ke Balai Diklat Industri Denpasar dalam agenda pembelajaran lapangan.'
        WHEN 13 THEN 'Kunjungan ke Pantai Kuta untuk menikmati suasana pesisir dalam agenda perjalanan.'
        WHEN 14 THEN 'Kunjungan ke Pantai Pandawa, kawasan pantai yang dicatat pada dokumentasi perjalanan.'
        WHEN 15 THEN 'Agenda pertunjukan Tari Kecak di kawasan Pantai Pandawa sebagai bagian dari eksplorasi budaya.'
        WHEN 16 THEN 'Makan malam dan malam keakraban rombongan di area tepi Pantai Jimbaran.'
        WHEN 18 THEN 'Tahap perjalanan pulang melalui Pelabuhan Gilimanuk dan Pelabuhan Ketapang setelah singgah makan siang di RM. Soka Indah.'
    END,
    address = CASE id
        WHEN 1 THEN 'Lokasi umum: Kampus 1 Universitas PGRI Semarang.'
        WHEN 2 THEN 'Lokasi umum: Ngaliyan, Semarang.'
        WHEN 3 THEN 'Lokasi umum: Caruban, Madiun, Jawa Timur.'
        WHEN 5 THEN 'Lokasi umum: Pelabuhan Ketapang, Banyuwangi.'
        WHEN 6 THEN 'Lokasi umum: Tabanan, Bali.'
        WHEN 7 THEN 'Lokasi umum: Desa Candikuning, Tabanan, Bali.'
        WHEN 9 THEN 'Lokasi umum: Kuta Selatan, Bali.'
        WHEN 11 THEN 'Lokasi umum: Denpasar, Bali.'
        WHEN 13 THEN 'Lokasi umum: Pantai Kuta, Bali.'
        WHEN 14 THEN 'Lokasi umum: Pantai Pandawa, Bali.'
        WHEN 15 THEN 'Lokasi umum: kawasan Pantai Pandawa, Bali.'
        WHEN 16 THEN 'Lokasi umum: tepi Pantai Jimbaran, Bali.'
        WHEN 18 THEN 'Lokasi umum: Pelabuhan Gilimanuk dan Pelabuhan Ketapang.'
    END
WHERE id IN (1, 2, 3, 5, 6, 7, 9, 11, 13, 14, 15, 16, 18)
  AND (place_description IS NULL OR place_description = '')
  AND (address IS NULL OR address = '');
