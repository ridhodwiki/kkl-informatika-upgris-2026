<?php
class Database
{
    private static $pdo = null;

    public static function connection()
    {
        if (self::$pdo instanceof PDO) return self::$pdo;
        $config = require __DIR__ . '/../../config/config.php';
        $db = $config['db'];
        try {
            self::$pdo = new PDO(
                "mysql:host={$db['host']};dbname={$db['name']};charset=utf8mb4",
                $db['user'],
                $db['pass'],
                [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
            );
        } catch (PDOException $e) {
            http_response_code(500);
            die('Koneksi database gagal. Pastikan MySQL XAMPP aktif dan database sudah diimpor.');
        }
        return self::$pdo;
    }
}

function db()
{
    return Database::connection();
}
