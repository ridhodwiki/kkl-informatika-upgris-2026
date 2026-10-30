<?php

header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: SAMEORIGIN');
header('Referrer-Policy: no-referrer');
header('Content-Security-Policy: default-src \'self\'; img-src \'self\' data: blob:; style-src \'self\' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; script-src \'self\'; frame-src https://www.youtube.com; connect-src \'self\' blob:; frame-ancestors \'self\'; base-uri \'self\'; form-action \'self\';');

require __DIR__ . '/../app/core/Database.php';
require __DIR__ . '/../app/core/helpers.php';
require __DIR__ . '/../app/core/csrf.php';
csrf_token();
require __DIR__ . '/../app/core/Auth.php';
require __DIR__ . '/../app/core/Router.php';
foreach (['Profile', 'Destination', 'Gallery', 'Video', 'Feedback', 'Setting', 'Admin'] as $model) {
    require __DIR__ . '/../app/models/' . $model . 'Model.php';
}
require __DIR__ . '/../app/controllers/HomeController.php';
require __DIR__ . '/../app/controllers/AdminController.php';

$router = new Router();
$home = new HomeController();
$admin = new AdminController();

$router->add('GET', '/', [$home, 'index']);
$router->add('POST', '/submit_feedback.php', [$home, 'feedback']);
$router->add('GET', '/submit_feedback.php', [$home, 'feedbackRedirect']);
$router->add('GET', '/admin/login.php', [$admin, 'login']);
$router->add('POST', '/admin/login.php', [$admin, 'login']);
$router->add('POST', '/admin/logout.php', [$admin, 'logout']);
$router->add('GET', '/admin/dashboard.php', [$admin, 'dashboard']);
$router->add('GET', '/admin/profile_form.php', [$admin, 'profileForm']);
$router->add('POST', '/admin/profile_form.php', [$admin, 'profileForm']);
$router->add('GET', '/admin/destination_form.php', [$admin, 'destinationForm']);
$router->add('POST', '/admin/destination_form.php', [$admin, 'destinationForm']);
$router->add('GET', '/admin/gallery_form.php', [$admin, 'galleryForm']);
$router->add('POST', '/admin/gallery_form.php', [$admin, 'galleryForm']);
$router->add('GET', '/admin/video_form.php', [$admin, 'videoForm']);
$router->add('POST', '/admin/video_form.php', [$admin, 'videoForm']);
$router->add('POST', '/admin/save_settings.php', [$admin, 'saveSettings']);
$router->add('GET', '/admin/change_password.php', [$admin, 'changePassword']);
$router->add('POST', '/admin/change_password.php', [$admin, 'changePassword']);
$router->add('POST', '/admin/approve_feedback.php', [$admin, 'approveFeedback']);
$router->add('POST', '/admin/delete.php', [$admin, 'delete']);
$router->add('GET', '/admin/upgrade.php', [$admin, 'upgrade']);
$router->add('POST', '/admin/upgrade.php', [$admin, 'upgrade']);

[$found] = $router->dispatch($_SERVER['REQUEST_METHOD'] ?? 'GET', request_route());
if (!$found) {
    http_response_code(404);
    require __DIR__ . '/../app/views/errors/404.php';
}
