-- --- Esquema de Base de Datos para Habitmon RPG ---

-- 1. Crear Base de Datos
CREATE DATABASE IF NOT EXISTS `habitmon_db`;
USE `habitmon_db`;

-- 2. Tabla de Usuarios (Entrenadores)
CREATE TABLE IF NOT EXISTS `usuarios` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `username` VARCHAR(50) NOT NULL UNIQUE,
    `tipo_cuenta` ENUM('child','professor','admin') NOT NULL DEFAULT 'child',
    `email` VARCHAR(100) NOT NULL UNIQUE,
    `password_hash` VARCHAR(255) NOT NULL,
    `avatar` INT DEFAULT 0,
    `pokemon_inicial_id` VARCHAR(10) DEFAULT NULL,
    `pokemon_inicial_nombre` VARCHAR(50) DEFAULT NULL,
    `monedas` INT DEFAULT 300,
    `inventario` TEXT DEFAULT NULL, -- '{"pokeball":5,"superball":0,"potion":2,"superpotion":0}'
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Modo Profesor: vínculo padre-hijo
CREATE TABLE IF NOT EXISTS `relaciones_familiares` (
    `id`                 INT AUTO_INCREMENT PRIMARY KEY,
    `professor_id`       INT NOT NULL,
    `child_id`           INT NULL,
    `rol_display`        VARCHAR(20) NOT NULL DEFAULT 'PROFESOR',
    `avatar_npc`         TINYINT NOT NULL DEFAULT 0,
    `estado`             ENUM('pendiente','activo','revocado') NOT NULL DEFAULT 'pendiente',
    `codigo_invitacion`  VARCHAR(8) UNIQUE,
    `creado_en`          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `activado_en`        TIMESTAMP NULL DEFAULT NULL,
    `expira_en`          TIMESTAMP NULL DEFAULT NULL,
    FOREIGN KEY (`professor_id`) REFERENCES `usuarios`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`child_id`)     REFERENCES `usuarios`(`id`) ON DELETE CASCADE,
    INDEX idx_codigo (`codigo_invitacion`),
    INDEX idx_professor_estado (`professor_id`, `estado`),
    INDEX idx_child_estado     (`child_id`,     `estado`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Mensajes-NPC del Profesor al niño (Sprint 2)
CREATE TABLE IF NOT EXISTS `profesor_mensajes` (
    `id`               INT AUTO_INCREMENT PRIMARY KEY,
    `relacion_id`      INT NOT NULL,
    `texto`            VARCHAR(280) NOT NULL,
    `programado_para`  DATE NOT NULL,
    `visto_en`         TIMESTAMP NULL DEFAULT NULL,
    `creado_en`        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`relacion_id`) REFERENCES `relaciones_familiares`(`id`) ON DELETE CASCADE,
    INDEX idx_pendientes (`relacion_id`, `programado_para`, `visto_en`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Tabla de Hábitos/Tareas Diarias
CREATE TABLE IF NOT EXISTS `habitos` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `usuario_id` INT NOT NULL,
    `gimnasio_id` VARCHAR(50) NOT NULL,
    `pokemon_index` INT DEFAULT 0,
    `habito_id` VARCHAR(50) NOT NULL,
    `habito_nombre` VARCHAR(255) NOT NULL,
    `fecha` DATE NOT NULL,
    `completado` TINYINT(1) DEFAULT 0,
    UNIQUE KEY `unique_habito_dia` (`usuario_id`, `gimnasio_id`, `habito_id`, `fecha`),
    FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Tabla de Progreso Diario (Medallas)
CREATE TABLE IF NOT EXISTS `progreso_diario` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `usuario_id` INT NOT NULL,
    `fecha` DATE NOT NULL,
    `gimnasios_completados` TEXT, -- JSON con IDs de gimnasios ganados hoy
    UNIQUE KEY `user_date` (`usuario_id`, `fecha`),
    FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Tabla de Colección de Pokémon (Capturados)
CREATE TABLE IF NOT EXISTS `pokemon_coleccion` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `usuario_id` INT NOT NULL,
    `pokemon_id` VARCHAR(10) NOT NULL,
    `pokemon_nombre` VARCHAR(50) NOT NULL,
    `gimnasio_origen` VARCHAR(50),
    `xp` INT DEFAULT 0,
    `nivel` INT DEFAULT 5,
    `is_partner` TINYINT(1) DEFAULT 0,
    `fecha_captura` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Plantillas Dinámicas (Configuración de Gimnasios y Retos)
DROP TABLE IF EXISTS `habitos_template`;
DROP TABLE IF EXISTS `pokemon_template`;
DROP TABLE IF EXISTS `gimnasios_template`;

CREATE TABLE `gimnasios_template` (
    `gym_id` VARCHAR(50) PRIMARY KEY,
    `gym_nombre` VARCHAR(100) NOT NULL,
    `tiempo` ENUM('morning', 'day', 'night') DEFAULT 'day',
    `battleback` VARCHAR(255) DEFAULT 'Graphics/battlebacks/outdoor.png',
    `orden` INT DEFAULT 0,
    `activo` TINYINT(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `pokemon_template` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `gym_id` VARCHAR(50) NOT NULL,
    `pokemon_id` VARCHAR(10) NOT NULL,
    `nombre` VARCHAR(50) NOT NULL,
    `nivel` INT DEFAULT 5,
    `orden_en_gym` INT DEFAULT 0,
    FOREIGN KEY (`gym_id`) REFERENCES `gimnasios_template`(`gym_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `habitos_template` (
    `id` VARCHAR(50) PRIMARY KEY,
    `pokemon_template_id` INT NOT NULL,
    `nombre` VARCHAR(255) NOT NULL,
    `daño` INT DEFAULT 20,
    `icono` VARCHAR(10) DEFAULT '⚔️',
    `obligatorio` TINYINT(1) DEFAULT 1,
    `activo` TINYINT(1) DEFAULT 1,
    FOREIGN KEY (`pokemon_template_id`) REFERENCES `pokemon_template`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Tabla de Presets de Configuración
CREATE TABLE IF NOT EXISTS `habito_presets` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `usuario_id` INT NOT NULL,
    `nombre` VARCHAR(100) NOT NULL,
    `config_json` TEXT NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Datos iniciales de ejemplo
INSERT INTO `gimnasios_template` (`gym_id`,`gym_nombre`,`tiempo`,`battleback`,`orden`) VALUES ('vestirse', 'Gimnasio Vestirse', 'morning', 'Graphics/battlebacks/room.png', 1);
INSERT INTO `gimnasios_template` (`gym_id`,`gym_nombre`,`tiempo`,`battleback`,`orden`) VALUES ('desayuno', 'Gimnasio Desayuno', 'morning', 'Graphics/battlebacks/indoor.png', 2);
INSERT INTO `gimnasios_template` (`gym_id`,`gym_nombre`,`tiempo`,`battleback`,`orden`) VALUES ('higiene', 'Gimnasio Higiene', 'day', 'Graphics/battlebacks/outdoor.png', 3);
INSERT INTO `gimnasios_template` (`gym_id`,`gym_nombre`,`tiempo`,`battleback`,`orden`) VALUES ('orden', 'Gimnasio Orden', 'night', 'Graphics/battlebacks/room.png', 4);

INSERT INTO `pokemon_template` (gym_id, pokemon_id, nombre, nivel, orden_en_gym) VALUES 
('vestirse', '052', 'Meowth', 5, 0),
('desayuno', '094', 'Gengar', 8, 0),
('higiene', '019', 'Rattata', 10, 0),
('orden', '066', 'Machop', 12, 0);

INSERT INTO `habitos_template` (id, pokemon_template_id, nombre, daño, icono) VALUES 
('q_pant', 1, 'Quitar pantalones', 20, '👖'),
('q_cam',  1, 'Quitar camiseta', 20, '👕'),
('d_leche', 2, 'Tomar leche', 30, '🥛'),
('h_dientes', 3, 'Lavar dientes', 40, '🪥'),
('o_cuarto', 4, 'Recoger cuarto', 50, '🧸');


-- 8. Tabla de Amistades (sistema MMO)
CREATE TABLE IF NOT EXISTS `amigos` (
  `id`           INT AUTO_INCREMENT PRIMARY KEY,
  `usuario_id_1` INT NOT NULL,
  `usuario_id_2` INT NOT NULL,
  `estado`       ENUM("pendiente","aceptado") NOT NULL DEFAULT "pendiente",
  `solicitado_por` INT NOT NULL,
  `created_at`   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `uq_amistad` (`usuario_id_1`, `usuario_id_2`),
  FOREIGN KEY (`usuario_id_1`) REFERENCES `usuarios`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`usuario_id_2`) REFERENCES `usuarios`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. Posición online de jugadores (MMO presencia)
CREATE TABLE IF NOT EXISTS `usuario_posicion` (
  `usuario_id`          INT NOT NULL PRIMARY KEY,
  `mapa_id`             VARCHAR(20) NOT NULL DEFAULT "Map002",
  `posicion_x`          INT NOT NULL DEFAULT 12,
  `posicion_y`          INT NOT NULL DEFAULT 12,
  `direccion`           INT NOT NULL DEFAULT 0,
  `ultima_actualizacion` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

