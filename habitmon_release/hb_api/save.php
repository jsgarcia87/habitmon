<?php
header('Content-Type: application/json');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
require_once 'db.php';

// Get JSON POST payload
$json = file_get_contents('php://input');
$data = json_decode($json, true);

if (!$data || !isset($data['username']) || !isset($data['password']) || !isset($data['state'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Missing required fields']);
    exit();
}

$username = trim(strtolower($data['username']));
$password = $data['password'];
$state_json = json_encode($data['state']);

try {
    // Authenticate
    $stmt = $pdo->prepare('SELECT id FROM users WHERE username = ? AND password = ?');
    $stmt->execute([$username, $password]);
    
    if ($stmt->fetch()) {
        // Update state
        $updateStmt = $pdo->prepare('UPDATE users SET state_json = ? WHERE username = ?');
        $updateStmt->execute([$state_json, $username]);
        
        echo json_encode(['success' => true]);
    } else {
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'No autorizado para guardar']);
    }
} catch(PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Database error']);
}
?>
