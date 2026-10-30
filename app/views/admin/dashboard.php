<?php $title = e($siteTitle ?? 'Dashboard Admin') . ' — Admin'; require __DIR__ . '/../partials/admin_header.php'; ?>
<div class="admin-shell"><div class="admin-top"><h1>Dashboard KKL</h1><div><a class="btn btn-ghost" href="<?= e(url('/')) ?>">Lihat Website</a> <a class="btn btn-primary" href="<?= e(url('admin/logout.php')) ?>">Keluar</a></div></div>
<div class="admin-grid">
<section class="admin-panel"><h2>Logo &amp; Judul Website</h2>
<?php if (!empty($settingsError)): ?><div class="alert"><?= e($settingsError) ?></div><?php endif; ?>
<form action="<?= e(url('admin/save_settings.php')) ?>" method="post" enctype="multipart/form-data"><?= csrf_field() ?>
<label>Judul<input name="site_title" value="<?= e($siteTitle) ?>"></label>
<label>Upload logo<input type="file" name="logo" accept="image/*"></label>
<button class="btn btn-primary">Simpan Pengaturan</button>
</form></section>

<section class="admin-panel"><h2>12 Profil Pembuat</h2><a class="btn btn-primary" href="<?= e(url('admin/profile_form.php')) ?>">Tambah / Kelola Profil</a>
<div class="admin-list"><?php foreach ($profiles as $p): ?><div>
<img src="<?= e(url($p['photo'])) ?>"><span><?= e($p['name']) ?><small><?= e($p['role']) ?></small></span>
<a href="<?= e(url('admin/profile_form.php')) ?>?id=<?= (int)$p['id'] ?>">Edit</a>
</div><?php endforeach; ?></div></section>

<section class="admin-panel"><h2>Destinasi Perjalanan</h2><a class="btn btn-primary" href="<?= e(url('admin/destination_form.php')) ?>">Tambah Destinasi</a>
<div class="admin-list"><?php foreach ($destinations as $d): ?><div>
<span><?= e($d['name']) ?><small>Hari <?= e($d['day_no']) ?> • Urutan <?= e($d['sort_order']) ?> • <?= e($d['route']) ?></small></span>
<a href="<?= e(url('admin/destination_form.php')) ?>?id=<?= (int)$d['id'] ?>">Edit</a>
</div><?php endforeach; ?></div></section>

<section class="admin-panel"><h2>Dokumentasi Foto</h2><a class="btn btn-primary" href="<?= e(url('admin/gallery_form.php')) ?>">Tambah Foto</a>
<div class="admin-list"><?php foreach ($gallery as $g): ?><div>
<img src="<?= e(url($g['photo'])) ?>"><span><?= e($g['title']) ?><small><?= e($g['destination_name'] ?: $g['location']) ?></small></span>
<a href="<?= e(url('admin/gallery_form.php')) ?>?id=<?= (int)$g['id'] ?>">Edit</a>
<form method="post" action="<?= e(url('admin/delete.php')) ?>" style="display:inline" onsubmit="return confirm('Hapus foto?')"><?= csrf_field() ?><input type="hidden" name="type" value="gallery"><input type="hidden" name="id" value="<?= (int)$g['id'] ?>"><button class="btn btn-ghost" type="submit">Hapus</button></form>
</div><?php endforeach; ?></div></section>

<section class="admin-panel"><h2>Video YouTube</h2><a class="btn btn-primary" href="<?= e(url('admin/video_form.php')) ?>">Tambah Video</a>
<div class="admin-list"><?php foreach ($videos as $v): ?><div>
<span><?= e($v['title']) ?></span>
<form method="post" action="<?= e(url('admin/delete.php')) ?>" style="display:inline" onsubmit="return confirm('Hapus video?')"><?= csrf_field() ?><input type="hidden" name="type" value="videos"><input type="hidden" name="id" value="<?= (int)$v['id'] ?>"><button class="btn btn-ghost" type="submit">Hapus</button></form>
</div><?php endforeach; ?></div></section>

<section class="admin-panel"><h2>Moderasi Feedback</h2>
<?php foreach ($feedbacks as $f): ?><div class="feedback-admin">
<strong><?= e($f['name']) ?> — <?= (int)$f['rating'] ?>/5</strong><p><?= e($f['message']) ?></p>
<?php if (!$f['approved']): ?><form method="post" action="<?= e(url('admin/approve_feedback.php')) ?>" style="display:inline"><?= csrf_field() ?><input type="hidden" name="id" value="<?= (int)$f['id'] ?>"><button class="btn btn-primary" type="submit">Setujui</button></form><?php endif; ?>
<form method="post" action="<?= e(url('admin/delete.php')) ?>" style="display:inline" onsubmit="return confirm('Hapus feedback?')"><?= csrf_field() ?><input type="hidden" name="type" value="feedback"><input type="hidden" name="id" value="<?= (int)$f['id'] ?>"><button class="btn btn-ghost" type="submit">Hapus</button></form>
</div><?php endforeach; ?></section>

<section class="admin-panel"><h2>Upgrade Struktur Database</h2><p>Menambah kolom destinasi dan galeri bila belum ada. Data lama tetap utuh.</p>
<form method="post" action="<?= e(url('admin/upgrade.php')) ?>"><?= csrf_field() ?><button class="btn btn-primary" type="submit">Jalankan upgrade database</button></form></section>
</div></div>
<?php require __DIR__ . '/../partials/admin_footer.php'; ?>
