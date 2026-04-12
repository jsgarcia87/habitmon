<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);
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
    $auth = null;
    $headers = getallheaders();
    
    if (isset($headers['Authorization'])) {
        $auth = $headers['Authorization'];
    } elseif (isset($_SERVER['HTTP_AUTHORIZATION'])) {
        $auth = $_SERVER['HTTP_AUTHORIZATION'];
    } elseif (isset($_SERVER['REDIRECT_HTTP_AUTHORIZATION'])) {
        $auth = $_SERVER['REDIRECT_HTTP_AUTHORIZATION'];
    }
    
    if ($auth && preg_match('/Bearer\s(\d+)/', $auth, $matches)) {
        return (int)$matches[1];
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
        
        echo json_encode([
            "success" => true, 
            "token" => create_token($id), 
            "usuario" => [
                "id" => $id, 
                "username" => $data['username'], 
                "avatar" => $data['avatar'] ?? 0,
                "pokemon_inicial_id" => null
            ]
        ]);
    } 
    elseif (strpos($relative_path, 'auth/elegir-starter') !== false && $method === 'POST') {
        $user_id = get_user_id();
        if (!$user_id) { http_response_code(401); exit(json_encode(["error" => "No auth"])); }
        
        $data = get_json_input();
        $pkmnId = $data['pokemon_id'] ?? '001';
        $pkmnNombre = $data['pokemon_nombre'] ?? 'Bulbasaur';
        
        // Actualizar usuario
        $stmtUser = $pdo->prepare("UPDATE usuarios SET pokemon_inicial_id = ?, pokemon_inicial_nombre = ? WHERE id = ?");
        $stmtUser->execute([$pkmnId, $pkmnNombre, $user_id]);
        
        // Añadir a colección (7 columnas: usuario_id, pokemon_id, pokemon_nombre, gimnasio_origen, xp, nivel, is_partner)
        $stmtPoke = $pdo->prepare("INSERT INTO pokemon_coleccion (usuario_id, pokemon_id, pokemon_nombre, gimnasio_origen, xp, nivel, is_partner) VALUES (?, ?, ?, 'starter', 0, 5, 1)");
        $stmtPoke->execute([$user_id, $pkmnId, $pkmnNombre]);
        
        echo json_encode(["success" => true]);
    }
    elseif (strpos($relative_path, 'auth/login') !== false && $method === 'POST') {
        $data = get_json_input();
        $stmt = $pdo->prepare("SELECT * FROM usuarios WHERE email = ? AND password_hash = ?");
        $stmt->execute([$data['email'], $data['password']]);
        $user = $stmt->fetch();
        if ($user) {
            echo json_encode([
                "success" => true, 
                "token" => create_token($user['id']), 
                "usuario" => [
                    "id" => $user['id'], 
                    "username" => $user['username'], 
                    "avatar" => $user['avatar'],
                    "pokemon_inicial_id" => $user['pokemon_inicial_id']
                ]
            ]);
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
        $stmtG = $pdo->query("SELECT * FROM gimnasios_template ORDER BY orden ASC");
        $gyms = $stmtG->fetchAll();
        
        $template = [];
        foreach ($gyms as $g) {
            $stmtP = $pdo->prepare("SELECT * FROM pokemon_template WHERE gym_id = ? ORDER BY orden_en_gym ASC");
            $stmtP->execute([$g['gym_id']]);
            $pks = $stmtP->fetchAll();
            
            $pokemonList = [];
            foreach ($pks as $p) {
                $stmtH = $pdo->prepare("SELECT * FROM habitos_template WHERE pokemon_template_id = ?");
                $stmtH->execute([$p['id']]);
                $habitos = $stmtH->fetchAll();
                
                $pokemonList[] = [
                    "nombre" => $p['nombre'],
                    "id" => $p['pokemon_id'],
                    "nivel" => (int)$p['nivel'],
                    "habitos" => $habitos
                ];
            }
            
            $template[] = [
                "gym_id" => $g['gym_id'],
                "gym_nombre" => $g['gym_nombre'],
                "tiempo" => $g['tiempo'],
                "battleback" => $g['battleback'],
                "pokemon" => $pokemonList
            ];
        }
        echo json_encode(["success" => true, "template" => $template]);
    }

    elseif (strpos($relative_path, 'progreso/setup') !== false && $method === 'POST') {
        $user_id = get_user_id();
        $data = get_json_input();
        $today = date('Y-m-d');
        
        // No borramos todo, solo insertamos los que no existan para hoy
        foreach ($data['habitos'] as $h) {
            $stmtCheck = $pdo->prepare("SELECT id FROM habitos WHERE usuario_id = ? AND gimnasio_id = ? AND habito_id = ? AND fecha = ?");
            $stmtCheck->execute([$user_id, $h['gym_id'], $h['habito_id'], $today]);
            if (!$stmtCheck->fetch()) {
                $stmt = $pdo->prepare("INSERT INTO habitos (usuario_id, gimnasio_id, pokemon_index, habito_id, habito_nombre, fecha, completado) VALUES (?, ?, ?, ?, ?, ?, 0)");
                $stmt->execute([$user_id, $h['gym_id'], $h['pokemon_index'] ?? 0, $h['habito_id'], $h['habito_nombre'], $today]);
            }
        }
        
        $stmt = $pdo->prepare("INSERT IGNORE INTO progreso_diario (usuario_id, fecha, gimnasios_completados) VALUES (?, ?, '[]')");
        $stmt->execute([$user_id, $today]);
        echo json_encode(["success" => true]);
    }

    elseif (strpos($relative_path, 'habito/completar') !== false && $method === 'POST') {
        $user_id = get_user_id();
        $data = get_json_input();
        $today = date('Y-m-d');
        
        // Verificar si ya está completado
        $stmtCheck = $pdo->prepare("SELECT completado FROM habitos WHERE usuario_id = ? AND gimnasio_id = ? AND habito_id = ? AND fecha = ?");
        $stmtCheck->execute([$user_id, $data['gimnasio_id'], $data['habito_id'], $today]);
        $habito = $stmtCheck->fetch();
        
        if (!$habito) {
            http_response_code(404);
            echo json_encode(["success" => false, "error" => "Hábito no encontrado para hoy"]);
            exit();
        }
        
        if ($habito['completado']) {
            echo json_encode(["success" => false, "error" => "Este hábito ya fue completado hoy", "ya_completado" => true]);
            exit();
        }

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
            
            $pdo->prepare("INSERT INTO pokemon_coleccion (usuario_id, pokemon_id, pokemon_nombre, gimnasio_origen, fecha_captura, xp, nivel, is_partner) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
                ->execute([$user_id, $data['pokemon_id'], $data['pokemon_nombre'], $data['gimnasio_id'], $today, 0, 5, 0]);
            
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

    elseif (strpos($relative_path, 'pokemon/gain_xp') !== false && $method === 'POST') {
        $user_id = get_user_id();
        $data = get_json_input();
        
        $stmt = $pdo->prepare("UPDATE pokemon_coleccion SET xp = xp + ?, nivel = FLOOR((xp + ?)/100) + 5 WHERE id = ? AND usuario_id = ?");
        $stmt->execute([$data['amount'], $data['amount'], $data['pokemon_db_id'], $user_id]);
        echo json_encode(["success" => true]);
    }

    elseif (strpos($relative_path, 'pokemon/set_partner') !== false && $method === 'POST') {
        $user_id = get_user_id();
        $data = get_json_input();
        
        $pdo->prepare("UPDATE pokemon_coleccion SET is_partner = 0 WHERE usuario_id = ?")->execute([$user_id]);
        $pdo->prepare("UPDATE pokemon_coleccion SET is_partner = 1 WHERE id = ? AND usuario_id = ?")->execute([$data['pokemon_db_id'], $user_id]);
        echo json_encode(["success" => true]);
    }

    elseif (strpos($relative_path, 'coleccion/') !== false && $method === 'GET') {
        $user_id = get_user_id();
        $stmt = $pdo->prepare("SELECT * FROM pokemon_coleccion WHERE usuario_id = ?");
        $stmt->execute([$user_id]);
        echo json_encode(["success" => true, "pokemon" => $stmt->fetchAll()]);
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "error" => $e->getMessage()]);
}
?>
