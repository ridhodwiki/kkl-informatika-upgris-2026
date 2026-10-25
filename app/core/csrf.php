<?php

function csrf_token()
{
    if (session_status() === PHP_SESSION_NONE) {
        session_start(['cookie_httponly' => true, 'cookie_secure' => !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off', 'cookie_samesite' => 'Lax', 'use_strict_mode' => true]);
    }
    if (empty($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['csrf_token'];
}

function csrf_field()
{
    return '<input type="hidden" name="csrf_token" value="' . htmlspecialchars(csrf_token(), ENT_QUOTES, 'UTF-8') . '">';
}

function csrf_valid($method, $token)
{
    return $method === 'POST' && is_string($token) && isset($_SESSION['csrf_token']) && hash_equals($_SESSION['csrf_token'], $token);
}

function csrf_verify()
{
    if (!csrf_valid($_SERVER['REQUEST_METHOD'] ?? '', $_POST['csrf_token'] ?? null)) {
        http_response_code(419);
        exit('Token atau metode tidak valid. Kembali dan coba lagi.');
    }
}
