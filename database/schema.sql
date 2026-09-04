-- ============================================================
-- FilterGuard - Monitoring Filter Tangki Timbun Solar
-- Database Schema untuk MySQL (XAMPP)
-- Vantzy Web - Stevan Lim
-- ============================================================

-- Buat database jika belum ada
CREATE DATABASE IF NOT EXISTS `filter_monitoring`
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE `filter_monitoring`;

-- ============================================================
-- Tabel 1: tanks
-- Menyimpan data unit tangki timbun solar & filter
-- ============================================================
CREATE TABLE IF NOT EXISTS `tanks` (
    `id`                INT NOT NULL AUTO_INCREMENT,
    `group_name`        VARCHAR(100)  NOT NULL DEFAULT '' COMMENT 'CBI Group, Wilmar Group, dll',
    `sheet_name`        VARCHAR(100)  NOT NULL DEFAULT '' COMMENT 'Nama sheet Excel asal data',
    `region`            VARCHAR(100)  NOT NULL DEFAULT 'Umum' COMMENT 'Kalbar, Kaltim, Sumatera, dll',
    `estate`            VARCHAR(200)  NOT NULL DEFAULT '' COMMENT 'Nama Kebun / Estate / PT',
    `tank_capacity`     VARCHAR(100)  NOT NULL DEFAULT 'Tangki Timbun Solar' COMMENT 'Nama / Tipe Unit (Tangki Timbun, Genset, Fuel Truck, dll)',
    `sisa_solar`        VARCHAR(50)   NOT NULL DEFAULT '-',
    `equipment`         VARCHAR(200)  NOT NULL DEFAULT '' COMMENT 'Filter MDF250 / FEC250, dll',
    `status_mc`         VARCHAR(100)  NOT NULL DEFAULT 'AKTIF',
    `install_date`      DATE              NULL,
    `last_maintenance`  DATE              NULL,
    `next_maintenance`  DATE              NULL,
    `interval_months`   TINYINT       NOT NULL DEFAULT 3 COMMENT 'Interval servis dalam bulan',
    `pic_manager`       VARCHAR(200)  NOT NULL DEFAULT '',
    `pic_gudang`        VARCHAR(200)  NOT NULL DEFAULT '',
    `phone_number`      VARCHAR(30)   NOT NULL DEFAULT '',
    `notes`             TEXT              NULL,
    `created_at`        TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at`        TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    INDEX `idx_group_name`    (`group_name`),
    INDEX `idx_region`        (`region`),
    INDEX `idx_estate`        (`estate`(50)),
    INDEX `idx_next_maint`    (`next_maintenance`),
    INDEX `idx_status_mc`     (`status_mc`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Data unit tangki timbun solar beserta filter';

-- ============================================================
-- Tabel 2: maintenance_history
-- Riwayat servis / pergantian filter per tangki
-- ============================================================
CREATE TABLE IF NOT EXISTS `maintenance_history` (
    `id`              INT NOT NULL AUTO_INCREMENT,
    `tank_id`         INT NOT NULL,
    `service_date`    DATE NOT NULL,
    `interval_months` TINYINT NOT NULL DEFAULT 3,
    `notes`           TEXT NULL,
    `technician`      VARCHAR(200) NOT NULL DEFAULT 'Teknisi Field',
    `created_at`      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    INDEX `idx_tank_id`      (`tank_id`),
    INDEX `idx_service_date` (`service_date`),
    CONSTRAINT `fk_maint_tank`
        FOREIGN KEY (`tank_id`) REFERENCES `tanks` (`id`)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Riwayat servis / pergantian filter';

-- ============================================================
-- Tabel 3: photos
-- Foto dokumentasi maintenance, disimpan dengan path hierarki
-- ============================================================
CREATE TABLE IF NOT EXISTS `photos` (
    `id`               INT NOT NULL AUTO_INCREMENT,
    `tank_id`          INT NOT NULL,
    `maintenance_id`   INT NULL COMMENT 'Null jika foto awal/sample',
    `filename`         VARCHAR(255)  NOT NULL,
    `filepath`         VARCHAR(500)  NOT NULL COMMENT 'Relatif dari /uploads, misal: CBI Group/Kalbar/BPK/foto.jpg',
    `caption`          TEXT NULL,
    `uploader`         VARCHAR(200)  NOT NULL DEFAULT 'Teknisi Field',
    `taken_date`       DATE NULL,
    `created_at`       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    INDEX `idx_photo_tank_id`    (`tank_id`),
    INDEX `idx_photo_maint_id`   (`maintenance_id`),
    INDEX `idx_photo_taken_date` (`taken_date`),
    CONSTRAINT `fk_photo_tank`
        FOREIGN KEY (`tank_id`) REFERENCES `tanks` (`id`)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `fk_photo_maint`
        FOREIGN KEY (`maintenance_id`) REFERENCES `maintenance_history` (`id`)
        ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Foto dokumentasi pergantian / maintenance filter';

-- ============================================================
-- Tabel 4: company_groups
-- Master Group / Holding Perusahaan Konsumen
-- ============================================================
CREATE TABLE IF NOT EXISTS `company_groups` (
    `id`             INT NOT NULL AUTO_INCREMENT,
    `name`           VARCHAR(100) NOT NULL UNIQUE,
    `description`    TEXT NULL,
    `contact_person` VARCHAR(200) NOT NULL DEFAULT '',
    `contact_phone`  VARCHAR(50) NOT NULL DEFAULT '',
    `created_at`     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at`     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    INDEX `idx_group_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Master Group / Holding Perusahaan';

-- ============================================================
-- Tabel 5: users
-- Akun Administrator dan Autentikasi 2-Tahap
-- ============================================================
CREATE TABLE IF NOT EXISTS `users` (
    `id`            INT NOT NULL AUTO_INCREMENT,
    `username`      VARCHAR(50)  NOT NULL UNIQUE,
    `password_hash` VARCHAR(128) NOT NULL,
    `pin_hash`      VARCHAR(128) NOT NULL,
    `name`          VARCHAR(100) NOT NULL DEFAULT 'Admin MicroClean',
    `role`          VARCHAR(30)  NOT NULL DEFAULT 'admin',
    `created_at`    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at`    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    INDEX `idx_username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Akun login admin dan PIN keamanan';

-- ============================================================
-- Tabel 6: sessions
-- Sesi login pengguna aktif
-- ============================================================
CREATE TABLE IF NOT EXISTS `sessions` (
    `id`         VARCHAR(64)  NOT NULL,
    `user_id`    INT          NOT NULL,
    `created_at` TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `expires_at` DATETIME     NOT NULL,
    PRIMARY KEY (`id`),
    INDEX `idx_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Sesi login aktif';

-- ============================================================
-- Tabel 7: filter_stock
-- Master Data & Stok Tipe Filter (MDF 250-1, FEC 250, dll)
-- ============================================================
CREATE TABLE IF NOT EXISTS `filter_stock` (
    `id`           INT NOT NULL AUTO_INCREMENT,
    `filter_name`  VARCHAR(100) NOT NULL UNIQUE,
    `quantity`     INT NOT NULL DEFAULT 0,
    `min_quantity` INT NOT NULL DEFAULT 3,
    `notes`        TEXT NULL,
    `created_at`   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at`   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    INDEX `idx_filter_name` (`filter_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Master tipe filter dan kuota stok gudang';


