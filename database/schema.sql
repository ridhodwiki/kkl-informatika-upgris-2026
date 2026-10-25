CREATE DATABASE IF NOT EXISTS kkl_upgris_2026 CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE kkl_upgris_2026;

CREATE TABLE IF NOT EXISTS settings (
 id INT AUTO_INCREMENT PRIMARY KEY,
 name VARCHAR(100) UNIQUE NOT NULL,
 value TEXT
);
INSERT INTO settings(name,value) VALUES
('site_title','KKL Informatika UPGRIS 2026'),
('logo','')
ON DUPLICATE KEY UPDATE value=VALUES(value);

CREATE TABLE IF NOT EXISTS admins (
 id INT AUTO_INCREMENT PRIMARY KEY,
 username VARCHAR(80) UNIQUE NOT NULL,
 password VARCHAR(255) NOT NULL
);
INSERT INTO admins(username,password) VALUES
('admin', '$2y$12$gTZ68GLdpjZFYGF6OAra2ORxaYbjdXi12lrwndDrvl7jY0DFsANai')
ON DUPLICATE KEY UPDATE username=username;

CREATE TABLE IF NOT EXISTS profiles (
 id INT AUTO_INCREMENT PRIMARY KEY,
 name VARCHAR(120) NOT NULL,
 role VARCHAR(120),
 bio TEXT,
 photo VARCHAR(255),
 sort_order INT DEFAULT 0
);

INSERT INTO profiles(name,role,bio,photo,sort_order)
SELECT * FROM (
 SELECT 'Pembuat 1','Mahasiswa Informatika','Edit profil ini melalui admin.','uploads/profiles/andi.jpg',1
 UNION ALL SELECT 'Pembuat 2','Mahasiswa Informatika','Edit profil ini melalui admin.','uploads/profiles/budi.jpg',2
 UNION ALL SELECT 'Pembuat 3','Mahasiswa Informatika','Edit profil ini melalui admin.','uploads/profiles/citra.jpg',3
 UNION ALL SELECT 'Pembuat 4','Mahasiswa Informatika','Edit profil ini melalui admin.','uploads/profiles/dewi.jpg',4
 UNION ALL SELECT 'Pembuat 5','Mahasiswa Informatika','Edit profil ini melalui admin.','uploads/profiles/eka.jpg',5
 UNION ALL SELECT 'Pembuat 6','Mahasiswa Informatika','Edit profil ini melalui admin.','uploads/profiles/fajar.jpg',6
 UNION ALL SELECT 'Pembuat 7','Mahasiswa Informatika','Edit profil ini melalui admin.','uploads/profiles/gita.jpg',7
 UNION ALL SELECT 'Pembuat 8','Mahasiswa Informatika','Edit profil ini melalui admin.','uploads/profiles/hadi.jpg',8
 UNION ALL SELECT 'Pembuat 9','Mahasiswa Informatika','Edit profil ini melalui admin.','uploads/profiles/indah.jpg',9
 UNION ALL SELECT 'Pembuat 10','Mahasiswa Informatika','Edit profil ini melalui admin.','uploads/profiles/joko.jpg',10
 UNION ALL SELECT 'Pembuat 11','Mahasiswa Informatika','Edit profil ini melalui admin.','uploads/profiles/kartika.jpg',11
) AS seed
WHERE NOT EXISTS (SELECT 1 FROM profiles);

CREATE TABLE IF NOT EXISTS gallery (
 id INT AUTO_INCREMENT PRIMARY KEY,
 destination_id INT NULL,
 title VARCHAR(160) NOT NULL,
 location VARCHAR(160),
 photo VARCHAR(255) NOT NULL,
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS videos (
 id INT AUTO_INCREMENT PRIMARY KEY,
 title VARCHAR(160) NOT NULL,
 embed_url VARCHAR(255) NOT NULL,
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS feedback (
 id INT AUTO_INCREMENT PRIMARY KEY,
 name VARCHAR(100) NOT NULL,
 rating TINYINT NOT NULL,
 message TEXT NOT NULL,
 approved TINYINT(1) DEFAULT 0,
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS destinations (
 id INT AUTO_INCREMENT PRIMARY KEY,
 name VARCHAR(160) NOT NULL,
 visit_date DATE NULL,
  description TEXT,
  place_description TEXT,
  address VARCHAR(255),
  maps_url VARCHAR(500),
  day_no INT NOT NULL DEFAULT 1,
 route VARCHAR(255) NULL,
 sort_order INT NOT NULL DEFAULT 1,
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
