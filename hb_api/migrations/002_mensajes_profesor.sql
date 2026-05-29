-- ============================================================================
--  Habitmon Migration 002 — Mensajes-NPC del Profesor
--  Cada padre/madre puede programar mensajes que aparecen en el juego como
--  NPCs dinámicos en el pueblo, hablándole al niño con su voz.
-- ============================================================================

USE `habitmon_db`;

CREATE TABLE IF NOT EXISTS `profesor_mensajes` (
    `id`               INT AUTO_INCREMENT PRIMARY KEY,
    `relacion_id`      INT NOT NULL,
    `texto`            VARCHAR(280) NOT NULL,                  -- 2 páginas de 140 chars
    `programado_para`  DATE NOT NULL,                          -- día en que aparece el NPC
    `visto_en`         TIMESTAMP NULL DEFAULT NULL,            -- cuándo el niño habló con el NPC
    `creado_en`        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`relacion_id`) REFERENCES `relaciones_familiares`(`id`) ON DELETE CASCADE,
    INDEX idx_pendientes (`relacion_id`, `programado_para`, `visto_en`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
