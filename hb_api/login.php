<?php
header('Content-Type: application/json');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
require_once 'db.php';

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
    $stmt = $pdo->prepare('SELECT password, state_json FROM users WHERE username = ?');
    $stmt->execute([$username]);
    $user = $stmt->fetch();

    if ($user && password_verify($password, $user['password'])) {
        echo json_encode([
            'success' => true,
            'state' => $user['state_json']
        ]);
    } else {
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'Credenciales inválidas']);
    }
} catch(PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Database error']);
}
?>
