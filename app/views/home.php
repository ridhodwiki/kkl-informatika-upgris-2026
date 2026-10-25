<?php
$siteTitle = $settings['site_title'] ?? 'KKL Informatika UPGRIS 2026';
?>
<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title><?= e($pageTitle ?? $siteTitle) ?></title>
<meta name="description" content="Dokumentasi perjalanan Kuliah Kerja Lapangan Program Studi Informatika UPGRIS 2026 — 18–22 Agustus 2026, Bali. Cerita, foto, video, dan kesan para pembuat.">
<link rel="canonical" href="<?= url('/') ?>">
<meta property="og:title" content="<?= e($siteTitle) ?>">
<meta property="og:description" content="Dokumentasi perjalanan Kuliah Kerja Lapangan Program Studi Informatika UPGRIS 2026 — 18–22 Agustus 2026, Bali.">
<meta property="og:type" content="website">
<meta property="og:url" content="<?= url('/') ?>">
<meta property="og:image" content="<?= url('assets/img/hero-bali.jpg') ?>">
<meta property="og:image:width" content="2000">
<meta property="og:image:height" content="1333">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:image" content="<?= url('assets/img/hero-bali.jpg') ?>">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<link rel="stylesheet" href="<?= url('assets/css/style.css') ?>?v=8">
</head>
<body>
<a class="skip-link" href="#tentang">Lewati ke konten utama</a>
<header class="site-header">
  <div class="container nav-wrap">
    <a class="brand" href="<?= url('/') ?>">
      <?php if (!empty($settings['logo'])): ?><img src="<?= url($settings['logo']) ?>" alt="Logo" decoding="async"><?php else: ?><span class="brand-mark">K</span><?php endif; ?>
      <span><?= e($siteTitle) ?></span>
    </a>
    <nav>
      <a href="<?= url('/#tentang') ?>">Tentang</a>
      <a href="<?= url('/#timeline') ?>">Perjalanan</a>
      <a href="<?= url('/#profil') ?>">Pembuat</a>
      <a href="<?= url('/#galeri') ?>">Galeri</a>
      <a href="<?= url('/#feedback') ?>">Kesan</a>
      <a class="nav-admin" href="<?= url('admin/login.php') ?>">Admin</a>
    </nav>
  </div>
</header>

<section class="hero reveal" id="beranda">
  <div class="hero-content">
    <h1>Satu Perjalanan.<br>Seribu Kenangan.</h1>
    <p>Dokumentasi perjalanan Kuliah Kerja Lapangan Program Studi Informatika UPGRIS 2026 — 18–22 Agustus 2026, Bali.</p>
    <div class="hero-actions"><a class="btn btn-primary" href="#timeline">Lihat Perjalanan</a><a class="btn btn-ghost" href="#galeri">Jelajahi Galeri</a></div>
  </div>
</section>

<section id="tentang" class="section">
  <div class="container two-col">
    <div><h2 class="reveal">Belajar di luar kelas, tumbuh bersama.</h2></div>
    <div><p>Website ini menjadi ruang digital untuk menyimpan cerita, dokumentasi, video, dan kesan dari perjalanan KKL Informatika UPGRIS 2026.</p><p class="muted">Jadwal dapat berubah sesuai kondisi lapangan dan kesepakatan bersama.</p></div>
  </div>
</section>

