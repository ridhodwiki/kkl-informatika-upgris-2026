<?php

class VideoModel
{
    public static function all()
    {
        return db()->query('SELECT * FROM videos ORDER BY created_at DESC')->fetchAll(PDO::FETCH_ASSOC);
    }

    public static function insert($title, $embed)
    {
        $stmt = db()->prepare('INSERT INTO videos(title,embed_url) VALUES(?,?)');
        $stmt->execute([$title, $embed]);
    }

    public static function delete($id)
    {
        $stmt = db()->prepare('DELETE FROM videos WHERE id=?');
        $stmt->execute([(int)$id]);
    }
}
