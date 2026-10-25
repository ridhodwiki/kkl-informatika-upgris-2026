<?php
declare(strict_types=1);
error_reporting(E_ALL);
ini_set('display_errors', '0');
require __DIR__ . '/../app/core/csrf.php';
require __DIR__ . '/../app/core/helpers.php';
require __DIR__ . '/../app/core/Database.php';
require __DIR__ . '/../app/core/Auth.php';
require __DIR__ . '/../app/core/Router.php';
require __DIR__ . '/../app/models/ProfileModel.php';
require __DIR__ . '/../app/models/DestinationModel.php';
require __DIR__ . '/../app/models/GalleryModel.php';
require __DIR__ . '/../app/models/VideoModel.php';
require __DIR__ . '/../app/models/FeedbackModel.php';
require __DIR__ . '/../app/models/SettingModel.php';
require __DIR__ . '/../app/models/AdminModel.php';
require __DIR__ . '/../app/controllers/HomeController.php';
require __DIR__ . '/../app/controllers/AdminController.php';

$fails = [];
function check($condition, $message)
{
    global $fails;
    if (!$condition) $fails[] = $message;
}

$_SERVER['REQUEST_METHOD'] = 'POST';
check(is_string(csrf_token()), 'csrf token is scalar string');
check(csrf_valid('POST', csrf_token()), 'csrf_valid POST true');
check(!csrf_valid('GET', csrf_token()), 'csrf_valid GET false');
check(!csrf_valid('POST', null), 'csrf_valid null false');
check(!csrf_valid('POST', 123), 'csrf_valid int false');
check(!csrf_valid('POST', str_repeat('x', 64)), 'csrf_valid wrong token false');

check(valid_date('2026-08-18'), 'valid_date true');
check(!valid_date('2026-13-01'), 'valid_date month 13 false');
check(!valid_date('2026-02-30'), 'valid_date day 30 false');
check(!valid_date('not-a-date'), 'valid_date garbage false');
check(valid_maps_url('https://www.google.com/maps/place/Bali'), 'valid_maps_url Google Maps');
check(valid_maps_url('https://maps.app.goo.gl/example'), 'valid_maps_url short Google Maps');
check(!valid_maps_url('http://www.google.com/maps/place/Bali'), 'valid_maps_url requires HTTPS');
check(!valid_maps_url('https://example.com/maps'), 'valid_maps_url host allowlist');

check(valid_text('abc', 3), 'valid_text at max');
check(!valid_text('abcd', 3), 'valid_text over max');
check(!valid_text('', 3), 'valid_text empty false');
check(!valid_text(123, 3), 'valid_text non-string false');

$_SERVER['SCRIPT_NAME'] = '/kkl-informatika-upgris-2026/public/index.php';
$_SERVER['REQUEST_URI'] = '/kkl-informatika-upgris-2026/public/';
check(base_url() === '/kkl-informatika-upgris-2026/public', 'base_url subdir public');
check(request_route() === '/', 'request_route directory root');
check(url('assets/css/style.css') === '/kkl-informatika-upgris-2026/public/assets/css/style.css', 'url assets subdirectory');
check(url('uploads/profiles/andi.jpg') === '/kkl-informatika-upgris-2026/public/uploads/profiles/andi.jpg', 'url uploads path');

$_SERVER['SCRIPT_NAME'] = '/public/index.php';
$_SERVER['REQUEST_URI'] = '/public/admin/login.php';
check(base_url() === '/public', 'base_url direct public');
check(request_route() === '/admin/login.php', 'request_route direct public');
check(url('/') === '/public/', 'url root direct public');

$_SERVER['SCRIPT_NAME'] = '/kkl-informatika-upgris-2026/public/index.php';
$_SERVER['REQUEST_URI'] = '/kkl-informatika-upgris-2026/public/admin/login.php';
$_GET['route'] = 'admin/login.php';
check(request_route() === '/admin/login.php', 'request_route query param wins');
unset($_GET['route']);

$router = new Router();
$router->add('GET', '/', function () { return 'home'; });
$router->add('GET', '/admin/login.php', function (array $params = []) { return 'login-show'; });
$router->add('POST', '/admin/login.php', function (array $params = []) { return 'login-post'; });
$router->add('POST', '/submit_feedback.php', function (array $params = []) { return 'feedback'; });

check($router->dispatch('GET', '/')[1] === 'home', 'router root dispatch');
check($router->dispatch('GET', '/admin/login.php')[1] === 'login-show', 'router GET login');
check($router->dispatch('POST', '/admin/login.php')[1] === 'login-post', 'router POST login');
check($router->dispatch('POST', '/submit_feedback.php')[1] === 'feedback', 'router POST feedback');
check($router->dispatch('GET', '/submit_feedback.php')[0] === false, 'router GET feedback not routed');
check($router->dispatch('GET', '/admin/nothing.php')[0] === false, 'router unknown 404');
check($router->dispatch('POST', '/admin/login.php?x=1')[0] === false, 'router query not in path');

