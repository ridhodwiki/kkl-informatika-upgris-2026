<?php $title = ($id ? 'Edit' : 'Tambah') . ' Destinasi'; require __DIR__ . '/../partials/admin_header.php'; ?>
<form class="form-card" method="post" action="<?= e(url('admin/destination_form.php')) ?><?= $id ? '?id=' . (int)$id : '' ?>"><?= csrf_field() ?>
<h1><?= $id ? 'Edit' : 'Tambah' ?> Destinasi</h1>
<?php if (isset($error) && $error): ?><div class="alert"><?= e($error) ?></div><?php endif; ?>
<label>Hari ke-<input type="number" name="day_no" min="1" required value="<?= e($item['day_no']) ?>"></label>
<label>Urutan destinasi<input type="number" name="sort_order" min="1" required value="<?= e($item['sort_order']) ?>"></label>
<label>Rute perjalanan<input name="route" maxlength="255" placeholder="Contoh: Semarang â†’ Gilimanuk" value="<?= e($item['route']) ?>"></label>
<label>Nama destinasi<input name="name" required maxlength="160" value="<?= e($item['name']) ?>"></label>
<label>Tanggal perjalanan<input type="date" name="visit_date" value="<?= e($item['visit_date']) ?>"></label>
<label>Deskripsi<textarea name="description" rows="5"><?= e($item['description']) ?></textarea></label>
<button class="btn btn-primary">Simpan</button> <a href="<?= e(url('admin/dashboard.php')) ?>">Batal</a>
</form>
<?php require __DIR__ . '/../partials/admin_footer.php'; ?>
