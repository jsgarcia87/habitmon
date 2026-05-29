-- ============================================================================
--  Habitmon Migration 001 — Modo Profesor (vínculo padre-hijo)
--  Idempotente: se puede ejecutar sobre bases existentes sin romper datos.
-- ============================================================================

USE `habitmon_db`;

-- ── 1. usuarios: añadir tipo_cuenta (default 'child' = compatible) ─────────
-- MySQL no soporta ADD COLUMN IF NOT EXISTS hasta 8.0.16; usamos guardia.
SET @col_exists := (
    SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME   = 'usuarios'
      AND COLUMN_NAME  = 'tipo_cuenta'
);
SET @sql := IF(@col_exists = 0,
    "ALTER TABLE `usuarios` ADD COLUMN `tipo_cuenta` ENUM('child','professor','admin') NOT NULL DEFAULT 'child' AFTER `username`",
    "SELECT 'col tipo_cuenta ya existe' AS noop"
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- ── 2. relaciones_familiares ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `relaciones_familiares` (
    `id`                 INT AUTO_INCREMENT PRIMARY KEY,
    `professor_id`       INT NOT NULL,
    `child_id`           INT NULL,                              -- NULL hasta que el niño acepte
    `rol_display`        VARCHAR(20) NOT NULL DEFAULT 'PROFESOR', -- 'PAPÁ', 'MAMÁ', 'PROFESOR'...
    `avatar_npc`         TINYINT NOT NULL DEFAULT 0,            -- 0-3, sprite NPC en el juego
    `estado`             ENUM('pendiente','activo','revocado') NOT NULL DEFAULT 'pendiente',
    `codigo_invitacion`  VARCHAR(8) UNIQUE,
    `creado_en`          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `activado_en`        TIMESTAMP NULL DEFAULT NULL,
    `expira_en`          TIMESTAMP NULL DEFAULT NULL,           -- caduca el código en N días
    FOREIGN KEY (`professor_id`) REFERENCES `usuarios`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`child_id`)     REFERENCES `usuarios`(`id`) ON DELETE CASCADE,
    INDEX idx_codigo (`codigo_invitacion`),
    INDEX idx_professor_estado (`professor_id`, `estado`),
    INDEX idx_child_estado     (`child_id`,     `estado`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
