<?php $title = 'Login Admin'; require __DIR__ . '/../partials/admin_header.php'; ?>
<form class="login-card" method="post" action="<?= e(url('admin/login.php')) ?>"><h1>Admin KKL</h1><p>Masuk untuk mengelola website.</p>
<?php if (!empty($error)): ?><div class="alert"><?= e($error) ?></div><?php endif; ?>
<?= csrf_field() ?>
<label>Username<input name="username" required></label>
<label>Password<input type="password" name="password" required></label>
<button class="btn btn-primary" type="submit">Masuk</button>
<a href="<?= e(url('/')) ?>">&larr; Kembali ke website</a>
</form>
<?php require __DIR__ . '/../partials/admin_footer.php'; ?>
