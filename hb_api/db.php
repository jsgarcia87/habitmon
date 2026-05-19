<?php
// Database Configuration
$db_host = '127.0.0.1';
$db_name = 'habitmon_db';
$db_user = 'Sangar'; // Cambiado por tu usuario
$db_pass = 'SangarBD'; // Cambiado por tu contraseña

try {
    $pdo = new PDO("mysql:host=$db_host;dbname=$db_name;charset=utf8mb4", $db_user, $db_pass);
    // Set PDO error mode to exception
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    // Set default fetch mode to associative array
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);

    // Auto-migrate tables for inventory/coins
    try {
        $pdo->exec("ALTER TABLE usuarios ADD COLUMN monedas INT DEFAULT 300");
    } catch(Exception $ex) {}
    try {
        $pdo->exec("ALTER TABLE usuarios ADD COLUMN inventario TEXT DEFAULT '{\"pokeball\":5,\"superball\":0,\"potion\":2,\"superpotion\":0}'");
    } catch(Exception $ex) {}
    try {
        $pdo->exec("ALTER TABLE usuarios ADD COLUMN permitir_encuentros INT DEFAULT 1");
    } catch(Exception $ex) {}
    try {
        $pdo->exec("CREATE TABLE IF NOT EXISTS `amigos` (
            `id` INT AUTO_INCREMENT PRIMARY KEY,
            `usuario_id_1` INT NOT NULL,
            `usuario_id_2` INT NOT NULL,
            `estado` VARCHAR(20) DEFAULT 'pendiente',
            `solicitado_por` INT NOT NULL,
            `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (`usuario_id_1`) REFERENCES `usuarios`(`id`) ON DELETE CASCADE,
            FOREIGN KEY (`usuario_id_2`) REFERENCES `usuarios`(`id`) ON DELETE CASCADE,
            UNIQUE KEY `unique_amistad` (`usuario_id_1`, `usuario_id_2`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
    } catch(Exception $ex) {}
    try {
        $pdo->exec("ALTER TABLE gimnasios_template MODIFY COLUMN `tiempo` ENUM('morning', 'midday', 'day', 'night') DEFAULT 'day'");
    } catch(Exception $ex) {}
} catch(PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Database connection failed: ' . $e->getMessage()]);
    exit();
}
?>
