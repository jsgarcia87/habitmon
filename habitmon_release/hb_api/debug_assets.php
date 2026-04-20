<?php
header('Content-Type: application/json');

function listFiles($dir) {
    if (!is_dir($dir)) return ["error" => "Directory not found: $dir"];
    $files = scandir($dir);
    $result = [];
    foreach ($files as $file) {
        if ($file === '.' || $file === '..') continue;
        $path = $dir . '/' . $file;
        if (is_dir($path)) {
            $result[$file] = listFiles($path);
        } else {
            $result[] = $file;
        }
    }
    return $result;
}

echo json_encode([
    "Graphics" => listFiles('../Graphics'),
    "Data" => listFiles('../Data'),
    "cwd" => getcwd(),
    "php_version" => PHP_VERSION
]);
?>
