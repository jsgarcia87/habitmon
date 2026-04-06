<?php
require_once 'db.php';
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');

// Handle Options for CORS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$method = $_SERVER['REQUEST_METHOD'];
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

// --- Robust Path Detection ---
// We want to extract only the part after the API folder.
// Example: /habitmon/api/auth/login -> /auth/login
$script_name = $_SERVER['SCRIPT_NAME'];
$api_base = dirname($script_name); // Esto nos da por ejemplo '/habitmon/api'
$relative_path = str_replace($api_base, '', $path);
$relative_path = '/' . trim($relative_path, '/');

// Helper to get raw JSON input
function get_json_input() {
    return json_decode(file_get_contents('php://input'), true);
}

// Simple JWT-like auth check (for this demo, we'll use a Bearer token that is just the user_id)
// In production, use a real JWT library
function get_user_id() {
    $headers = getallheaders();
    if (isset($headers['Authorization'])) {
        $auth = $headers['Authorization'];
        if (preg_match('/Bearer\s(\d+)/', $auth, $matches)) {
            return (int)$matches[1];
        }
    }
    return null;
}

// Simple Token Creator (User ID for simplicity)
function create_token($user_id) {
    return (string)$user_id;
}

// API Routes
try {
    // Auth Routes
    if (strpos($relative_path, 'auth/register') !== false && $method === 'POST') {
        $data = get_json_input();
        $stmt = $pdo->prepare("INSERT INTO usuarios (username, email, password_hash, avatar) VALUES (?, ?, ?, ?)");
        $stmt->execute([$data['username'], $data['email'], $data['password'], $data['avatar'] ?? 0]);
        $id = $pdo->lastInsertId();
        echo json_encode(["success" => true, "token" => create_token($id), "usuario" => ["id" => $id, "username" => $data['username'], "avatar" => $data['avatar'] ?? 0]]);
    } 
    elseif (strpos($relative_path, 'auth/login') !== false && $method === 'POST') {
        $data = get_json_input();
        $stmt = $pdo->prepare("SELECT * FROM usuarios WHERE email = ? AND password_hash = ?");
        $stmt->execute([$data['email'], $data['password']]);
        $user = $stmt->fetch();
        if ($user) {
            echo json_encode(["success" => true, "token" => create_token($user['id']), "usuario" => ["id" => $user['id'], "username" => $user['username'], "avatar" => $user['avatar']]]);
        } else {
            http_response_code(401);
            echo json_encode(["success" => false, "error" => "Invalid credentials"]);
        }
    }

    // Gameplay Routes
    elseif (strpos($relative_path, 'coleccion') !== false && $method === 'GET') {
        $user_id = get_user_id();
        $stmt = $pdo->prepare("SELECT * FROM pokemon_coleccion WHERE usuario_id = ?");
        $stmt->execute([$user_id]);
        echo json_encode(["success" => true, "pokemon" => $stmt->fetchAll()]);
    }

    elseif (strpos($relative_path, 'habitos/template') !== false) {
        // Return same template as Flask
        $template = [
            ["gym_id" => "gym_vestirse", "gym_nombre" => "Gimnasio Vestirse", "pokemon" => [
                ["nombre" => "Quitarse Ropa", "id" => "052", "tasks" => [["id" => "q_pant", "nombre" => "Quitar pantalones"], ["id" => "q_cam", "nombre" => "Quitar camiseta"]]],
                ["nombre" => "Ponerse Ropa", "id" => "143", "tasks" => [["id" => "p_pant", "nombre" => "Ponerse pantalones"], ["id" => "p_cam", "nombre" => "Ponerse camiseta"]]]
            ]],
            ["gym_id" => "gym_desayuno", "gym_nombre" => "Gimnasio Desayuno", "pokemon" => [
                ["nombre" => "Desayuno", "id" => "094", "tasks" => [["id" => "d_leche", "nombre" => "Tomar leche"], ["id" => "d_tosta", "nombre" => "Comer tostadas"]]]
            ]],
            ["gym_id" => "gym_higiene", "gym_nombre" => "Gimnasio Higiene", "pokemon" => [
                ["nombre" => "Dientes", "id" => "019", "tasks" => [["id" => "h_dientes", "nombre" => "Lavarse los dientes"]]],
                ["nombre" => "Cara", "id" => "025", "tasks" => [["id" => "h_cara", "nombre" => "Lavarse la cara"]]]
            ]],
            ["gym_id" => "gym_orden", "gym_nombre" => "Gimnasio Orden", "pokemon" => [
                ["nombre" => "Habitación", "id" => "066", "tasks" => [["id" => "o_cuarto", "nombre" => "Recoger habitación"]]],
                ["nombre" => "Cama", "id" => "143", "tasks" => [["id" => "o_cama", "nombre" => "Hacer la cama"]]]
            ]]
        ];
        echo json_encode(["success" => true, "template" => $template]);
    }

    elseif (strpos($relative_path, 'progreso/setup') !== false && $method === 'POST') {
        $user_id = get_user_id();
        $data = get_json_input();
        $today = date('Y-m-d');
        
        $pdo->prepare("DELETE FROM habitos WHERE usuario_id = ? AND fecha = ?")->execute([$user_id, $today]);
        foreach ($data['habitos'] as $h) {
            $stmt = $pdo->prepare("INSERT INTO habitos (usuario_id, gimnasio_id, pokemon_index, habito_id, habito_nombre, fecha) VALUES (?, ?, ?, ?, ?, ?)");
            $stmt->execute([$user_id, $h['gym_id'], $h['pokemon_index'] ?? 0, $h['habito_id'], $h['habito_nombre'], $today]);
        }
        
        $stmt = $pdo->prepare("INSERT IGNORE INTO progreso_diario (usuario_id, fecha, gimnasios_completados) VALUES (?, ?, '[]')");
        $stmt->execute([$user_id, $today]);
        echo json_encode(["success" => true]);
    }

    elseif (strpos($relative_path, 'habito/completar') !== false && $method === 'POST') {
        $user_id = get_user_id();
        $data = get_json_input();
        $today = date('Y-m-d');
        $stmt = $pdo->prepare("UPDATE habitos SET completado = 1 WHERE usuario_id = ? AND gimnasio_id = ? AND habito_id = ? AND fecha = ?");
        $stmt->execute([$user_id, $data['gimnasio_id'], $data['habito_id'], $today]);
        echo json_encode(["success" => true]);
    }

    elseif (strpos($relative_path, 'gimnasio/completar') !== false && $method === 'POST') {
        $user_id = get_user_id();
        $data = get_json_input();
        $today = date('Y-m-d');
        
        $stmt = $pdo->prepare("SELECT gimnasios_completados FROM progreso_diario WHERE usuario_id = ? AND fecha = ?");
        $stmt->execute([$user_id, $today]);
        $row = $stmt->fetch();
        $gyms = json_decode($row['gimnasios_completados'] ?? '[]', true);
        
        if (!in_array($data['gimnasio_id'], $gyms)) {
            $gyms[] = $data['gimnasio_id'];
            $pdo->prepare("UPDATE progreso_diario SET gimnasios_completados = ? WHERE usuario_id = ? AND fecha = ?")->execute([json_encode($gyms), $user_id, $today]);
            
            $pdo->prepare("INSERT INTO pokemon_coleccion (usuario_id, pokemon_id, pokemon_nombre, gimnasio_origen, fecha_captura) VALUES (?, ?, ?, ?, ?)")
                ->execute([$user_id, $data['pokemon_id'], $data['pokemon_nombre'], $data['gimnasio_id'], $today]);
            
            echo json_encode(["success" => true, "pokemon_ganado" => $data['pokemon_nombre']]);
        }
    }

    elseif (strpos($relative_path, 'progreso/') !== false && $method === 'GET') {
        $user_id = get_user_id();
        $today = date('Y-m-d');
        
        $stmt = $pdo->prepare("SELECT * FROM progreso_diario WHERE usuario_id = ? AND fecha = ?");
        $stmt->execute([$user_id, $today]);
        $progreso = $stmt->fetch();
        
        $stmt = $pdo->prepare("SELECT * FROM habitos WHERE usuario_id = ? AND fecha = ?");
        $stmt->execute([$user_id, $today]);
        $habitos = $stmt->fetchAll();
        
        if (!$progreso) {
            echo json_encode(["success" => true, "setup_required" => true]);
        } else {
            echo json_encode([
                "success" => true,
                "setup_required" => false,
                "gimnasios_completados" => json_decode($progreso['gimnasios_completados']),
                "habitos" => $habitos
            ]);
        }
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "error" => $e->getMessage()]);
}
?>
