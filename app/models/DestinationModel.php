<?php

class DestinationModel
{
    public static function all()
    {
        return db()->query('SELECT * FROM destinations ORDER BY day_no, sort_order, visit_date, name')->fetchAll(PDO::FETCH_ASSOC);
    }

    public static function find($id)
    {
        $stmt = db()->prepare('SELECT * FROM destinations WHERE id=?');
        $stmt->execute([(int)$id]);
        return $stmt->fetch(PDO::FETCH_ASSOC) ?: [];
    }

    public static function save($id, $name, $date, $description, $placeDescription, $address, $mapsUrl, $day, $route, $sort)
    {
        if ($id) {
            $stmt = db()->prepare('UPDATE destinations SET name=?,visit_date=?,description=?,place_description=?,address=?,maps_url=?,day_no=?,route=?,sort_order=? WHERE id=?');
            $stmt->execute([$name, $date, $description, $placeDescription, $address, $mapsUrl, (int)$day, $route, (int)$sort, (int)$id]);
        } else {
            $stmt = db()->prepare('INSERT INTO destinations(name,visit_date,description,place_description,address,maps_url,day_no,route,sort_order) VALUES(?,?,?,?,?,?,?,?,?)');
            $stmt->execute([$name, $date, $description, $placeDescription, $address, $mapsUrl, (int)$day, $route, (int)$sort]);
        }
    }

    public static function delete($id)
    {
        $stmt = db()->prepare('DELETE FROM destinations WHERE id=?');
        $stmt->execute([(int)$id]);
    }
}
