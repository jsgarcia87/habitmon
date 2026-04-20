<?php
/**
 * index.php - Sincronizado con api.js
 */
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

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
    if ($auth && preg_match('/Bearer\s(\d+)/', $auth, $matches)) {
        return (int)$matches[1];
    }
    return null;
}

try {
    // ─── AUTH ──────────────────────────────────────────────────────────────────
    if (strpos($route, '/auth/register') === 0 && $method === 'POST') {
        $data = get_json_input();
        $stmt = $pdo->prepare("INSERT INTO usuarios (username, email, password_hash, avatar) VALUES (?, ?, ?, ?)");
        $stmt->execute([$data['username'], $data['email'], $data['password'], $data['avatar'] ?? 0]);
        $id = $pdo->lastInsertId();
        echo json_encode(["success" => true, "token" => (string)$id, "usuario" => ["id" => $id, "username" => $data['username'], "avatar" => $data['avatar'] ?? 0]]);
    }
    elseif (strpos($route, '/auth/login') === 0 && $method === 'POST') {
        $data = get_json_input();
        $stmt = $pdo->prepare("SELECT * FROM usuarios WHERE email = ? AND password_hash = ?");
        $stmt->execute([$data['email'], $data['password']]);
        $u = $stmt->fetch();
        if ($u) {
            echo json_encode(["success" => true, "token" => (string)$u['id'], "usuario" => ["id" => $u['id'], "username" => $u['username'], "avatar" => $u['avatar'], "starter_id" => $u['pokemon_inicial_id']]]);
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
        
        $stmt = $pdo->prepare("SELECT h.*, t.icono, t.daño FROM habitos h 
                               JOIN habitos_template t ON h.habito_id = t.id 
                               WHERE h.usuario_id = ? AND h.fecha = ?");
        $stmt->execute([$uid, $today]);
        $habitos = $stmt->fetchAll();
        
        if (empty($habitos)) {
            // Autocreate from template
            $sql = "SELECT g.gym_id, h.id as habito_id, h.nombre, h.daño, h.icono 
                    FROM habitos_template h
                    JOIN pokemon_template p ON h.pokemon_template_id = p.id
                    JOIN gimnasios_template g ON p.gym_id = g.gym_id";
            $tpls = $pdo->query($sql)->fetchAll();
            
            foreach ($tpls as $t) {
                $ins = $pdo->prepare("INSERT IGNORE INTO habitos (usuario_id, gimnasio_id, habito_id, habito_nombre, fecha) VALUES (?,?,?,?,?)");
                $ins->execute([$uid, $t['gym_id'], $t['habito_id'], $t['nombre'], $today]);
            }
            
            // Re-fetch
            $stmt->execute([$uid, $today]);
            $habitos = $stmt->fetchAll();
        }
        
        // Map fields for frontend consistency
        $res = array_map(function($h) {
            return [
                "gym_id" => $h['gimnasio_id'],
                "habito_id" => $h['habito_id'],
                "nombre" => $h['habito_nombre'],
                "icono" => $h['icono'] ?? '⚔️',
                "daño" => (int)($h['daño'] ?? 20),
                "completado" => (bool)$h['completado']
            ];
        }, $habitos);
        
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
            "new_level" => (int)$p['nivel']
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
        }
        echo json_encode(["success" => true]);
    }
    elseif (strpos($route, '/battle/victory') === 0 && $method === 'POST') {
        $uid = get_user_id();
        $xp_gain = 10;
        $pdo->prepare("UPDATE pokemon_coleccion SET xp = xp + ? WHERE usuario_id = ? AND is_partner = 1")->execute([$xp_gain, $uid]);
        
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

        echo json_encode(["success" => true, "xp_gain" => $xp_gain, "leveled_up" => $leveledUp, "new_xp" => (int)$p['xp'], "new_level" => (int)$p['nivel']]);
    }
    // ─── COLECCIÓN ────────────────────────────────────────────────────────────
    elseif (strpos($route, '/coleccion') === 0) {
        $uid = get_user_id();
        $stmt = $pdo->prepare("SELECT * FROM pokemon_coleccion WHERE usuario_id = ?");
        $stmt->execute([$uid]);
        echo json_encode(["success" => true, "pokemon" => $stmt->fetchAll()]);
    }
    // ─── ADMIN ────────────────────────────────────────────────────────────────
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
                    "activo" => true,
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
                
                foreach ($habitos as $h) {
                    // Obtener primer pokemon del gym como padre por defecto para nuevos hábitos
                    $pStmt = $pdo->prepare("SELECT id FROM pokemon_template WHERE gym_id = ? LIMIT 1");
                    $pStmt->execute([$gym_id]);
                    $pk = $pStmt->fetch();
                    $pk_id = $pk['id'] ?? 1;

                    $sql = "INSERT INTO habitos_template (id, pokemon_template_id, nombre, daño, icono) 
                            VALUES (?, ?, ?, ?, ?) 
                            ON DUPLICATE KEY UPDATE nombre = VALUES(nombre), daño = VALUES(daño), icono = VALUES(icono)";
                    $pdo->prepare($sql)->execute([$h['id'], $pk_id, $h['nombre'], $h['daño'], $h['icono']]);
                }
            }
            echo json_encode(["success" => true]);
        }
    }
    else {
        http_response_code(404);
        echo json_encode(["success" => false, "error" => "Ruta no encontrada: " . $route]);
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "error" => $e->getMessage()]);
}
