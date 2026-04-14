<?php
header('Content-Type: application/json');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
require_once 'db.php';

// Get JSON POST payload
$json = file_get_contents('php://input');
$data = json_decode($json, true);

if (!$data || !isset($data['username']) || !isset($data['password'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Missing username or password']);
    exit();
}

$username = trim(strtolower($data['username']));
$password = $data['password'];

try {
    // Check if user exists
    $stmt = $pdo->prepare('SELECT password, state_json FROM users WHERE username = ?');
    $stmt->execute([$username]);
    $user = $stmt->fetch();

    if ($user) {
        if ($user['password'] === $password) {
            echo json_encode([
                'success' => true,
                'state' => $user['state_json']
            ]);
        } else {
            http_response_code(401);
            echo json_encode(['success' => false, 'error' => 'Contraseña incorrecta']);
        }
    } else {
        // Create new user automatically from login panel
        $stmt = $pdo->prepare('INSERT INTO users (username, password, state_json) VALUES (?, ?, ?)');
        $stmt->execute([$username, $password, null]);
        
        echo json_encode([
            'success' => true,
            'state' => null
        ]);
    }
} catch(PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Database error']);
}
?>
