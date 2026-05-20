<?php
/**
 * index.php - Sincronizado con api.js
 */
$_debug = getenv('APP_DEBUG') === 'true';
ini_set('display_errors', $_debug ? 1 : 0);
ini_set('display_startup_errors', $_debug ? 1 : 0);
error_reporting($_debug ? E_ALL : 0);
<<<<<<< Updated upstream

date_default_timezone_set(getenv('APP_TIMEZONE') ?: 'Europe/Madrid');
=======
>>>>>>> Stashed changes

require_once 'db.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$method = $_SERVER['REQUEST_METHOD'];
// Detectar ruta relativa (soporta /hb_api/index.php/ruta, /hb_api/ruta y index.php?route=/ruta)
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$script_name = $_SERVER['SCRIPT_NAME'];
$script_dir = dirname($script_name); 

// Fallback a parámetro 'route' si existe
$route = $_GET['route'] ?? null;

if (!$route || $route === '/') {
    $route = str_replace([$script_name, $script_dir], '', $path);
    $route = str_replace('index.php', '', $route);
}

$route = '/' . trim($route, '/');

function get_json_input() {
    return json_decode(file_get_contents('php://input'), true);
}

function get_user_id() {
    $headers = [];
    if (function_exists('getallheaders')) {
        $headers = getallheaders();
    } else {
        foreach ($_SERVER as $name => $value) {
            if (substr($name, 0, 5) == 'HTTP_') {
                $headers[str_replace(' ', '-', ucwords(strtolower(str_replace('_', ' ', substr($name, 5)))))] = $value;
            }
        }
    }
    
    $auth = $headers['Authorization'] ?? $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? null;
    if ($auth && preg_match('/Bearer\s(\S+)/', $auth, $matches)) {
        return verify_token($matches[1]);
    }
    return null;
}