<section id="timeline" class="section section-soft">
<div class="container"><h2 class="reveal">Jejak perjalanan KKL</h2>
<?php $days = []; foreach ($destinations as $destination) { $days[(int)$destination['day_no']][] = $destination; } ?>
<?php if ($days): ?>
<nav class="day-tabs" aria-label="Filter perjalanan per hari"><button class="day-tab is-active" type="button" data-day="all" aria-pressed="true">Semua</button><?php foreach (array_keys($days) as $dayNo): ?><button class="day-tab" type="button" data-day="<?= (int)$dayNo ?>" aria-pressed="false">Hari <?= (int)$dayNo ?></button><?php endforeach; ?></nav>
<div class="journey-days">
<?php foreach ($days as $dayNo => $items): ?>
<div class="journey-day" data-day="<?= (int)$dayNo ?>"><div class="journey-day-title"><span class="day-badge">Hari <?= $dayNo ?></span><h3>Perjalanan Hari <?= $dayNo ?></h3></div>
<?php $routes = array_values(array_unique(array_filter(array_map(fn($x) => trim((string)$x['route']), $items)))); if ($routes): ?><div class="journey-route"><strong>Rute perjalanan:</strong> <?= e(implode(' → ', $routes)) ?></div><?php endif; ?>
<div class="journey-destinations">
<?php foreach ($items as $destination): ?>
<article class="journey-destination reveal">
  <div class="journey-destination-content">
    <h4><?= e($destination['name']) ?></h4>
    <?php if ($destination['visit_date']): ?><small><?= e(date('d M Y', strtotime($destination['visit_date']))) ?></small><?php endif; ?>
    <?php if ($destination['description']): ?><p><?= e($destination['description']) ?></p><?php endif; ?>
    <?php $destinationPhotos = array_values(array_filter($gallery, fn($photo) => (int)$photo['destination_id'] === (int)$destination['id'])); ?>
    <?php if ($destinationPhotos): ?>
      <div class="journey-photo-grid">
        <?php foreach (array_slice($destinationPhotos, 0, 4) as $photo): ?>
          <a href="#destinasi-<?= (int)$destination['id'] ?>" class="journey-photo"><img src="<?= url($photo['photo']) ?>" alt="<?= e($photo['title']) ?>" loading="lazy" decoding="async"></a>
        <?php endforeach; ?>
      </div>
      <?php if (count($destinationPhotos) > 4): ?><small class="muted">+<?= count($destinationPhotos)-4 ?> foto lainnya</small><?php endif; ?>
    <?php endif; ?>
  </div>
  <a class="btn btn-ghost" href="#destinasi-<?= (int)$destination['id'] ?>">Lihat semua foto</a>
</article>
<?php endforeach; ?>
</div></div>
<?php endforeach; ?>
</div>
<?php else: ?><div class="empty"><p><strong>Susunan perjalanan belum ditambahkan.</strong><br>Rundown KKL 18–22 Agustus 2026 segera diisi melalui dashboard admin.</p></div><?php endif; ?>
</div></section>

<section id="profil" class="section section-soft">
<div class="container"><h2 class="reveal">12 pembuat cerita</h2><p class="section-intro">Edit foto dan informasi anggota melalui halaman admin.</p>
<div class="profile-grid">
<?php foreach ($profiles as $profile): ?>
<article class="profile-card reveal">
<img src="<?= url($profile['photo']) ?>" alt="<?= e($profile['name']) ?>" loading="lazy" decoding="async">
<div class="profile-info">
  <h3><?= e($profile['name']) ?></h3>
  <p><?= e($profile['role']) ?></p>
  <small><?= e($profile['bio']) ?></small>
  <?php if (!empty($profile['demo_photo'])): ?>
    <span class="muted" style="display:block;margin-top:6px;font-size:11px;">* Foto demo ilustrasi</span>
  <?php endif; ?>
</div>
</article>
<?php endforeach; ?>
</div></div>
</section>

<section id="galeri" class="section section-soft">
<div class="container"><h2 class="reveal">Jejak perjalanan di setiap destinasi</h2><p class="section-intro">Setiap destinasi memiliki kumpulan foto dan cerita yang dikelola melalui halaman admin.</p>
<?php foreach ($destinations as $destination): ?>
<div class="destination-block reveal" id="destinasi-<?= (int)$destination["id"] ?>">
  <div class="destination-heading"><div><h3><?= e($destination["name"]) ?></h3></div><?php if ($destination["visit_date"]): ?><span class="destination-date"><?= e(date('d M Y', strtotime($destination["visit_date"]))) ?></span><?php endif; ?></div>
  <?php if ($destination["description"]): ?><p><?= e($destination["description"]) ?></p><?php endif; ?>
  <div class="gallery-grid">
  <?php $hasPhotos=false; foreach ($gallery as $item): if ((int)$item["destination_id"] === (int)$destination["id"]): $hasPhotos=true; ?>
    <figure class="gallery-card reveal"><img src="<?= url($item["photo"]) ?>" alt="<?= e($item["title"]) ?>" loading="lazy" decoding="async"><figcaption><strong><?= e($item["title"]) ?></strong><span><?= e($item["location"]) ?></span></figcaption></figure>
  <?php endif; endforeach; ?>
  <?php if (!$hasPhotos): ?><div class="empty">Belum ada foto untuk destinasi ini.</div><?php endif; ?>
  </div>
