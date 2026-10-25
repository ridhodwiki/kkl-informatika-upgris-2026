<?php

class FeedbackModel
{
    public static function approved()
    {
        return db()->query('SELECT * FROM feedback WHERE approved=1 ORDER BY created_at DESC')->fetchAll(PDO::FETCH_ASSOC);
    }

    public static function all()
    {
        return db()->query('SELECT * FROM feedback ORDER BY created_at DESC')->fetchAll(PDO::FETCH_ASSOC);
    }

    public static function insert($name, $rating, $message)
    {
        $stmt = db()->prepare('INSERT INTO feedback(name,rating,message,approved) VALUES(?,?,?,0)');
        $stmt->execute([$name, (int)$rating, $message]);
    }

    public static function approve($id)
    {
        $stmt = db()->prepare('UPDATE feedback SET approved=1 WHERE id=?');
        $stmt->execute([(int)$id]);
    }

    public static function delete($id)
    {
        $stmt = db()->prepare('DELETE FROM feedback WHERE id=?');
        $stmt->execute([(int)$id]);
    }
}
