<?php
/**
 * Export live database content into the static Vercel build.
 *
 * Usage (from project root):
 *   php tools/export-static.php
 *
 * Reads MySQL via config/config.php, then rewrites the blocks between
 * <!-- EXPORT:<name>:start --> and <!-- EXPORT:<name>:end --> in
 * static/index.html. Referenced upload files are copied into static/uploads/.
 */

declare(strict_types=1);

$root = dirname(__DIR__);
$configPath = $root . '/config/config.php';
if (!is_file($configPath)) {
    fwrite(STDERR, "Missing config/config.php\n");
    exit(1);
}

$config = require $configPath;
$db = $config['db'];

$pdo = new PDO(
    sprintf('mysql:host=%s;dbname=%s;charset=utf8mb4', $db['host'], $db['name']),
    $db['user'],
    $db['pass'],
    [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC]
);

function e(?string $value): string
{
    return htmlspecialchars((string) $value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

function youtubeWatchUrl(string $embedUrl): string
{
    $path = parse_url($embedUrl, PHP_URL_PATH) ?: '';
    return 'https://www.youtube.com/watch?v=' . rawurlencode(basename($path));
}

// ─── Data ────────────────────────────────────────────────────────────────────
$gallery = $pdo->query(
    'SELECT g.id, g.title, g.location, g.photo, g.created_at,
            d.name AS destination_name, d.address, d.place_description,
            d.day_no, d.sort_order
     FROM gallery g
     LEFT JOIN destinations d ON d.id = g.destination_id
     ORDER BY COALESCE(d.day_no, 2147483647), COALESCE(d.sort_order, 2147483647), g.created_at, g.id'
)->fetchAll();

$profiles = $pdo->query('SELECT name, role, bio, photo FROM profiles ORDER BY sort_order, id')->fetchAll();
$videos = $pdo->query('SELECT title, embed_url FROM videos ORDER BY id')->fetchAll();
$feedbacks = $pdo->query('SELECT name, rating, message FROM feedback WHERE approved = 1 ORDER BY created_at DESC, id DESC')->fetchAll();

// ─── Blocks ──────────────────────────────────────────────────────────────────
$galleryHtml = '<div class="empty"><p><strong>Dokumentasi foto akan hadir segera.</strong><br>Foto perjalanan akan diunggah setelah KKL selesai.</p></div>';
if ($gallery) {
    $cards = '';
    foreach ($gallery as $item) {
        $destinationName = $item['destination_name'] ?: 'Dokumentasi lainnya';
        $address = $item['address'] ?: $item['location'];
        $cards .= '<figure class="gallery-card"><img src="' . e($item['photo']) . '" alt="' . e($item['title']) . '" loading="lazy" decoding="async"><figcaption><strong>' . e($item['title']) . '</strong><span>' . e($destinationName) . '</span>';
        if ($address) {
            $cards .= '<small>' . e($address) . '</small>';
        }
        if (!empty($item['place_description'])) {
            $cards .= '<p>' . e($item['place_description']) . '</p>';
        }
        $cards .= '</figcaption></figure>';
    }
    $galleryHtml = '<div class="gallery-rail-wrap gallery-rail-global">'
        . '<button class="gallery-rail-button gallery-rail-prev" type="button" aria-label="Foto sebelumnya">&#8249;</button>'
        . '<div class="gallery-rail" tabindex="0" aria-label="Galeri foto perjalanan">'
        . $cards
        . '</div>'
        . '<button class="gallery-rail-button gallery-rail-next" type="button" aria-label="Foto berikutnya">&#8250;</button>'
        . '</div>';
}

$profilesHtml = '';
foreach ($profiles as $profile) {
    $photo = $profile['photo'] ?: 'assets/img/profile-placeholder.svg';
    $profilesHtml .= '<article class="profile-card reveal">'
        . '<img src="' . e($photo) . '" alt="' . e($profile['name']) . '" loading="lazy" decoding="async">'
        . '<div class="profile-info"><h3>' . e($profile['name']) . '</h3>'
        . '<p>' . e($profile['role']) . '</p>'
        . ($profile['bio'] ? '<small>' . e($profile['bio']) . '</small>' : '')
        . '</div></article>' . "\n";
}
if ($profilesHtml === '') {
    $profilesHtml = '<div class="empty"><p>Belum ada profil.</p></div>';
}

$videoHtml = '';
foreach ($videos as $video) {
    $videoHtml .= '<div class="video-card reveal">'
        . '<iframe src="' . e($video['embed_url']) . '" title="' . e($video['title']) . '" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>'
        . '<h3>' . e($video['title']) . '</h3>'
        . '<p class="video-fallback">Jika video error, klik link ini: <a href="' . e(youtubeWatchUrl($video['embed_url'])) . '" target="_blank" rel="noopener">Tonton di YouTube</a></p>'
        . '</div>';
}
if ($videoHtml === '') {
    $videoHtml = '<div class="empty"><p><strong>Video kenangan segera hadir.</strong><br>Rekaman perjalanan KKL akan ditampilkan di sini.</p></div>';
}

$starFull = '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>';
$starEmpty = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>';
$feedbackHtml = '';
foreach ($feedbacks as $fb) {
    $rating = max(0, min(5, (int) $fb['rating']));
    $feedbackHtml .= '<div class="feedback-card reveal"><div><strong>' . e($fb['name']) . '</strong>'
        . '<span class="stars">' . str_repeat($starFull, $rating) . str_repeat($starEmpty, 5 - $rating) . '</span>'
        . '</div><p>' . e($fb['message']) . '</p></div>';
}
if ($feedbackHtml === '') {
    $feedbackHtml = '<div class="empty"><p>Kesan peserta akan ditampilkan setelah dipublikasikan oleh admin.</p></div>';
}

// ─── Write static/index.html ─────────────────────────────────────────────────
$indexPath = $root . '/static/index.html';
$html = file_get_contents($indexPath);
if ($html === false) {
    fwrite(STDERR, "Cannot read static/index.html\n");
    exit(1);
}

$blocks = [
    'gallery' => $galleryHtml,
    'profiles' => $profilesHtml,
    'video' => $videoHtml,
    'feedback' => $feedbackHtml,
];

foreach ($blocks as $name => $markup) {
    $pattern = '/(<!-- EXPORT:' . $name . ':start -->)(.*?)(<!-- EXPORT:' . $name . ':end -->)/s';
    $replaced = preg_replace_callback(
        $pattern,
        static fn(array $m): string => $m[1] . "\n" . $markup . "\n" . $m[3],
        $html,
        1,
        $count
    );
    if ($count !== 1) {
        fwrite(STDERR, "Marker EXPORT:$name not found in static/index.html\n");
        exit(1);
    }
    $html = $replaced;
}

file_put_contents($indexPath, $html);

// ─── Copy referenced uploads ─────────────────────────────────────────────────
$copied = 0;
$missing = [];
$sources = array_merge(
    array_column($gallery, 'photo'),
    array_filter(array_column($profiles, 'photo'))
);
foreach (array_unique($sources) as $relative) {
    // Only plain uploads/<dir>/<file> paths; blocks ../ traversal out of uploads.
    if (!preg_match('#^uploads/(gallery|profiles)/[A-Za-z0-9._-]+$#', $relative) || str_contains($relative, '..')) {
        continue;
    }
    $from = $root . '/public/' . $relative;
    $to = $root . '/static/' . $relative;
    if (!is_file($from)) {
        $missing[] = $relative;
        continue;
    }
    if (!is_dir(dirname($to))) {
        mkdir(dirname($to), 0777, true);
    }
    if (!is_file($to) || filesize($from) !== filesize($to) || filemtime($from) > filemtime($to)) {
        copy($from, $to);
        $copied++;
    }
}

printf(
    "Exported: %d galeri, %d profil, %d video, %d feedback. Upload disalin: %d.\n",
    count($gallery),
    count($profiles),
    count($videos),
    count($feedbacks),
    $copied
);
if ($missing) {
    fwrite(STDERR, "File tidak ditemukan di public/: " . implode(', ', $missing) . "\n");
}
