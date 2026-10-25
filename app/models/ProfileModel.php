<?php

class ProfileModel
{
    public static function all()
    {
        return db()->query('SELECT * FROM profiles ORDER BY sort_order, id')->fetchAll(PDO::FETCH_ASSOC);
    }

    public static function find($id)
    {
        $stmt = db()->prepare('SELECT * FROM profiles WHERE id=?');
        $stmt->execute([(int)$id]);
        return $stmt->fetch(PDO::FETCH_ASSOC) ?: [];
    }

    public static function save($id, $name, $role, $bio, $photo, $sort)
    {
        if ($id) {
            $stmt = db()->prepare('UPDATE profiles SET name=?,role=?,bio=?,photo=?,sort_order=? WHERE id=?');
            $stmt->execute([$name, $role, $bio, $photo, (int)$sort, (int)$id]);
        } else {
            $stmt = db()->prepare('INSERT INTO profiles(name,role,bio,photo,sort_order) VALUES(?,?,?,?,?)');
            $stmt->execute([$name, $role, $bio, $photo, (int)$sort]);
        }
    }

    public static function delete($id)
    {
        $stmt = db()->prepare('DELETE FROM profiles WHERE id=?');
        $stmt->execute([(int)$id]);
    }
}
