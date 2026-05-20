<?php
// Load .env file if present (development only)
$_env_file = __DIR__ . '/.env';
if (file_exists($_env_file)) {
    foreach (file($_env_file, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $_line) {
        if (strpos($_line, '=') !== false && strpos(ltrim($_line), '#') !== 0) {
            [$_k, $_v] = explode('=', $_line, 2);
            putenv(trim($_k) . '=' . trim($_v));
        }
    }
}

$db_host = getenv('HM_DB_HOST') ?: '127.0.0.1';
$db_name = getenv('HM_DB_NAME') ?: 'habitmon_db';
$db_user = getenv('HM_DB_USER') ?: 'Sangar';
$db_pass = getenv('HM_DB_PASS') ?: 'SangarBD';

define('TOKEN_SECRET', getenv('HM_TOKEN_SECRET') ?: 'habitmon-token-dev-only-change-me');

// ── Inventory helper ──────────────────────────────────────────────────────────

function parse_inventory(?string $json): array {
    $default = ['pokeball' => 5, 'superball' => 0, 'potion' => 2, 'superpotion' => 0];
    if (!$json) return $default;
    $inv = json_decode($json, true);
    return is_array($inv) ? $inv : $default;
}

// ── Token helpers (HMAC-SHA256 signed, no external lib needed) ──────────────

function base64url_encode(string $data): string {
    return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
}

function base64url_decode(string $data): string {
    return base64_decode(strtr($data, '-_', '+/') . str_repeat('=', (4 - strlen($data) % 4) % 4));
}

function generate_token(int $uid): string {
    $payload = base64url_encode(json_encode(['uid' => $uid, 'exp' => time() + 86400 * 30]));
    $sig     = base64url_encode(hash_hmac('sha256', $payload, TOKEN_SECRET, true));
    return $payload . '.' . $sig;
}

function verify_token(string $token): ?int {
    $parts = explode('.', $token, 2);
    if (count($parts) !== 2) return null;
    [$payload_b64, $sig_b64] = $parts;
    $expected = base64url_encode(hash_hmac('sha256', $payload_b64, TOKEN_SECRET, true));
    if (!hash_equals($expected, $sig_b64)) return null;
    $data = json_decode(base64url_decode($payload_b64), true);
    if (!$data || !isset($data['exp'], $data['uid']) || $data['exp'] < time()) return null;
    return (int)$data['uid'];
}

// ── DB connection ─────────────────────────────────────────────────────────────

try {
    $pdo = new PDO("mysql:host=$db_host;dbname=$db_name;charset=utf8mb4", $db_user, $db_pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);

    // ── One-time schema migrations (idempotent) ───────────────────────────────
    try { $pdo->exec("ALTER TABLE usuarios ADD COLUMN monedas INT DEFAULT 300"); } catch(Exception $ex) {}
    try { $pdo->exec("ALTER TABLE usuarios ADD COLUMN inventario TEXT DEFAULT '{\"pokeball\":5,\"superball\":0,\"potion\":2,\"superpotion\":0}'"); } catch(Exception $ex) {}
    try { $pdo->exec("ALTER TABLE usuarios ADD COLUMN permitir_encuentros INT DEFAULT 1"); } catch(Exception $ex) {}
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
    try { $pdo->exec("ALTER TABLE gimnasios_template MODIFY COLUMN `tiempo` ENUM('morning', 'midday', 'day', 'night') DEFAULT 'day'"); } catch(Exception $ex) {}

    // ── Seed default gym/habit templates if all are inactive or missing ────────
    try {
        $activeGyms = (int)$pdo->query("SELECT COUNT(*) FROM gimnasios_template WHERE activo = 1")->fetchColumn();
        if ($activeGyms === 0) {
            $pdo->exec("UPDATE gimnasios_template SET activo = 1");
            $activeGyms = (int)$pdo->query("SELECT COUNT(*) FROM gimnasios_template WHERE activo = 1")->fetchColumn();
        }
        if ($activeGyms === 0) {
            $pdo->exec("INSERT IGNORE INTO gimnasios_template (gym_id, gym_nombre, tiempo, orden, activo) VALUES
                ('vestirse','Gimnasio Vestirse','morning',1,1),
                ('higiene','Gimnasio Higiene','morning',2,1),
                ('desayuno','Gimnasio Desayuno','morning',3,1),
                ('orden','Gimnasio Orden','night',4,1)");
        }
    } catch(Exception $ex) {}
    try {
        // Ensure pokemon_template has rows for each active gym
        $missingPk = $pdo->query(
            "SELECT g.gym_id FROM gimnasios_template g
             LEFT JOIN pokemon_template p ON p.gym_id = g.gym_id
             WHERE g.activo = 1 AND p.id IS NULL"
        )->fetchAll(PDO::FETCH_COLUMN);
        $defaults = [
            'vestirse' => ['052','Meowth',5],
            'higiene'  => ['019','Rattata',10],
            'desayuno' => ['094','Gengar',8],
            'orden'    => ['066','Machop',12],
            'comida'   => ['104','Cubone',10],
            'fitness'  => ['056','Mankey',8],
        ];
        foreach ($missingPk as $gid) {
            $d = $defaults[$gid] ?? ['001','Bulbasaur',5];
            $pdo->prepare("INSERT IGNORE INTO pokemon_template (gym_id, pokemon_id, nombre, nivel, orden_en_gym) VALUES (?,?,?,?,0)")
                ->execute([$gid, $d[0], $d[1], $d[2]]);
        }
    } catch(Exception $ex) {}
    try {
        $activeHabits = (int)$pdo->query("SELECT COUNT(*) FROM habitos_template WHERE activo = 1")->fetchColumn();
        if ($activeHabits === 0) {
            $pdo->exec("UPDATE habitos_template SET activo = 1");
            // If still 0, seed defaults using actual pokemon_template IDs
            if ((int)$pdo->query("SELECT COUNT(*) FROM habitos_template WHERE activo = 1")->fetchColumn() === 0) {
                $pkRows = $pdo->query("SELECT id, gym_id FROM pokemon_template LIMIT 10")->fetchAll();
                $seedMap = ['vestirse'=>[['q_pant','Quitar ropa',20,'👕'],['q_calc','Ponerse calcetines',20,'🧦']],
                            'higiene' =>[['h_dien','Lavar dientes',40,'🪥'],['h_cara','Lavar cara',25,'🧼']],
                            'desayuno'=>[['d_lech','Tomar leche',30,'🥛'],['d_tost','Tostadas',25,'🍞']],
                            'orden'   =>[['o_cama','Hacer cama',40,'🛏️'],['o_reco','Recoger cuarto',50,'🧸']]];
                foreach ($pkRows as $pk) {
                    $habits = $seedMap[$pk['gym_id']] ?? [];
                    foreach ($habits as $h) {
                        $pdo->prepare("INSERT IGNORE INTO habitos_template (id,pokemon_template_id,nombre,daño,icono,activo) VALUES (?,?,?,?,?,1)")
                            ->execute([$h[0], $pk['id'], $h[1], $h[2], $h[3]]);
                    }
                }
            }
        }
    } catch(Exception $ex) {}

    // ── Migrate plaintext passwords → bcrypt (runs once per user) ────────────
    try {
        $rows = $pdo->query("SELECT id, password_hash FROM usuarios WHERE password_hash NOT LIKE '\$2y\$%' AND password_hash != ''")->fetchAll();
        foreach ($rows as $row) {
            $hashed = password_hash($row['password_hash'], PASSWORD_DEFAULT);
            $pdo->prepare("UPDATE usuarios SET password_hash = ? WHERE id = ?")->execute([$hashed, $row['id']]);
        }
    } catch(Exception $ex) {}

} catch(PDOException $e) {
    http_response_code(500);
    $msg = getenv('APP_DEBUG') === 'true'
        ? 'DB error: ' . $e->getMessage()
        : 'Database connection failed';
    echo json_encode(['success' => false, 'error' => $msg]);
    exit();
}
?>