try {
    // ─── AUTH ──────────────────────────────────────────────────────────────────
    if (strpos($route, '/auth/register') === 0 && $method === 'POST') {
        $data = get_json_input();
        if (empty($data['username']) || empty($data['email']) || empty($data['password'])) {
            http_response_code(400);
            echo json_encode(["success" => false, "error" => "Faltan campos obligatorios"]);
            exit();
        }
        // Check for duplicate email/username before inserting
        $dupStmt = $pdo->prepare("SELECT id FROM usuarios WHERE email = ? OR username = ? LIMIT 1");
        $dupStmt->execute([$data['email'], $data['username']]);
        if ($dupStmt->fetch()) {
            http_response_code(409);
            echo json_encode(["success" => false, "error" => "El email o nombre de usuario ya está registrado"]);
            exit();
        }
        $hashed = password_hash($data['password'], PASSWORD_DEFAULT);
        $default_inv = '{"pokeball":5,"superball":0,"potion":2,"superpotion":0}';
        $stmt = $pdo->prepare("INSERT INTO usuarios (username, email, password_hash, avatar, monedas, inventario) VALUES (?, ?, ?, ?, 300, ?)");
        $stmt->execute([$data['username'], $data['email'], $hashed, $data['avatar'] ?? 0, $default_inv]);
        $id = $pdo->lastInsertId();
        $token = generate_token((int)$id);
        echo json_encode(["success" => true, "token" => $token, "usuario" => [
            "id" => $id,
            "username" => $data['username'],
            "avatar" => $data['avatar'] ?? 0,
            "monedas" => 300,
            "inventario" => json_decode($default_inv, true),
            "permitir_encuentros" => 1
        ]]);
    }
    elseif (strpos($route, '/auth/login') === 0 && $method === 'POST') {
        $data = get_json_input();
        $stmt = $pdo->prepare("SELECT * FROM usuarios WHERE email = ?");
        $stmt->execute([$data['email']]);
        $u = $stmt->fetch();
        if ($u && password_verify($data['password'], $u['password_hash'])) {
            $inv = json_decode($u['inventario'] ?? '{"pokeball":5,"superball":0,"potion":2,"superpotion":0}', true);
            if (!$inv) {
                $inv = ["pokeball" => 5, "superball" => 0, "potion" => 2, "superpotion" => 0];
            }
            $token = generate_token((int)$u['id']);
            echo json_encode(["success" => true, "token" => $token, "usuario" => [
                "id" => $u['id'],
                "username" => $u['username'],
                "avatar" => $u['avatar'],
                "starter_id" => $u['pokemon_inicial_id'],
                "starter_nombre" => $u['pokemon_inicial_nombre'],
                "monedas" => (int)($u['monedas'] ?? 300),
                "inventario" => $inv,
                "permitir_encuentros" => (int)($u['permitir_encuentros'] ?? 1)
            ]]);
        } else {
            http_response_code(401);
            echo json_encode(["success" => false, "error" => "Credenciales inválidas"]);
        }
    }
    // ─── STARTER ───────────────────────────────────────────────────────────────
    elseif (strpos($route, '/starter/info') === 0) {
        $uid = get_user_id();
        $stmt = $pdo->prepare("SELECT p.* FROM pokemon_coleccion p 
                               JOIN usuarios u ON p.usuario_id = u.id 
                               WHERE u.id = ? AND p.is_partner = 1 
                               LIMIT 1");
        $stmt->execute([$uid]);
        $p = $stmt->fetch();
        
        if ($p) {
            echo json_encode([
                "success" => true, 
                "starter" => [
                    "pokemon_id" => $p['pokemon_id'], 
                    "pokemon_nombre" => $p['pokemon_nombre'],
                    "level" => (int)$p['nivel'],
                    "nivel" => (int)$p['nivel'],
                    "xp" => (int)$p['xp'],
                    "exp" => (int)$p['xp']
                ]
            ]);
        } else {
            // Fallback
            $stmt = $pdo->prepare("SELECT pokemon_inicial_id, pokemon_inicial_nombre FROM usuarios WHERE id = ?");
            $stmt->execute([$uid]);
            $u = $stmt->fetch();
            echo json_encode(["success" => true, "starter" => $u ? ["pokemon_id" => $u['pokemon_inicial_id'], "pokemon_nombre" => $u['pokemon_inicial_nombre'], "nivel" => 5, "xp" => 0] : null]);
        }
    }
    elseif (strpos($route, '/starter/elegir') === 0 && $method === 'POST') {
        $uid = get_user_id();
        $data = get_json_input();
        $pdo->prepare("UPDATE usuarios SET pokemon_inicial_id = ?, pokemon_inicial_nombre = ? WHERE id = ?")->execute([$data['pokemon_id'], $data['pokemon_nombre'], $uid]);
        $pdo->prepare("INSERT INTO pokemon_coleccion (usuario_id, pokemon_id, pokemon_nombre, gimnasio_origen, xp, nivel, is_partner) VALUES (?, ?, ?, 'starter', 0, 5, 1)")->execute([$uid, $data['pokemon_id'], $data['pokemon_nombre']]);
        echo json_encode(["success" => true]);
    }
    // ─── HÁBITOS ──────────────────────────────────────────────────────────────
    elseif (strpos($route, '/habitos/hoy') === 0) {
        $uid = get_user_id();
        $today = date('Y-m-d');
        
        // 1. Sincronizar SIEMPRE los hábitos activos con la tabla de hoy
        // Esto asegura que si se añade un hábito a mitad del día en la configuración, 
        // aparezca inmediatamente en el combate.
        $sqlTpls = "SELECT g.gym_id, h.id as habito_id, h.nombre, h.daño, h.icono 
                    FROM habitos_template h
                    JOIN pokemon_template p ON h.pokemon_template_id = p.id
                    JOIN gimnasios_template g ON p.gym_id = g.gym_id
                    WHERE h.activo = 1 AND g.activo = 1";
        $tpls = $pdo->query($sqlTpls)->fetchAll();
        
        foreach ($tpls as $t) {
            $ins = $pdo->prepare("INSERT IGNORE INTO habitos (usuario_id, gimnasio_id, habito_id, habito_nombre, fecha) VALUES (?,?,?,?,?)");
            $ins->execute([$uid, $t['gym_id'], $t['habito_id'], $t['nombre'], $today]);
        }

        // 2. Recuperar la lista final con los datos actualizados de la plantilla
        $sql = "SELECT h.*, t.icono, t.daño, t.nombre as current_nombre, t.activo as h_activo, g.activo as g_activo, g.tiempo
                FROM habitos h 
                JOIN habitos_template t ON h.habito_id = t.id 
                JOIN gimnasios_template g ON h.gimnasio_id = g.gym_id
                WHERE h.usuario_id = ? AND h.fecha = ?";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$uid, $today]);
        $habitos = $stmt->fetchAll();
        
        // Filter and map fields for frontend consistency
        $res = [];
        foreach ($habitos as $h) {
            // Only include if both habit and gym are active
            if ($h['h_activo'] && $h['g_activo']) {
                $res[] = [
                    "gym_id" => $h['gimnasio_id'],
                    "habito_id" => $h['habito_id'],
                    "nombre" => $h['current_nombre'] ?? $h['habito_nombre'],
                    "icono" => $h['icono'] ?? '⚔️',
                    "daño" => (int)($h['daño'] ?? 20),
                    "completado" => (bool)$h['completado'],
                    "tiempo" => $h['tiempo'] ?? 'day'
                ];
            }
        }
        
        echo json_encode(["success" => true, "habitos" => $res]);
    }
    elseif (strpos($route, '/habitos/completar') === 0 && $method === 'POST') {
        $uid = get_user_id();
        $data = get_json_input();
        $today = date('Y-m-d');
        
        // Marcar hábito como completado
        $pdo->prepare("UPDATE habitos SET completado = 1 WHERE usuario_id = ? AND gimnasio_id = ? AND habito_id = ? AND fecha = ?")->execute([$uid, $data['gym_id'], $data['habito_id'], $today]);
        
        // Otorgar XP al partner
        $xp_gain = 20;
        $pdo->prepare("UPDATE pokemon_coleccion SET xp = xp + ? WHERE usuario_id = ? AND is_partner = 1")->execute([$xp_gain, $uid]);
        
        // Otorgar monedas
        $monedas_gain = 10;
        $pdo->prepare("UPDATE usuarios SET monedas = monedas + ? WHERE id = ?")->execute([$monedas_gain, $uid]);
        
        // Obtener monedas e inventario actualizados
        $stmt_user = $pdo->prepare("SELECT monedas, inventario FROM usuarios WHERE id = ?");
        $stmt_user->execute([$uid]);
        $user_row = $stmt_user->fetch();
        $new_monedas = (int)($user_row['monedas'] ?? 300);
        $inv = parse_inventory($user_row['inventario']);

        // Manejar Level Up (XP >= 100)
        $stmt = $pdo->prepare("SELECT id, xp, nivel FROM pokemon_coleccion WHERE usuario_id = ? AND is_partner = 1");
        $stmt->execute([$uid]);
        $p = $stmt->fetch();
        
        $leveledUp = false;
        if ($p && $p['xp'] >= 100) {
            $newXp = $p['xp'] - 100;
            $newLevel = $p['nivel'] + 1;
            $pdo->prepare("UPDATE pokemon_coleccion SET xp = ?, nivel = ? WHERE id = ?")->execute([$newXp, $newLevel, $p['id']]);
            $leveledUp = true;
            $p['xp'] = $newXp;
            $p['nivel'] = $newLevel;
        }

        echo json_encode([
            "success" => true, 
            "xp_gain" => $xp_gain, 
            "leveled_up" => $leveledUp,
            "new_xp" => (int)$p['xp'],
            "new_level" => (int)$p['nivel'],
            "monedas" => $new_monedas,
            "inventario" => $inv
        ]);
    }
    elseif (strpos($route, '/habitos/reset') === 0 && $method === 'POST') {
        $uid = get_user_id();
        $today = date('Y-m-d');
        
        // Delete today's progress in both tables
        $pdo->prepare("DELETE FROM habitos WHERE usuario_id = ? AND fecha = ?")->execute([$uid, $today]);
        $pdo->prepare("DELETE FROM progreso_diario WHERE usuario_id = ? AND fecha = ?")->execute([$uid, $today]);
        
        echo json_encode(["success" => true, "message" => "Día reiniciado correctamente"]);
    }
    // ─── GIMNASIOS ────────────────────────────────────────────────────────────
    elseif (strpos($route, '/gimnasios/hoy') === 0) {
        $uid = get_user_id();
        $today = date('Y-m-d');
        $stmt = $pdo->prepare("SELECT gimnasios_completados FROM progreso_diario WHERE usuario_id = ? AND fecha = ?");
        $stmt->execute([$uid, $today]);
        $row = $stmt->fetch();
        echo json_encode(["success" => true, "gimnasios" => json_decode($row['gimnasios_completados'] ?? '[]')]);
    }
    elseif (strpos($route, '/gimnasios/completar') === 0 && $method === 'POST') {
        $uid = get_user_id();
        $data = get_json_input();
        $today = date('Y-m-d');
        // Update progress
        $stmt = $pdo->prepare("SELECT gimnasios_completados FROM progreso_diario WHERE usuario_id = ? AND fecha = ?");
        $stmt->execute([$uid, $today]);
        $row = $stmt->fetch();
        $gyms = json_decode($row['gimnasios_completados'] ?? '[]', true);
        if (!in_array($data['gym_id'], $gyms)) {
            $gyms[] = $data['gym_id'];
            $pdo->prepare("INSERT INTO progreso_diario (usuario_id, fecha, gimnasios_completados) VALUES (?,?,?) ON DUPLICATE KEY UPDATE gimnasios_completados = ?")->execute([$uid, $today, json_encode($gyms), json_encode($gyms)]);
            
            // Otorgar pokemon a colección
            $pdo->prepare("INSERT INTO pokemon_coleccion (usuario_id, pokemon_id, pokemon_nombre, gimnasio_origen, xp, nivel) VALUES (?, ?, ?, ?, 0, 5)")->execute([$uid, $data['pokemon_id'], $data['pokemon_nombre'], $data['gym_id']]);
        }
        
        // Otorgar monedas (120 coins)
        $monedas_gain = 120;
        $pdo->prepare("UPDATE usuarios SET monedas = monedas + ? WHERE id = ?")->execute([$monedas_gain, $uid]);
        
        $stmt_user = $pdo->prepare("SELECT monedas, inventario FROM usuarios WHERE id = ?");
        $stmt_user->execute([$uid]);
        $user_row = $stmt_user->fetch();
        $total_monedas = (int)($user_row['monedas'] ?? 300);
        $inv = parse_inventory($user_row['inventario']);

        echo json_encode([
            "success" => true,
            "monedas" => $total_monedas,
            "total_monedas" => $total_monedas,
            "inventario" => $inv
        ]);
    }
    elseif (strpos($route, '/battle/victory') === 0 && $method === 'POST') {
        $uid = get_user_id();
        $xp_gain = 10;
        $pdo->prepare("UPDATE pokemon_coleccion SET xp = xp + ? WHERE usuario_id = ? AND is_partner = 1")->execute([$xp_gain, $uid]);
        
        // Otorgar monedas (15 coins)
        $monedas_gain = 15;
        $pdo->prepare("UPDATE usuarios SET monedas = monedas + ? WHERE id = ?")->execute([$monedas_gain, $uid]);
        
        $stmt_user = $pdo->prepare("SELECT monedas, inventario FROM usuarios WHERE id = ?");
        $stmt_user->execute([$uid]);
        $user_row = $stmt_user->fetch();
        $total_monedas = (int)($user_row['monedas'] ?? 300);
        $inv = parse_inventory($user_row['inventario']);

        $stmt = $pdo->prepare("SELECT id, xp, nivel FROM pokemon_coleccion WHERE usuario_id = ? AND is_partner = 1");
        $stmt->execute([$uid]);
        $p = $stmt->fetch();
        
        $leveledUp = false;
        if ($p && $p['xp'] >= 100) {
            $newXp = $p['xp'] - 100;
            $newLevel = $p['nivel'] + 1;
            $pdo->prepare("UPDATE pokemon_coleccion SET xp = ?, nivel = ? WHERE id = ?")->execute([$newXp, $newLevel, $p['id']]);
            $leveledUp = true;
            $p['xp'] = $newXp;
            $p['nivel'] = $newLevel;
        }

        echo json_encode([
            "success" => true,
            "xp_gain" => $xp_gain,
            "leveled_up" => $leveledUp,
            "new_xp" => (int)$p['xp'],
            "new_level" => (int)$p['nivel'],
            "monedas_ganadas" => $monedas_gain,
            "monedas" => $total_monedas,
            "inventario" => $inv
        ]);
    }
    // ─── TIENDA & INVENTARIO ──────────────────────────────────────────────────
    elseif (strpos($route, '/tienda/comprar') === 0 && $method === 'POST') {
        $uid = get_user_id();
        $data = get_json_input();
        $item_id = $data['item_id'];
        $cantidad = isset($data['cantidad']) ? (int)$data['cantidad'] : 1;
        
        $precios = [
            'pokeball' => 50,
            'superball' => 100,
            'potion' => 30,
            'superpotion' => 60
        ];
        
        if (!isset($precios[$item_id])) {
            http_response_code(400);
            echo json_encode(["success" => false, "error" => "Objeto no válido"]);
            exit();
        }
        
        $costo_total = $precios[$item_id] * $cantidad;
        
        $stmt = $pdo->prepare("SELECT monedas, inventario FROM usuarios WHERE id = ?");
        $stmt->execute([$uid]);
        $u = $stmt->fetch();
        
        if (!$u) {
            http_response_code(404);
            echo json_encode(["success" => false, "error" => "Usuario no encontrado"]);
            exit();
        }
        
        $monedas = (int)($u['monedas'] ?? 300);
        if ($monedas < $costo_total) {
            http_response_code(400);
            echo json_encode(["success" => false, "error" => "No tienes suficientes monedas"]);
            exit();
        }

        $new_monedas = $monedas - $costo_total;
        $inv = parse_inventory($u['inventario']);
        
        $inv[$item_id] = ($inv[$item_id] ?? 0) + $cantidad;
        $inv_json = json_encode($inv);
        
        $pdo->prepare("UPDATE usuarios SET monedas = ?, inventario = ? WHERE id = ?")->execute([$new_monedas, $inv_json, $uid]);
        
        $stmt_full = $pdo->prepare("SELECT * FROM usuarios WHERE id = ?");
        $stmt_full->execute([$uid]);
        $u_full = $stmt_full->fetch();
        
        echo json_encode([
            "success" => true,
            "monedas" => $new_monedas,
            "inventario" => $inv,
            "usuario" => [
                "id" => $u_full['id'],
                "username" => $u_full['username'],
                "email" => $u_full['email'],
                "avatar" => $u_full['avatar'],
                "starter_id" => $u_full['pokemon_inicial_id'],
                "starter_nombre" => $u_full['pokemon_inicial_nombre'],
                "monedas" => $new_monedas,
                "inventario" => $inv
            ]
        ]);
    }
    elseif (strpos($route, '/usuario/usar_item') === 0 && $method === 'POST') {
        $uid = get_user_id();
        $data = get_json_input();
        $item_id = $data['item_id'];
        
        $stmt = $pdo->prepare("SELECT monedas, inventario FROM usuarios WHERE id = ?");
        $stmt->execute([$uid]);
        $u = $stmt->fetch();
        
        if (!$u) {
            http_response_code(404);
            echo json_encode(["success" => false, "error" => "Usuario no encontrado"]);
            exit();
        }
        
        $inv = parse_inventory($u['inventario']);

        if (($inv[$item_id] ?? 0) <= 0) {
            http_response_code(400);
            echo json_encode(["success" => false, "error" => "No tienes este objeto"]);
            exit();
        }
        
        if (in_array($item_id, ['potion', 'superpotion'])) {
            $inv[$item_id] -= 1;
            $inv_json = json_encode($inv);
            $pdo->prepare("UPDATE usuarios SET inventario = ? WHERE id = ?")->execute([$inv_json, $uid]);
            
            $stmt_full = $pdo->prepare("SELECT * FROM usuarios WHERE id = ?");
            $stmt_full->execute([$uid]);
            $u_full = $stmt_full->fetch();
            
            echo json_encode([
                "success" => true,
                "inventario" => $inv,
                "usuario" => [
                    "id" => $u_full['id'],
                    "username" => $u_full['username'],
                    "email" => $u_full['email'],
                    "avatar" => $u_full['avatar'],
                    "starter_id" => $u_full['pokemon_inicial_id'],
                    "starter_nombre" => $u_full['pokemon_inicial_nombre'],
                    "monedas" => (int)$u_full['monedas'],
                    "inventario" => $inv
                ],
                "message" => "¡Se usó " . strtoupper($item_id) . "!"
            ]);
        } else {
            http_response_code(400);
            echo json_encode(["success" => false, "error" => "Este objeto no se puede usar fuera de batalla o no es consumible"]);
        }
    }
    elseif (strpos($route, '/usuario/configurar_encuentros') === 0 && $method === 'POST') {
        $uid = get_user_id();
        $data = get_json_input();
        $permitir = isset($data['permitir_encuentros']) ? $data['permitir_encuentros'] : null;
        
        if ($permitir === null) {
            http_response_code(400);
            echo json_encode(["success" => false, "error" => "Parámetro 'permitir_encuentros' requerido"]);
            exit();
        }
        
        $val = $permitir ? 1 : 0;
        $pdo->prepare("UPDATE usuarios SET permitir_encuentros = ? WHERE id = ?")->execute([$val, $uid]);
        
        $stmt_full = $pdo->prepare("SELECT * FROM usuarios WHERE id = ?");
        $stmt_full->execute([$uid]);
        $u_full = $stmt_full->fetch();
        
        $inv = parse_inventory($u_full['inventario']);

        echo json_encode([
            "success" => true,
            "permitir_encuentros" => $val,
            "usuario" => [
                "id" => $u_full['id'],
                "username" => $u_full['username'],
                "email" => $u_full['email'],
                "avatar" => $u_full['avatar'],
                "starter_id" => $u_full['pokemon_inicial_id'],
                "starter_nombre" => $u_full['pokemon_inicial_nombre'],
                "monedas" => (int)$u_full['monedas'],
                "inventario" => $inv,
                "permitir_encuentros" => $val
            ]
        ]);
    }
    // ─── COLECCIÓN (CAPTURAR) ─────────────────────────────────────────────────
    elseif (strpos($route, '/coleccion/evolucionar') === 0 && $method === 'POST') {
        $uid = get_user_id();
        $data = get_json_input();
        $to_id   = $data['to_id']   ?? null;
        $to_name = $data['to_name'] ?? $to_id;
        if (!$to_id) {
            http_response_code(400);
            echo json_encode(["success" => false, "error" => "to_id requerido"]);
            exit();
        }
        $pdo->prepare("UPDATE pokemon_coleccion SET pokemon_id = ?, pokemon_nombre = ? WHERE usuario_id = ? AND is_partner = 1")
            ->execute([$to_id, $to_name, $uid]);
        $pdo->prepare("UPDATE usuarios SET pokemon_inicial_id = ?, pokemon_inicial_nombre = ? WHERE id = ?")
            ->execute([$to_id, $to_name, $uid]);
        echo json_encode(["success" => true]);
    }
    elseif (strpos($route, '/coleccion/capturar') === 0 && $method === 'POST') {
        $uid = get_user_id();
        $data = get_json_input();
        $ball_type = $data['ball_type'] ?? 'pokeball';

        // Whitelist valid ball types to prevent inventory manipulation
        $catch_rates = ['pokeball' => 45, 'superball' => 70];
        if (!array_key_exists($ball_type, $catch_rates)) {
            http_response_code(400);
            echo json_encode(["success" => false, "error" => "Tipo de bola no válido"]);
            exit();
        }

        $stmt = $pdo->prepare("SELECT monedas, inventario FROM usuarios WHERE id = ?");
        $stmt->execute([$uid]);
        $u = $stmt->fetch();

        if (!$u) {
            http_response_code(404);
            echo json_encode(["success" => false, "error" => "Usuario no encontrado"]);
            exit();
        }

        $inv = parse_inventory($u['inventario']);

        if (($inv[$ball_type] ?? 0) <= 0) {
            http_response_code(400);
            echo json_encode(["success" => false, "error" => "¡No tienes " . strtoupper($ball_type) . " en tu mochila!"]);
            exit();
        }

        // Always consume the ball
        $inv[$ball_type] -= 1;
        $pdo->prepare("UPDATE usuarios SET inventario = ? WHERE id = ?")->execute([json_encode($inv), $uid]);

        // Server-side catch rate calculation
        $caught = mt_rand(1, 100) <= $catch_rates[$ball_type];

        if ($caught) {
            $pdo->prepare("INSERT INTO pokemon_coleccion (usuario_id, pokemon_id, pokemon_nombre, gimnasio_origen, xp, nivel) VALUES (?, ?, ?, 'wild', 0, 5)")
                ->execute([$uid, $data['pokemon_id'], $data['pokemon_nombre']]);
        }

        $stmt_full = $pdo->prepare("SELECT * FROM usuarios WHERE id = ?");
        $stmt_full->execute([$uid]);
        $u_full = $stmt_full->fetch();

        echo json_encode([
            "success" => $caught,
            "monedas" => (int)$u_full['monedas'],
            "inventario" => $inv,
            "usuario" => [
                "id" => $u_full['id'],
                "username" => $u_full['username'],
                "email" => $u_full['email'],
                "avatar" => $u_full['avatar'],
                "starter_id" => $u_full['pokemon_inicial_id'],
                "starter_nombre" => $u_full['pokemon_inicial_nombre'],
                "monedas" => (int)$u_full['monedas'],
                "inventario" => $inv
            ]
        ]);
    }
    elseif (strpos($route, '/coleccion') === 0) {
        $uid = get_user_id();
        $stmt = $pdo->prepare("SELECT * FROM pokemon_coleccion WHERE usuario_id = ?");
        $stmt->execute([$uid]);
        echo json_encode(["success" => true, "pokemon" => $stmt->fetchAll()]);
    }
    // ─── AMIGOS ───────────────────────────────────────────────────────────────
    elseif (strpos($route, '/amigos/enviar') === 0 && $method === 'POST') {
        $uid = get_user_id();
        $data = get_json_input();
        $friend_username = trim($data['username'] ?? '');
        
        if (empty($friend_username)) {
            http_response_code(400);
            echo json_encode(["success" => false, "error" => "El nombre de usuario es obligatorio."]);
            exit();
        }
        
        // Buscar el usuario por nombre
        $stmt = $pdo->prepare("SELECT id, username FROM usuarios WHERE username = ?");
        $stmt->execute([$friend_username]);
        $friend = $stmt->fetch();
        
        if (!$friend) {
            http_response_code(404);
            echo json_encode(["success" => false, "error" => "No se encontró ningún entrenador con ese nombre."]);
            exit();
        }
        
        $friend_id = (int)$friend['id'];
        if ($friend_id === $uid) {
            http_response_code(400);
            echo json_encode(["success" => false, "error" => "No puedes agregarte a ti mismo como amigo."]);
            exit();
        }
        
        $u1 = min($uid, $friend_id);
        $u2 = max($uid, $friend_id);
        
        $stmt = $pdo->prepare("SELECT * FROM amigos WHERE usuario_id_1 = ? AND usuario_id_2 = ?");
        $stmt->execute([$u1, $u2]);
        $existing = $stmt->fetch();
        
        if ($existing) {
            if ($existing['estado'] === 'aceptado') {
                http_response_code(400);
                echo json_encode(["success" => false, "error" => "Ya eres amigo de " . $friend['username'] . "."]);
            } else {
                if ((int)$existing['solicitado_por'] === $uid) {
                    http_response_code(400);
                    echo json_encode(["success" => false, "error" => "Ya has enviado una solicitud a " . $friend['username'] . "."]);
                } else {
                    http_response_code(400);
                    echo json_encode(["success" => false, "error" => $friend['username'] . " ya te ha enviado una solicitud. ¡Acéptala en tu bandeja!"]);
                }
            }
            exit();
        }
        
        $stmt = $pdo->prepare("INSERT INTO amigos (usuario_id_1, usuario_id_2, estado, solicitado_por) VALUES (?, ?, 'pendiente', ?)");
        $stmt->execute([$u1, $u2, $uid]);
        
        echo json_encode(["success" => true, "message" => "Solicitud de amistad enviada a " . $friend['username'] . "."]);
    }
    elseif (strpos($route, '/amigos/aceptar') === 0 && $method === 'POST') {
        $uid = get_user_id();
        $data = get_json_input();
        $friend_id = (int)($data['friend_id'] ?? 0);
        
        $u1 = min($uid, $friend_id);
        $u2 = max($uid, $friend_id);
        
        $stmt = $pdo->prepare("SELECT * FROM amigos WHERE usuario_id_1 = ? AND usuario_id_2 = ? AND estado = 'pendiente'");
        $stmt->execute([$u1, $u2]);
        $req = $stmt->fetch();
        
        if (!$req) {
            http_response_code(404);
            echo json_encode(["success" => false, "error" => "No se encontró la solicitud de amistad."]);
            exit();
        }
        
        if ((int)$req['solicitado_por'] === $uid) {
            http_response_code(400);
            echo json_encode(["success" => false, "error" => "No puedes aceptar tu propia solicitud."]);
            exit();
        }
        
        $stmt = $pdo->prepare("UPDATE amigos SET estado = 'aceptado' WHERE usuario_id_1 = ? AND usuario_id_2 = ?");
        $stmt->execute([$u1, $u2]);
        
        echo json_encode(["success" => true, "message" => "¡Solicitud de amistad aceptada!"]);
    }
    elseif (strpos($route, '/amigos/rechazar') === 0 && $method === 'POST') {
        $uid = get_user_id();
        $data = get_json_input();
        $friend_id = (int)($data['friend_id'] ?? 0);
        
        $u1 = min($uid, $friend_id);
        $u2 = max($uid, $friend_id);
        
        $stmt = $pdo->prepare("DELETE FROM amigos WHERE usuario_id_1 = ? AND usuario_id_2 = ?");
        $stmt->execute([$u1, $u2]);
        
        echo json_encode(["success" => true, "message" => "Amistad o solicitud eliminada."]);
    }
    // MMO: obtener gimnasios de un amigo específico hoy
    elseif (preg_match('/^\/amigos\/(\d+)\/gimnasios$/', $route, $rm) && $method === 'GET') {
        $uid = get_user_id();
        $fid = (int)$rm[1];
        $chk = $pdo->prepare("SELECT id FROM amigos WHERE estado='aceptado' AND ((usuario_id_1=? AND usuario_id_2=?) OR (usuario_id_1=? AND usuario_id_2=?))");
        $chk->execute([$uid, $fid, $fid, $uid]);
        if (!$chk->fetch()) { http_response_code(403); echo json_encode(["success"=>false,"error"=>"No son amigos"]); exit; }
        $stmt = $pdo->prepare("SELECT gimnasios_completados FROM progreso_diario WHERE usuario_id=? AND fecha=CURDATE()");
        $stmt->execute([$fid]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        $gyms = json_decode($row['gimnasios_completados'] ?? '[]', true) ?: [];
        echo json_encode(["success"=>true, "friend_id"=>$fid, "gimnasios_completados"=>$gyms]);
    }
    elseif (strpos($route, '/amigos') === 0) {
        $uid = get_user_id();
        
        // Amigos aceptados — counts agregados en el mismo JOIN para evitar N+1
        $sql = "SELECT a.id as amistad_id,
                       u.id as friend_id, u.username, u.avatar, u.monedas,
                       p.pokemon_id, p.pokemon_nombre, p.nivel as partner_level,
                       COUNT(h.id) as habitos_completados,
                       COUNT(DISTINCT h.gimnasio_id) as medallas
                FROM amigos a
                JOIN usuarios u ON u.id = IF(a.usuario_id_1 = ?, a.usuario_id_2, a.usuario_id_1)
                LEFT JOIN pokemon_coleccion p ON p.usuario_id = u.id AND p.is_partner = 1
                LEFT JOIN habitos h ON h.usuario_id = u.id AND h.completado = 1
                WHERE (a.usuario_id_1 = ? OR a.usuario_id_2 = ?) AND a.estado = 'aceptado'
                GROUP BY a.id, u.id, p.pokemon_id, p.pokemon_nombre, p.nivel";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$uid, $uid, $uid]);
        $amigos = $stmt->fetchAll();
        
        // Solicitudes recibidas
        $sql = "SELECT a.id as amistad_id, 
                       u.id as friend_id, u.username, u.avatar,
                       p.pokemon_id, p.pokemon_nombre, p.nivel as partner_level
                FROM amigos a
                JOIN usuarios u ON u.id = a.solicitado_por
                LEFT JOIN pokemon_coleccion p ON p.usuario_id = u.id AND p.is_partner = 1
                WHERE (a.usuario_id_1 = ? OR a.usuario_id_2 = ?) AND a.estado = 'pendiente' AND a.solicitado_por != ?";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$uid, $uid, $uid]);
        $recibidas = $stmt->fetchAll();
        
        // Solicitudes enviadas
        $sql = "SELECT a.id as amistad_id, 
                       u.id as friend_id, u.username, u.avatar,
                       p.pokemon_id, p.pokemon_nombre, p.nivel as partner_level
                FROM amigos a
                JOIN usuarios u ON u.id = IF(a.usuario_id_1 = ?, a.usuario_id_2, a.usuario_id_1)
                LEFT JOIN pokemon_coleccion p ON p.usuario_id = u.id AND p.is_partner = 1
                WHERE (a.usuario_id_1 = ? OR a.usuario_id_2 = ?) AND a.estado = 'pendiente' AND a.solicitado_por = ?";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$uid, $uid, $uid, $uid]);
        $enviadas = $stmt->fetchAll();
        
        echo json_encode([
            "success" => true,
            "amigos" => $amigos,
            "recibidas" => $recibidas,
            "enviadas" => $enviadas
        ]);
    }
    // ─── ESTADÍSTICAS ─────────────────────────────────────────────────────────
    elseif (strpos($route, '/stats') === 0) {
        $uid = get_user_id();
        
        // 1. Total habitos completados
        $hStmt = $pdo->prepare("SELECT COUNT(*) FROM habitos WHERE usuario_id = ? AND completado = 1");
        $hStmt->execute([$uid]);
        $total_habitos = (int)$hStmt->fetchColumn();
        
        // 2. Medallas (Gyms completados históricamente)
        $gStmt = $pdo->prepare("SELECT COUNT(DISTINCT gimnasio_id) FROM habitos WHERE usuario_id = ? AND completado = 1");
        $gStmt->execute([$uid]);
        $total_medallas = (int)$gStmt->fetchColumn();
        
        // 3. Días activo
        $rStmt = $pdo->prepare("SELECT COUNT(DISTINCT fecha) FROM habitos WHERE usuario_id = ? AND completado = 1");
        $rStmt->execute([$uid]);
        $total_dias = (int)$rStmt->fetchColumn();

        echo json_encode([
            "success" => true,
            "stats" => [
                "habitos_completados" => $total_habitos,
                "medallas" => $total_medallas,
                "dias_activo" => $total_dias
            ]
        ]);
    }
    // ─── ADMIN PRESETS ────────────────────────────────────────────────────────
    elseif (strpos($route, '/admin/presets') === 0) {
        $uid = get_user_id();
        if ($method === 'GET') {
            $stmt = $pdo->prepare("SELECT * FROM habito_presets WHERE usuario_id = ? ORDER BY created_at DESC");
            $stmt->execute([$uid]);
            $rows = $stmt->fetchAll();
            $res = array_map(function($r) {
                return [
                    "id" => $r['id'],
                    "nombre" => $r['nombre'],
                    "config" => json_decode($r['config_json'], true)
                ];
            }, $rows);
            echo json_encode(["success" => true, "presets" => $res]);
        } elseif ($method === 'POST') {
            $data = get_json_input();
            $stmt = $pdo->prepare("INSERT INTO habito_presets (usuario_id, nombre, config_json) VALUES (?, ?, ?)");
            $stmt->execute([$uid, $data['nombre'], json_encode($data['config'])]);
            echo json_encode(["success" => true, "id" => $pdo->lastInsertId()]);
        } elseif ($method === 'DELETE') {
            $id = (int)str_replace('/admin/presets/', '', $route);
            $stmt = $pdo->prepare("DELETE FROM habito_presets WHERE id = ? AND usuario_id = ?");
            $stmt->execute([$id, $uid]);
            echo json_encode(["success" => true]);
        }
    }
    // ─── ADMIN CONFIG ─────────────────────────────────────────────────────────
    elseif (strpos($route, '/admin/config') === 0) {
        if ($method === 'GET') {
            $gyms = $pdo->query("SELECT * FROM gimnasios_template ORDER BY orden ASC")->fetchAll();
            $res = [];
            foreach ($gyms as $g) {
                $pks = $pdo->prepare("SELECT * FROM pokemon_template WHERE gym_id = ? ORDER BY orden_en_gym ASC");
                $pks->execute([$g['gym_id']]);
                $pokemon = $pks->fetchAll();
                
                $gym_habitos = [];
                foreach ($pokemon as &$p) {
                    $hbs = $pdo->prepare("SELECT * FROM habitos_template WHERE pokemon_template_id = ?");
                    $hbs->execute([$p['id']]);
                    $p['habitos'] = $hbs->fetchAll();
                    $gym_habitos = array_merge($gym_habitos, $p['habitos']);
                }
                
                $res[] = [
                    "gym_id" => $g['gym_id'],
                    "gym_nombre" => $g['gym_nombre'],
                    "tiempo" => $g['tiempo'] ?? 'day',
                    "activo" => (bool)($g['activo'] ?? true),
                    "habitos" => $gym_habitos,
                    "pokemon" => $pokemon
                ];
            }
            echo json_encode(["success" => true, "config" => $res]);
        } else {
            // POST: Simplified implementation for habitos_template updates
            $data = get_json_input();
            foreach ($data as $gym) {
                $habitos = $gym['habitos'] ?? [];
                $gym_id = $gym['gym_id'];
                
                $pdo->prepare("UPDATE gimnasios_template SET gym_nombre = ?, activo = ?, tiempo = ? WHERE gym_id = ?")
                    ->execute([$gym['gym_nombre'], $gym['activo'] ? 1 : 0, $gym['tiempo'] ?? 'day', $gym_id]);

                // Extract incoming habit IDs
                $incoming_habit_ids = array_map(function($h) { return $h['id']; }, $habitos);

                // Get all pokemon_template_ids for this gym
                $pStmt = $pdo->prepare("SELECT id FROM pokemon_template WHERE gym_id = ?");
                $pStmt->execute([$gym_id]);
                $pk_ids = $pStmt->fetchAll(PDO::FETCH_COLUMN);

                if (!empty($pk_ids)) {
                    $inQueryPk = implode(',', array_fill(0, count($pk_ids), '?'));
                    
                    if (empty($incoming_habit_ids)) {
                        // Si borramos TODOS los hábitos de este gimnasio
                        $delStmt = $pdo->prepare("DELETE FROM habitos_template WHERE pokemon_template_id IN ($inQueryPk)");
                        $delStmt->execute($pk_ids);
                        
                        // También los borramos de la lista de progreso de "hoy" para que desaparezcan en vivo
                        $delHoy = $pdo->prepare("DELETE FROM habitos WHERE gimnasio_id = ? AND fecha = ?");
                        $delHoy->execute([$gym_id, date('Y-m-d')]);
                    } else {
                        // Borramos los que pertenecen a este gimnasio pero NO están en la lista nueva
                        $inQueryHabits = implode(',', array_fill(0, count($incoming_habit_ids), '?'));
                        $delStmt = $pdo->prepare("DELETE FROM habitos_template WHERE pokemon_template_id IN ($inQueryPk) AND id NOT IN ($inQueryHabits)");
                        $delStmt->execute(array_merge($pk_ids, $incoming_habit_ids));
                        
                        // Y los borramos de "hoy"
                        $delHoy = $pdo->prepare("DELETE FROM habitos WHERE gimnasio_id = ? AND fecha = ? AND habito_id NOT IN ($inQueryHabits)");
                        $delHoy->execute(array_merge([$gym_id, date('Y-m-d')], $incoming_habit_ids));
                    }
                }

                foreach ($habitos as $h) {
                    $pStmt = $pdo->prepare("SELECT id FROM pokemon_template WHERE gym_id = ? LIMIT 1");
                    $pStmt->execute([$gym_id]);
                    $pk = $pStmt->fetch();
                    $pk_id = $pk['id'] ?? 1;

                    $h_activo = isset($h['activo']) ? ($h['activo'] ? 1 : 0) : 1;

                    $sql = "INSERT INTO habitos_template (id, pokemon_template_id, nombre, daño, icono, activo) 
                            VALUES (?, ?, ?, ?, ?, ?) 
                            ON DUPLICATE KEY UPDATE nombre = VALUES(nombre), daño = VALUES(daño), icono = VALUES(icono), activo = VALUES(activo)";
                    $pdo->prepare($sql)->execute([$h['id'], $pk_id, $h['nombre'], $h['daño'], $h['icono'], $h_activo]);
                }
            }
            echo json_encode(["success" => true]);
        }
    }
    // MMO: actualizar posición propia y obtener amigos en el mismo mapa
    elseif (strpos($route, '/mapa/posicion') === 0 && $method === 'POST') {
        $uid  = get_user_id();
        $data = get_json_input();
        $map  = $data['mapa_id']   ?? 'Map002';
        $x    = (int)($data['x']   ?? 0);
        $y    = (int)($data['y']   ?? 0);
        $dir  = (int)($data['direccion'] ?? 0);

        $pdo->prepare("INSERT INTO usuario_posicion (usuario_id,mapa_id,posicion_x,posicion_y,direccion)
                       VALUES (?,?,?,?,?)
                       ON DUPLICATE KEY UPDATE mapa_id=VALUES(mapa_id),posicion_x=VALUES(posicion_x),
                       posicion_y=VALUES(posicion_y),direccion=VALUES(direccion),ultima_actualizacion=NOW()")
            ->execute([$uid, $map, $x, $y, $dir]);

        $stmt = $pdo->prepare("
            SELECT u.id AS friend_id, u.username, u.avatar,
                   up.posicion_x, up.posicion_y, up.direccion,
                   pc.pokemon_id, pc.pokemon_nombre, pc.nivel AS partner_level,
                   pd.gimnasios_completados
            FROM amigos a
            JOIN usuarios u ON u.id = IF(a.usuario_id_1=?, a.usuario_id_2, a.usuario_id_1)
            JOIN usuario_posicion up ON up.usuario_id = u.id
            LEFT JOIN pokemon_coleccion pc ON pc.usuario_id = u.id AND pc.is_partner = 1
            LEFT JOIN progreso_diario pd ON pd.usuario_id = u.id AND pd.fecha = CURDATE()
            WHERE (a.usuario_id_1=? OR a.usuario_id_2=?)
              AND a.estado = 'aceptado'
              AND up.mapa_id = ?
              AND up.ultima_actualizacion >= DATE_SUB(NOW(), INTERVAL 10 SECOND)");
        $stmt->execute([$uid, $uid, $uid, $map]);
        $amigos = $stmt->fetchAll(PDO::FETCH_ASSOC);

        foreach ($amigos as &$a) {
            $a['friend_id']   = (int)$a['friend_id'];
            $a['avatar']      = (int)$a['avatar'];
            $a['posicion_x']  = (int)$a['posicion_x'];
            $a['posicion_y']  = (int)$a['posicion_y'];
            $a['direccion']   = (int)$a['direccion'];
            $a['partner_level'] = (int)$a['partner_level'];
            $a['gimnasios_completados'] = json_decode($a['gimnasios_completados'] ?? '[]', true) ?: [];
        }
        echo json_encode(["success" => true, "amigos_en_mapa" => $amigos]);
    }
    else {
        http_response_code(404);
        echo json_encode(["success" => false, "error" => "Ruta no encontrada: " . $route]);
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "error" => $e->getMessage()]);
}
