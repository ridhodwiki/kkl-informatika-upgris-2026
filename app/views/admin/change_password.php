<?php $title = 'Ganti Password'; require __DIR__ . '/../partials/admin_header.php'; ?>
<form class="form-card" method="post" action="<?= e(url('admin/change_password.php')) ?>"><?= csrf_field() ?>
<h1>Ganti Password</h1>
<?php if (!empty($error)): ?><div class="alert"><?= e($error) ?></div><?php endif; ?>
<?php if (!empty($success)): ?><div class="alert" style="color:green"><?= e($success) ?> <a href="<?= e(url('admin/dashboard.php')) ?>">Lanjut ke dashboard</a></div><?php endif; ?>
<?php if (empty($success)): ?>
<label>Password saat ini<input type="password" name="current_password" required></label>
<label>Password baru (min. 8, huruf + angka)<input type="password" name="new_password" required minlength="8"></label>
<label>Konfirmasi password baru<input type="password" name="confirm_password" required minlength="8"></label>
<button class="btn btn-primary" type="submit">Simpan Password</button> <a href="<?= e(url('admin/logout.php')) ?>" onclick="event.preventDefault();document.getElementById('logout-form').submit();">Keluar</a>
<form id="logout-form" method="post" action="<?= e(url('admin/logout.php')) ?>" style="display:none"><?= csrf_field() ?></form>
<?php endif; ?>
</form>
<?php require __DIR__ . '/../partials/admin_footer.php'; ?>
