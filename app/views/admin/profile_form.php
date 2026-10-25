<?php $title = ($id ? 'Edit' : 'Tambah') . ' Profil'; require __DIR__ . '/../partials/admin_header.php'; ?>
<form class="form-card" method="post" action="<?= e(url('admin/profile_form.php')) ?><?= $id ? '?id=' . (int)$id : '' ?>" enctype="multipart/form-data"><?= csrf_field() ?>
<h1><?= $id ? 'Edit' : 'Tambah' ?> Profil</h1>
<?php if (!empty($error)): ?><div class="alert"><?= e($error) ?></div><?php endif; ?>
<label>Nama<input name="name" required value="<?= e($profile['name']) ?>"></label>
<label>Peran / Keterangan<input name="role" value="<?= e($profile['role']) ?>"></label>
<label>Bio<textarea name="bio"><?= e($profile['bio']) ?></textarea></label>
<label>Urutan<input type="number" name="sort_order" value="<?= e($profile['sort_order']) ?>"></label>
<?php if (!empty($profile['photo'])): ?><img class="form-preview" src="<?= e(url($profile['photo'])) ?>" alt="Foto saat ini"><?php endif; ?>
<label>Foto<input type="file" name="photo" accept="image/*"></label>
<button class="btn btn-primary">Simpan</button> <a href="<?= e(url('admin/dashboard.php')) ?>">Batal</a>
</form>
<?php require __DIR__ . '/../partials/admin_footer.php'; ?>
