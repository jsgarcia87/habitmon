-- --- Esquema de Base de Datos para Habitmon RPG ---

-- 1. Crear Base de Datos
CREATE DATABASE IF NOT EXISTS `habitmon_db`;
USE `habitmon_db`;

-- 2. Tabla de Usuarios (Entrenadores)
CREATE TABLE IF NOT EXISTS `usuarios` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `username` VARCHAR(50) NOT NULL UNIQUE,
    `email` VARCHAR(100) NOT NULL UNIQUE,
    `password_hash` VARCHAR(255) NOT NULL,
    `avatar` INT DEFAULT 0,
    `creado_en` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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
    `fecha_captura` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
