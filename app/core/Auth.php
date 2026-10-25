<?php

class Auth
{
    public static function requireLogin($allowPasswordChange = false)
    {
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
        if (!isset($_SESSION['admin_id'])) {
            redirect('admin/login.php');
        }
        $hash = AdminModel::passwordHash((int)$_SESSION['admin_id']);
        if (!$hash) {
            unset($_SESSION['admin_id']);
            redirect('admin/login.php');
        }
        $_SESSION['must_change_password'] = password_verify('password', $hash);
        if ($_SESSION['must_change_password'] && !$allowPasswordChange) {
            redirect('admin/change_password.php');
        }
    }

    public static function isLoggedIn()
    {
        return isset($_SESSION['admin_id']);
    }

    public static function login($admin)
    {
        $_SESSION['admin_id'] = (int)$admin['id'];
        session_regenerate_id(true);
        $_SESSION['must_change_password'] = password_verify('password', $admin['password']);
    }

    public static function logout()
    {
        $_SESSION = [];
        if (session_status() === PHP_SESSION_ACTIVE) {
            session_regenerate_id(true);
            session_destroy();
        }
        redirect('admin/login.php');
    }
}
