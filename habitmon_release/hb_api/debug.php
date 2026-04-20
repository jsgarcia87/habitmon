<?php
header('Content-Type: application/json');

$db_status = "Not tested";
try {
    include 'db.php';
    $db_status = "Connected successfully!";
} catch (Exception $e) {
    $db_status = "Error: " . $e->getMessage();
}

echo json_encode([
    "success" => true,
    "message" => "API folder is reachable!",
    "database" => $db_status,
    "server_info" => [
        "REQUEST_URI" => $_SERVER['REQUEST_URI'] ?? 'N/A',
        "SCRIPT_NAME" => $_SERVER['SCRIPT_NAME'] ?? 'N/A',
        "PHP_VERSION" => PHP_VERSION,
        "ENGINE"      => php_sapi_name()
    ]
]);
?>