$expected = '/kkl-informatika-upgris-2026/public/uploads/profiles/p.jpg';
check(url('assets/uploads/profiles/p.jpg') === $expected, 'legacy assets/uploads maps to uploads/');
check(url('uploads/profiles/p.jpg') === $expected, 'new uploads path direct');

$settings = [];
$destinations = $gallery = $profiles = $feedbacks = [];
foreach (['', '?start=30&rel=0', '#fragment'] as $suffix) {
    $videos = [['title' => 'Video test', 'embed_url' => 'https://www.youtube.com/embed/0NBy-j71XWo' . $suffix]];
    ob_start();
    require __DIR__ . '/../app/views/home.php';
    $html = ob_get_clean();
    check(strpos($html, 'href="https://www.youtube.com/watch?v=0NBy-j71XWo"') !== false, 'fallback watch URL excludes query and fragment: ' . $suffix);
    check(strpos($html, 'Jika video error, klik link ini') !== false, 'fallback text remains visible');
    check(strpos($html, 'src="' . e($videos[0]['embed_url']) . '"') !== false, 'embed URL remains unchanged');
}
$videos = [];
$destinations = [
    ['id' => 1, 'name' => 'With photo & escaped description <script>alert(1)</script>', 'day_no' => 1, 'visit_date' => '', 'description' => 'Timeline rundown text', 'place_description' => 'Place desc & safe', 'address' => 'Semarang', 'maps_url' => '', 'route' => ''],
    ['id' => 2, 'name' => 'No photo destination', 'day_no' => 1, 'visit_date' => '', 'description' => 'Timeline only text', 'place_description' => '', 'address' => '', 'maps_url' => '', 'route' => '']
];
$gallery = [['destination_id' => 1, 'photo' => 'uploads/gallery/test.webp', 'title' => 'Test photo', 'location' => 'Semarang']];
ob_start(); require __DIR__ . '/../app/views/home.php'; $html = ob_get_clean();

check(strpos($html, 'Timeline rundown text') !== false, 'timeline renders description');
check(strpos($html, 'Timeline only text') !== false, 'no-photo destination appears in timeline');
check(strpos($html, 'No photo destination') !== false, 'no-photo destination title appears in timeline');
check(strpos($html, 'gallery-rail-global') !== false, 'global gallery rail renders');
check(strpos($html, 'No photo destination</h3>') === false, 'gallery hides destination without photo');
check(substr_count($html, 'gallery-rail-wrap') === 1, 'gallery has one global rail');
check(strpos($html, '&lt;script&gt;alert(1)&lt;!--') === false && strpos($html, '&lt;script&gt;') !== false, 'place description escaped properly');
$destinations = [
    ['id' => 1, 'name' => 'Hari dua', 'day_no' => 2, 'sort_order' => 1, 'visit_date' => '', 'description' => '', 'place_description' => '', 'address' => '', 'maps_url' => '', 'route' => ''],
    ['id' => 2, 'name' => 'Hari satu', 'day_no' => 1, 'sort_order' => 1, 'visit_date' => '', 'description' => '', 'place_description' => '', 'address' => '', 'maps_url' => '', 'route' => ''],
];
$gallery = [
    ['id' => 1, 'destination_id' => 1, 'photo' => 'uploads/gallery/two.webp', 'title' => 'Foto hari dua', 'location' => '', 'created_at' => '2026-08-19 10:00:00'],
    ['id' => 2, 'destination_id' => 2, 'photo' => 'uploads/gallery/one.webp', 'title' => 'Foto hari satu', 'location' => '', 'created_at' => '2026-08-20 10:00:00'],
];
ob_start(); require __DIR__ . '/../app/views/home.php'; $orderedHtml = ob_get_clean();
check(strpos($orderedHtml, 'Foto hari satu') < strpos($orderedHtml, 'Foto hari dua'), 'gallery follows rundown order');
$gallery[] = ['id' => 3, 'destination_id' => null, 'photo' => 'uploads/gallery/other.webp', 'title' => 'Foto tanpa destinasi', 'location' => 'Lokasi umum', 'created_at' => '2026-08-21 10:00:00'];
ob_start(); require __DIR__ . '/../app/views/home.php'; $unassignedHtml = ob_get_clean();
check(strpos($unassignedHtml, 'Foto tanpa destinasi') !== false, 'gallery preserves unassigned photos');
check(strpos($unassignedHtml, 'Dokumentasi lainnya') !== false, 'unassigned photo uses fallback label');

$gallery = [];
ob_start(); require __DIR__ . '/../app/views/home.php'; $emptyHtml = ob_get_clean();
check(strpos($emptyHtml, 'Dokumentasi foto menyusul.') !== false, 'empty gallery state renders when gallery is empty');

 echo $fails ? "\nFAILURES:\n- " . implode("\n- ", $fails) . "\n" : "\nALL CHECKS PASSED\n";
exit($fails ? 1 : 0);
