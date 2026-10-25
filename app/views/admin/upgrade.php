<?php $title = 'Upgrade Database'; require __DIR__ . '/../partials/admin_header.php'; ?>
<div class="form-card">
<h1>Upgrade Database</h1>
<form method="post" action="<?= e(url('admin/upgrade.php')) ?>"><?= csrf_field() ?><button class="btn btn-primary" type="submit">Jalankan upgrade database</button></form>
<p><a href="<?= e(url('admin/dashboard.php')) ?>">Kembali ke dashboard</a></p>
</div>
<?php require __DIR__ . '/../partials/admin_footer.php'; ?>
