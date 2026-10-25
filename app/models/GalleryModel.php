<?php

class GalleryModel
{
    public static function all()
    {
        return db()->query('SELECT g.*, d.name AS destination_name FROM gallery g LEFT JOIN destinations d ON d.id=g.destination_id ORDER BY g.created_at DESC')->fetchAll(PDO::FETCH_ASSOC);
    }

    public static function find($id)
    {
        $stmt = db()->prepare('SELECT * FROM gallery WHERE id=?');
        $stmt->execute([(int)$id]);
        return $stmt->fetch(PDO::FETCH_ASSOC) ?: [];
    }

    public static function save($id, $destinationId, $title, $location, $photo)
    {
        if ($id) {
            if ($photo !== '') {
                $stmt = db()->prepare('UPDATE gallery SET destination_id=?, title=?, location=?, photo=? WHERE id=?');
                $stmt->execute([$destinationId, $title, $location, $photo, (int)$id]);
            } else {
                $stmt = db()->prepare('UPDATE gallery SET destination_id=?, title=?, location=? WHERE id=?');
                $stmt->execute([$destinationId, $title, $location, (int)$id]);
            }
        } else {
            $stmt = db()->prepare('INSERT INTO gallery(destination_id,title,location,photo) VALUES(?,?,?,?)');
            $stmt->execute([$destinationId, $title, $location, $photo]);
        }
    }

    public static function delete($id)
    {
        $stmt = db()->prepare('DELETE FROM gallery WHERE id=?');
        $stmt->execute([(int)$id]);
    }
}
