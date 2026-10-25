<?php $title = 'Tambah Video'; require __DIR__ . '/../partials/admin_header.php'; ?>
<form class="form-card" method="post" action="<?= e(url('admin/video_form.php')) ?>"><?= csrf_field() ?>
<h1>Tambah Video YouTube</h1>
<?php if (isset($error) && $error): ?><div class="alert"><?= e($error) ?></div><?php endif; ?>
<label>Judul<input name="title" required maxlength="160"></label>
<label>Link YouTube<input name="url" placeholder="https://www.youtube.com/watch?v=..." required></label>
<button class="btn btn-primary">Simpan</button> <a href="<?= e(url('admin/dashboard.php')) ?>">Batal</a>
</form>
<?php require __DIR__ . '/../partials/admin_footer.php'; ?>
