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
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

// Detectar ruta relativa (soporta /habitmon/hb_api/index.php/ruta)
$script_name = $_SERVER['SCRIPT_NAME'];
$base_path = $script_name; // /habitmon/hb_api/index.php
$route = str_replace($base_path, '', $path);
$route = '/' . trim($route, '/');

function get_json_input() {
    return json_decode(file_get_contents('php://input'), true);
}

function get_user_id() {
    $headers = getallheaders();
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
        $stmt = $pdo->prepare("SELECT pokemon_inicial_id, pokemon_inicial_nombre FROM usuarios WHERE id = ?");
        $stmt->execute([$uid]);
        $u = $stmt->fetch();
        echo json_encode(["success" => true, "starter" => $u ? ["pokemon_id" => $u['pokemon_inicial_id'], "pokemon_nombre" => $u['pokemon_inicial_nombre']] : null]);
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
        // Autocreate if missing
        $stmt = $pdo->prepare("SELECT * FROM habitos WHERE usuario_id = ? AND fecha = ?");
        $stmt->execute([$uid, $today]);
        $habitos = $stmt->fetchAll();
        echo json_encode(["success" => true, "habitos" => $habitos]);
    }
    elseif (strpos($route, '/habitos/completar') === 0 && $method === 'POST') {
        $uid = get_user_id();
        $data = get_json_input();
        $today = date('Y-m-d');
        $pdo->prepare("UPDATE habitos SET completado = 1 WHERE usuario_id = ? AND gimnasio_id = ? AND habito_id = ? AND fecha = ?")->execute([$uid, $data['gym_id'], $data['habito_id'], $today]);
        echo json_encode(["success" => true]);
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
    // ─── COLECCIÓN ────────────────────────────────────────────────────────────
    elseif (strpos($route, '/coleccion') === 0) {
        $uid = get_user_id();
        $stmt = $pdo->prepare("SELECT * FROM pokemon_coleccion WHERE usuario_id = ?");
        $stmt->execute([$uid]);
        echo json_encode(["success" => true, "pokemon" => $stmt->fetchAll()]);
    }
    // ─── ADMIN ────────────────────────────────────────────────────────────────
    elseif (strpos($route, '/admin/config') === 0) {
        // Mock admin config for now
        echo json_encode(["success" => true, "config" => []]);
    }
    else {
        http_response_code(404);
        echo json_encode(["success" => false, "error" => "Ruta no encontrada: " . $route]);
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "error" => $e->getMessage()]);
}
