<?php

function e($value)
{
    return htmlspecialchars((string)$value, ENT_QUOTES, 'UTF-8');
}

function base_url()
{
    $script = str_replace('\\', '/', $_SERVER['SCRIPT_NAME'] ?? '/index.php');
    $dir = rtrim(dirname($script), '/');
    if ($dir === '.' || $dir === '/') {
        $dir = '';
    }
    if (basename($dir) !== 'public') {
        $uri = parse_url($_SERVER['REQUEST_URI'] ?? '', PHP_URL_PATH);
        $uri = is_string($uri) ? $uri : '';
        if (preg_match('#^(.*?)/public(?:/index\.php)?(?:/|$)#', $uri, $m) && $m[1] !== '') {
            $dir = $m[1] . '/public';
        } else {
            $dir = $dir . '/public';
        }
    }
    return rtrim($dir, '/');
}

function url($path = '')
{
    $path = (string)$path;
    if (strpos($path, 'assets/uploads/') === 0) {
        $path = 'uploads/' . substr($path, strlen('assets/uploads/'));
    }
    return base_url() . '/' . ltrim($path, '/');
}

function view($name, array $data = [])
{
    extract($data, EXTR_SKIP);
    require __DIR__ . '/../views/' . $name . '.php';
}

function redirect($path)
{
    header('Location: ' . (preg_match('#^https?://#i', $path) ? $path : url($path)));
    exit;
}

function request_route()
{
    $route = $_GET['route'] ?? null;
    if (!is_string($route) || $route === '') {
        $uri = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH);
        $uri = is_string($uri) ? $uri : '/';
        $base = base_url();
        if ($base !== '') {
            if ($uri === $base || $uri === $base . '/') {
                return '/';
            }
            if (strpos($uri, $base . '/') === 0) {
                $route = substr($uri, strlen($base) + 1);
            } else {
                $route = ltrim($uri, '/');
            }
        } else {
            $route = ltrim($uri, '/');
        }
    }
    $route = ltrim($route, '/');
    if (strpos($route, 'index.php') === 0) {
        $route = substr($route, strlen('index.php'));
    }
    $route = ltrim($route, '/');
    return $route === '' ? '/' : '/' . $route;
}

function valid_date($value)
{
    if (!is_string($value) || $value === '') return false;
    $date = DateTime::createFromFormat('!Y-m-d', $value);
    return $date && $date->format('Y-m-d') === $value;
}

function valid_text($value, $max)
{
    return is_string($value) && trim($value) !== '' && mb_strlen(trim($value), 'UTF-8') <= $max;
}

function profile_photos(array $profiles)
{
    $demo = ['andi', 'budi', 'citra', 'dewi', 'eka', 'fajar', 'gita', 'hadi', 'indah', 'joko', 'kartika'];
    $empty = ['', 'assets/img/profile-placeholder.svg', 'uploads/profiles/profile-placeholder.svg'];
    foreach ($profiles as $i => &$profile) {
        $photo = (string)($profile['photo'] ?? '');
        if (in_array($photo, $empty, true)) {
            $photo = 'uploads/profiles/' . $demo[$i % count($demo)] . '.jpg';
            $profile['demo_photo'] = true;
        } else {
            $profile['demo_photo'] = false;
        }
        $profile['photo'] = $photo;
    }
    return $profiles;
}

function upload_image($file, $folder, $prefix = 'img_')
{
    if (!is_array($file) || !isset($file['error']) || $file['error'] === UPLOAD_ERR_NO_FILE) {
        return [null, null];
    }
    if ($file['error'] !== UPLOAD_ERR_OK) {
        return [null, 'Upload gagal (kode ' . (int)$file['error'] . ').'];
    }
    $allowed = ['jpg' => 'image/jpeg', 'jpeg' => 'image/jpeg', 'png' => 'image/png', 'webp' => 'image/webp'];
    $ext = strtolower(pathinfo((string)$file['name'], PATHINFO_EXTENSION));
    if (!isset($allowed[$ext]) || $file['size'] > 3 * 1024 * 1024 || !is_uploaded_file($file['tmp_name'])) {
        return [null, 'File harus gambar JPG/PNG/WebP berukuran maksimal 3 MB.'];
    }
    $finfo = new finfo(FILEINFO_MIME_TYPE);
    if ($finfo->file($file['tmp_name']) !== $allowed[$ext] || @getimagesize($file['tmp_name']) === false) {
        return [null, 'Isi file bukan gambar yang valid.'];
    }
    $dir = __DIR__ . '/../../public/uploads/' . $folder;
    if (!is_dir($dir) && !mkdir($dir, 0755, true)) {
        return [null, 'Folder upload tidak dapat dibuat.'];
    }
    if (!file_exists($dir . '/.htaccess')) {
        @file_put_contents($dir . '/.htaccess', "<IfModule mod_php.c>\nphp_flag engine off\n</IfModule>\nOptions -Indexes\n<FilesMatch \"\\.(php|phtml|php3|php4|php5|php6|cgi|pl|py|pyc|pyo|phar|sh)$\">\nRequire all denied\n</FilesMatch>\n");
    }
    $name = $prefix . time() . '_' . bin2hex(random_bytes(4)) . '.' . $ext;
    if (move_uploaded_file($file['tmp_name'], $dir . '/' . $name)) {
        return ["uploads/$folder/$name", null];
    }
    return [null, 'File gagal disimpan.'];
}
