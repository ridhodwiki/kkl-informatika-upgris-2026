<?php

class SettingModel
{
    public static function get($name, $default = '')
    {
        $stmt = db()->prepare('SELECT value FROM settings WHERE name=? LIMIT 1');
        $stmt->execute([$name]);
        $value = $stmt->fetchColumn();
        return $value === false ? $default : $value;
    }

    public static function set($name, $value)
    {
        $stmt = db()->prepare('INSERT INTO settings(name,value) VALUES(?,?) ON DUPLICATE KEY UPDATE value=VALUES(value)');
        $stmt->execute([$name, $value]);
    }
}
