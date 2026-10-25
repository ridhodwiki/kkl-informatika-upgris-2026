<?php $title = $id ? 'Edit Foto' : 'Tambah Foto'; require __DIR__ . '/../partials/admin_header.php'; ?>
<form class="form-card" method="post" action="<?= e(url('admin/gallery_form.php')) ?><?= $id ? '?id=' . (int)$id : '' ?>" enctype="multipart/form-data"><?= csrf_field() ?>
<h1><?= $id ? 'Edit Foto Dokumentasi' : 'Tambah Foto Dokumentasi' ?></h1>
<?php if (isset($error) && $error): ?><div class="alert"><?= e($error) ?></div><?php endif; ?>
<label>Destinasi<select name="destination_id"><option value="">Tanpa destinasi</option><?php foreach ($destinations as $d): ?><option value="<?= (int)$d['id'] ?>" <?= (string)$item['destination_id'] === (string)$d['id'] ? 'selected' : '' ?>><?= e($d['name']) ?></option><?php endforeach; ?></select></label>
<label>Nama / judul foto<input name="title" required value="<?= e($item['title']) ?>"></label>
<label>Lokasi tambahan<input name="location" value="<?= e($item['location']) ?>" placeholder="Contoh: Pantai Kuta, Bali"></label>
<?php if ($id && !empty($item['photo'])): ?><img class="form-preview" src="<?= e(url($item['photo'])) ?>" alt="Foto saat ini"><?php endif; ?>
<label><?= $id ? 'Ganti foto (opsional)' : 'Foto' ?><input type="file" name="photo" accept="image/*" <?= $id ? '' : 'required' ?>></label>
<button class="btn btn-primary"><?= $id ? 'Simpan Perubahan' : 'Upload Foto' ?></button> <a href="<?= e(url('admin/dashboard.php')) ?>">Batal</a>
</form>
<?php require __DIR__ . '/../partials/admin_footer.php'; ?>
