<?php

class AdminController
{
    private $pdo;

    public function __construct()
    {
        $this->pdo = Database::connection();
    }

    private function removeUploadedFile($relativePath)
    {
        $relativePath = (string)$relativePath;
        if (!preg_match('#^uploads/(?:gallery/gallery_|profiles/profile_|branding/logo_)[A-Za-z0-9._-]+$#', $relativePath) || strpos($relativePath, '..') !== false) {
            return;
        }
        $fullPath = __DIR__ . '/../../public/' . $relativePath;
        if (is_file($fullPath)) {
            @unlink($fullPath);
        }
    }

    public function login()
    {
        if (AdminModel::find((int)($_SESSION['admin_id'] ?? 0))) {
            redirect('admin/dashboard.php');
        }
        $error = null;
        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            csrf_verify();
            $now = time();
            $attempts = $_SESSION['login_attempts'] ?? [];
            $attempts = array_values(array_filter((array)$attempts, static fn($ts) => is_int($ts) && ($now - $ts) < 300));
            if (count($attempts) >= 5) {
                $error = 'Terlalu banyak percobaan gagal. Silakan tunggu 5 menit.';
            } else {
                $username = trim((string)($_POST['username'] ?? ''));
                $admin = AdminModel::findByUsername($username);
                if ($admin && password_verify((string)($_POST['password'] ?? ''), $admin['password'])) {
                    unset($_SESSION['login_attempts']);
                    Auth::login($admin);
                    redirect('admin/dashboard.php');
                }
                $attempts[] = $now;
                $_SESSION['login_attempts'] = $attempts;
                $error = 'Username atau password salah.';
            }
        }
        view('admin/login', compact('error'));
    }

    public function logout()
    {
        Auth::logout();
    }

    public function dashboard()
    {
        require_auth();
        $profiles = ProfileModel::all();
        $gallery = GalleryModel::all();
        $destinations = DestinationModel::all();
        $videos = VideoModel::all();
        $feedbacks = FeedbackModel::all();
        $logo = SettingModel::get('logo', '');
        $siteTitle = SettingModel::get('site_title', 'KKL Informatika UPGRIS 2026');
        $settingsError = $_SESSION['settings_error'] ?? null;
        unset($_SESSION['settings_error']);
        view('admin/dashboard', compact('profiles', 'gallery', 'destinations', 'videos', 'feedbacks', 'logo', 'siteTitle', 'settingsError'));
    }

    public function profileForm()
    {
        require_auth();
        $id = (int)($_GET['id'] ?? 0);
        $profile = ['name' => '', 'role' => '', 'bio' => '', 'photo' => '', 'sort_order' => 0];
        if ($id) {
            $profile = ProfileModel::find($id) ?: $profile;
        }
        $error = null;
        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            csrf_verify();
            $name = trim((string)($_POST['name'] ?? ''));
            $role = trim((string)($_POST['role'] ?? ''));
            $bio = trim((string)($_POST['bio'] ?? ''));
            $sort = (int)($_POST['sort_order'] ?? 0);
            if (!valid_text($name, 120)) {
                $error = 'Nama wajib diisi (max 120 karakter).';
            } elseif (mb_strlen($role, 'UTF-8') > 120) {
                $error = 'Peran max 120 karakter.';
            } elseif (mb_strlen($bio, 'UTF-8') > 500) {
                $error = 'Bio max 500 karakter.';
            } else {
                [$new, $uploadError] = upload_image($_FILES['photo'] ?? null, 'profiles', 'profile_');
                if ($uploadError) {
                    $error = $uploadError;
                } else {
                    $photo = $profile['photo'];
                    if ($new) {
                        if ($photo && $photo !== $new) {
                            $this->removeUploadedFile($photo);
                        }
                        $photo = $new;
                    }
                    if ($photo === '') {
                        $photo = 'uploads/profiles/profile-placeholder.svg';
                    }
                    ProfileModel::save($id, $name, $role, $bio, $photo, $sort);
                    redirect('admin/dashboard.php');
                }
            }
        }
        view('admin/profile_form', compact('id', 'profile', 'error'));
    }

    public function destinationForm()
    {
        require_auth();
        $id = (int)($_GET['id'] ?? 0);
        $item = ['name' => '', 'visit_date' => '', 'description' => '', 'place_description' => '', 'address' => '', 'maps_url' => '', 'day_no' => 1, 'route' => '', 'sort_order' => 1];
        if ($id) {
            $item = DestinationModel::find($id) ?: $item;
        }
        $error = null;
        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            csrf_verify();
            $name = trim((string)($_POST['name'] ?? ''));
            $date = trim((string)($_POST['visit_date'] ?? ''));
            if ($date === '') {
                $date = null;
            }
            $desc = trim((string)($_POST['description'] ?? ''));
            $placeDescription = trim((string)($_POST['place_description'] ?? ''));
            $address = trim((string)($_POST['address'] ?? ''));
            $mapsUrl = trim((string)($_POST['maps_url'] ?? ''));
            $route = trim((string)($_POST['route'] ?? ''));
            $day = filter_var($_POST['day_no'] ?? null, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
            $sort = filter_var($_POST['sort_order'] ?? null, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
            if (!valid_text($name, 160)) {
                $error = 'Nama destinasi harus 1-160 karakter.';
            } elseif ($date !== null && !valid_date($date)) {
                $error = 'Tanggal perjalanan tidak valid.';
            } elseif ($day === false) {
                $error = 'Hari ke- harus angka minimal 1.';
            } elseif ($sort === false) {
                $error = 'Urutan destinasi harus angka minimal 1.';
            } elseif (mb_strlen($desc, 'UTF-8') > 5000 || mb_strlen($placeDescription, 'UTF-8') > 5000) {
                $error = 'Deskripsi maksimal 5000 karakter.';
            } elseif (mb_strlen($address, 'UTF-8') > 255) {
                $error = 'Alamat maksimal 255 karakter.';
            } elseif ($mapsUrl !== '' && !valid_maps_url($mapsUrl)) {
                $error = 'URL Google Maps tidak valid.';
            } elseif (mb_strlen($route, 'UTF-8') > 255) {
                $error = 'Rute maksimal 255 karakter.';
            } else {
                DestinationModel::save($id, $name, $date, $desc, $placeDescription, $address, $mapsUrl, $day === false ? 1 : $day, $route, $sort === false ? 1 : $sort);
                redirect('admin/dashboard.php');
            }
        }
        view('admin/destination_form', compact('id', 'item', 'error'));
    }

    public function galleryForm()
    {
        require_auth();
        $id = (int)($_GET['id'] ?? 0);
        $item = ['destination_id' => '', 'title' => '', 'location' => '', 'photo' => ''];
        if ($id) {
            $item = GalleryModel::find($id) ?: $item;
        }
        $destinations = DestinationModel::all();
        $error = null;
        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            csrf_verify();
            $title = trim((string)($_POST['title'] ?? ''));
            $location = trim((string)($_POST['location'] ?? ''));
            $destination = (int)($_POST['destination_id'] ?? 0) ?: null;
            if (!valid_text($title, 160)) {
                $error = 'Judul foto wajib diisi (maksimal 160 karakter).';
            } elseif (mb_strlen($location, 'UTF-8') > 160) {
                $error = 'Lokasi maksimal 160 karakter.';
            } else {
                [$photo, $uploadError] = upload_image($_FILES['photo'] ?? null, 'gallery', 'gallery_');
                if ($uploadError) {
                    $error = $uploadError;
                } elseif ($id) {
                    if ($photo && !empty($item['photo']) && $item['photo'] !== $photo) {
                        $this->removeUploadedFile($item['photo']);
                    }
                    GalleryModel::save($id, $destination, $title, $location, $photo ?: $item['photo']);
                    redirect('admin/dashboard.php');
                } elseif ($photo) {
                    GalleryModel::save(null, $destination, $title, $location, $photo);
                    redirect('admin/dashboard.php');
                } else {
                    $error = 'Foto wajib diunggah.';
                }
            }
        }
        view('admin/gallery_form', compact('id', 'item', 'destinations', 'error'));
    }

    public function videoForm()
    {
        require_auth();
        $error = null;
        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            csrf_verify();
            $title = trim((string)($_POST['title'] ?? ''));
            $url = trim((string)($_POST['url'] ?? ''));
            if (!valid_text($title, 160)) {
                $error = 'Judul video harus 1-160 karakter.';
            } elseif ($url === '') {
                $error = 'Link YouTube wajib diisi.';
            } else {
                preg_match('~(?:youtube\.com/watch\?v=|youtu\.be/)([^&?/]+)~', $url, $m);
                $id = $m[1] ?? '';
                if (!$id) {
                    $error = 'Link YouTube tidak valid.';
                } else {
                    $embed = 'https://www.youtube.com/embed/' . rawurlencode($id);
                    VideoModel::insert($title, $embed);
                    redirect('admin/dashboard.php');
                }
            }
        }
        view('admin/video_form', compact('error'));
    }

    public function saveSettings()
    {
        require_auth();
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            redirect('admin/dashboard.php');
        }
        csrf_verify();
        $title = trim((string)($_POST['site_title'] ?? ''));
        if (!valid_text($title, 160)) {
            $_SESSION['settings_error'] = 'Judul website wajib diisi (maksimal 160 karakter).';
            redirect('admin/dashboard.php');
        }
        SettingModel::set('site_title', $title);
        if (!empty($_FILES['logo']['name'])) {
            [$logo, $uploadError] = upload_image($_FILES['logo'], 'branding', 'logo_');
            if ($uploadError) {
                $_SESSION['settings_error'] = $uploadError;
                redirect('admin/dashboard.php');
            }
            if ($logo) {
                $oldLogo = SettingModel::get('logo', '');
                if ($oldLogo && $oldLogo !== $logo) {
                    $this->removeUploadedFile($oldLogo);
                }
                SettingModel::set('logo', $logo);
            }
        }
        redirect('admin/dashboard.php');
    }

    public function changePassword()
    {
        require_auth(true);
        if (empty($_SESSION['must_change_password'])) {
            redirect('admin/dashboard.php');
        }
        $success = null;
        $error = null;
        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            csrf_verify();
            $stmt = $this->pdo->prepare("SELECT password FROM admins WHERE id=?");
            $stmt->execute([$_SESSION['admin_id']]);
            $admin = $stmt->fetch(PDO::FETCH_ASSOC);
            $current = (string)($_POST['current_password'] ?? '');
            $new = (string)($_POST['new_password'] ?? '');
            $confirm = (string)($_POST['confirm_password'] ?? '');
            if ($current === '' || $new === '' || $confirm === '') {
                $error = 'Password baru wajib diisi.';
            } elseif (!$admin || !password_verify($current, $admin['password'])) {
                $error = 'Password saat ini salah.';
            } elseif ($new !== $confirm) {
                $error = 'Konfirmasi password tidak cocok.';
            } elseif (strlen($new) < 8 || !preg_match('/[A-Za-z]/', $new) || !preg_match('/\d/', $new)) {
                $error = 'Password baru minimal 8 karakter, berisi huruf dan angka.';
            } elseif (password_verify($new, $admin['password'])) {
                $error = 'Password baru tidak boleh sama dengan password lama.';
            } else {
                AdminModel::updatePassword($_SESSION['admin_id'], password_hash($new, PASSWORD_DEFAULT));
                session_regenerate_id(true);
                unset($_SESSION['must_change_password']);
                $success = 'Password berhasil diganti.';
            }
        }
        view('admin/change_password', compact('error', 'success'));
    }

    public function approveFeedback()
    {
        require_auth();
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            redirect('admin/dashboard.php');
        }
        csrf_verify();
        $id = filter_var($_POST['id'] ?? null, FILTER_VALIDATE_INT);
        if ($id !== false && $id > 0) {
            FeedbackModel::approve($id);
        }
        header("Location: " . url('admin/dashboard.php'));
        exit;
    }

    public function delete()
    {
        require_auth();
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            redirect('admin/dashboard.php');
        }
        csrf_verify();
        $type = $_POST['type'] ?? '';
        $id = filter_var($_POST['id'] ?? null, FILTER_VALIDATE_INT);
        $allowed = [
            'gallery' => 'gallery',
            'videos' => 'videos',
            'feedback' => 'feedback',
            'profiles' => 'profiles',
            'destinations' => 'destinations',
        ];
        if (isset($allowed[$type]) && $id !== false && $id > 0) {
            $table = $allowed[$type];
            if ($table === 'gallery') {
                $item = GalleryModel::find($id);
                if (!empty($item['photo'])) {
                    $this->removeUploadedFile($item['photo']);
                }
            } elseif ($table === 'profiles') {
                $item = ProfileModel::find($id);
                if (!empty($item['photo'])) {
                    $this->removeUploadedFile($item['photo']);
                }
            } elseif ($table === 'destinations') {
                $upd = $this->pdo->prepare("UPDATE gallery SET destination_id = NULL WHERE destination_id = ?");
                $upd->execute([$id]);
            }
            $stmt = $this->pdo->prepare("DELETE FROM `$table` WHERE id=?");
            $stmt->execute([$id]);
        }
        header("Location: " . url('admin/dashboard.php'));
        exit;
    }

    public function upgrade()
    {
        require_auth();
        $hash = AdminModel::passwordHash((int)$_SESSION['admin_id']);
        if (!$hash) {
            redirect('admin/login.php');
        }
        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            csrf_verify();
            try {
                $this->pdo->exec("CREATE TABLE IF NOT EXISTS destinations (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(160) NOT NULL, visit_date DATE NULL, description TEXT, day_no INT NOT NULL DEFAULT 1, route VARCHAR(255) NULL, sort_order INT NOT NULL DEFAULT 1, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)");
                foreach ([['day_no', 'INT NOT NULL DEFAULT 1'], ['route', 'VARCHAR(255) NULL'], ['sort_order', 'INT NOT NULL DEFAULT 1'], ['place_description', 'TEXT NULL'], ['address', 'VARCHAR(255) NULL'], ['maps_url', 'VARCHAR(500) NULL']] as $column) {
                    $check = $this->pdo->query("SHOW COLUMNS FROM destinations LIKE " . $this->pdo->quote($column[0]))->fetch();
                    if (!$check) {
                        $this->pdo->exec("ALTER TABLE destinations ADD COLUMN {$column[0]} {$column[1]}");
                    }
                }
                $columns = $this->pdo->query("SHOW COLUMNS FROM gallery LIKE 'destination_id'")->fetch();
                if (!$columns) {
                    $this->pdo->exec("ALTER TABLE gallery ADD COLUMN destination_id INT NULL AFTER id");
                }
            } catch (Throwable $e) {
                http_response_code(500);
                exit('<h2>Upgrade gagal</h2><pre>' . htmlspecialchars($e->getMessage()) . '</pre>');
            }
            exit('<h2>Upgrade berhasil.</h2><p>Struktur destinasi sudah siap, data lama tetap utuh.</p><p><a href="' . e(url('admin/dashboard.php')) . '">Dashboard Admin</a></p>');
        }
        view('admin/upgrade');
    }
}

function require_auth($allowPasswordChange = false)
{
    Auth::requireLogin($allowPasswordChange);
}