</div>
<?php endforeach; ?>
<?php $unassigned = array_filter($gallery, fn($item) => empty($item['destination_id'])); if ($unassigned): ?>
<div class="destination-block reveal"><div class="destination-heading"><h3>Dokumentasi lainnya</h3></div><div class="gallery-grid"><?php foreach ($unassigned as $item): ?><figure class="gallery-card reveal"><img src="<?= url($item['photo']) ?>" alt="<?= e($item['title']) ?>" loading="lazy" decoding="async"><figcaption><strong><?= e($item['title']) ?></strong><span><?= e($item['location']) ?></span></figcaption></figure><?php endforeach; ?></div></div>
<?php endif; ?>
<?php if (!$destinations && !$gallery): ?><div class="empty"><p><strong>Dokumentasi foto menyusul.</strong><br>Foto perjalanan akan diunggah setelah KKL selesai.</p></div><?php endif; ?>
</div></section>

<section class="section">
<div class="container"><h2 class="reveal">Video kenangan</h2>
<div class="video-grid">
<?php foreach ($videos as $video): ?><div class="video-card reveal"><iframe src="<?= e($video['embed_url']) ?>" title="<?= e($video['title']) ?>" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe><h3><?= e($video['title']) ?></h3><p class="video-fallback">Jika video error, klik link ini: <a href="https://www.youtube.com/watch?v=<?= e(rawurlencode(basename((string)parse_url($video['embed_url'], PHP_URL_PATH)))) ?>" target="_blank" rel="noopener">Tonton di YouTube</a></p></div><?php endforeach; ?>
<?php if (!$videos): ?><div class="empty"><p>Belum ada video YouTube. Tambahkan melalui admin.</p></div><?php endif; ?>
</div></div>
</section>

<section id="feedback" class="section section-soft">
<div class="container feedback-layout"><div><h2 class="reveal">Bagaimana perjalananmu?</h2><p>Tuliskan kesan, pesan, atau momen favoritmu selama KKL.</p></div>
<form class="feedback-form" action="<?= url('submit_feedback.php') ?>" method="post">
<?= csrf_field() ?>
<?php if (!empty($_GET['feedback_sent'])): ?><div class="alert" style="color:green">Terima kasih, feedback kamu sudah terkirim dan menunggu moderasi.</div><?php endif; ?>
<?php if (!empty($_GET['feedback_error'])): ?><div class="alert">Nama (max 100), rating 1-5, dan cerita (max 1000) wajib valid.</div><?php endif; ?>
<label>Nama<input name="name" required maxlength="100" placeholder="Nama kamu"></label>
<label>Rating<select name="rating" required><option value="">Pilih rating</option><option value="5">5 — Sangat berkesan</option><option value="4">4 — Berkesan</option><option value="3">3 — Cukup</option><option value="2">2 — Kurang</option><option value="1">1 — Perlu ditingkatkan</option></select></label>
<label>Cerita / feedback<textarea name="message" required maxlength="1000" rows="5" placeholder="Ceritakan pengalamanmu..."></textarea></label>
<button class="btn btn-primary" type="submit">Kirim Feedback</button>
</form></div>
<div class="container feedback-list"><h3>Suara dari perjalanan</h3><?php foreach ($feedbacks as $fb): ?><div class="feedback-card reveal"><div><strong><?= e($fb['name']) ?></strong><span class="stars"><?= str_repeat('<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>', (int)$fb['rating']) . str_repeat('<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>', 5-(int)$fb['rating']) ?></span></div><p><?= e($fb['message']) ?></p></div><?php endforeach; ?></div>
</section>

<footer class="footer">
  <div class="container footer-inner">
    <div><strong>KKL Informatika UPGRIS 2026</strong><p>Perjalanan, pengalaman, dan kenangan dalam satu cerita.</p><p class="small">Dibuat oleh Kelompok 11 — Program Studi Informatika UPGRIS.</p></div>
    <div>© 2026 Informatika UPGRIS</div>
  </div>
</footer>
<script defer src="<?= url('assets/js/main.js') ?>?v=4"></script>
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Event",
  "name": "<?= e($siteTitle) ?>",
  "startDate": "2026-08-18",
  "endDate": "2026-08-22",
  "location": { "@type": "Place", "name": "Bali, Indonesia" },
  "description": "Dokumentasi perjalanan Kuliah Kerja Lapangan Program Studi Informatika UPGRIS 2026",
  "url": "<?= url('/') ?>"
}
</script>
</body>
</html>
