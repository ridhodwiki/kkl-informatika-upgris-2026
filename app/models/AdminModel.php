<?php

class AdminModel
{
    public static function findByUsername($username)
    {
        $stmt = db()->prepare('SELECT * FROM admins WHERE username=? LIMIT 1');
        $stmt->execute([$username]);
        return $stmt->fetch(PDO::FETCH_ASSOC) ?: [];
    }

    public static function find($id)
    {
        $stmt = db()->prepare('SELECT * FROM admins WHERE id=? LIMIT 1');
        $stmt->execute([(int)$id]);
        return $stmt->fetch(PDO::FETCH_ASSOC) ?: [];
    }

    public static function passwordHash($id)
    {
        $stmt = db()->prepare('SELECT password FROM admins WHERE id=?');
        $stmt->execute([(int)$id]);
        return $stmt->fetchColumn();
    }

    public static function updatePassword($id, $hash)
    {
        $stmt = db()->prepare('UPDATE admins SET password=? WHERE id=?');
        $stmt->execute([$hash, (int)$id]);
    }
}
