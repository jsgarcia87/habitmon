#!/bin/bash

# --- Script de Compilación Automática para Habitmon RPG (Flask + React) ---

# Añadir rutas comunes de Homebrew si no están presentes
export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"

DIST_DIR="habitmon_release"
PROJECT_ROOT=$(pwd)

echo "🚀 Iniciando compilación de Habitmon..."

# 1. Limpiar carpeta de release anterior (macOS safe)
echo "🧹 Limpiando versión anterior..."
if [ -d "$DIST_DIR" ]; then
  chflags -R nouchg "$DIST_DIR" 2>/dev/null || true
  find "$DIST_DIR" -type f -delete
  find "$DIST_DIR" -mindepth 1 -type d | sort -r | xargs rmdir 2>/dev/null || true
  rm -rf "$DIST_DIR" 2>/dev/null || true
fi
mkdir -p "$DIST_DIR"

# 2. Compilar el Frontend (React)
echo "📦 Compilando Frontend (React)..."
cd react-app
npm run build
if [ $? -ne 0 ]; then
  echo "❌ Error al compilar el Frontend. Abortando."
  exit 1
fi
cd "$PROJECT_ROOT"

# 3. Copiar archivos de React (el nombre del JS cambia con cada build por el hash)
echo "📂 Copiando archivos de distribución..."
cp -r react-app/dist/* "$DIST_DIR/"
NEW_JS=$(ls react-app/dist/assets/*.js 2>/dev/null | xargs -I{} basename {} 2>/dev/null)
echo "   ✓ Bundle activo: ${NEW_JS}"

# 4. Copiar Assets
echo "🎨 Copiando Assets..."
cp -r Graphics "$DIST_DIR/"
cp -r Data "$DIST_DIR/"
cp -r Audio "$DIST_DIR/" 2>/dev/null || :
cp -r Fonts "$DIST_DIR/" 2>/dev/null || :
# Sync assets to public folder for dev server
mkdir -p react-app/public/Data
mkdir -p react-app/public/Graphics
cp -r Data/* react-app/public/Data/
cp -r Graphics/* react-app/public/Graphics/

# 5. Copiar Backend (PHP & Flask)
echo "📂 Preparando Backend..."
cp -r hb_api "$DIST_DIR/"
cp habitmon_setup.sql "$DIST_DIR/hb_api/" # Copia estándar para PHP
mkdir -p "$DIST_DIR/backend"
cp app.py "$DIST_DIR/backend/"
cp requirements.txt "$DIST_DIR/backend/"
cp habitmon_setup.sql "$DIST_DIR/backend/"

# 6. Crear un script de inicio rápido para el usuario
cat << 'EOF' > "$DIST_DIR/README.md"
# Habitmon Release

## Estructura
- Root: Contiene los archivos estáticos del juego (React).
- `/hb_api`: Backend para servidores **PHP** (Apache/MariaDB).
- `/backend`: Backend para servidores **Python/Flask**.

## Instalación en Producción (Opción PHP - Recomendada para Apache)
1. Sube todo el contenido de la carpeta de lanzamiento a tu servidor.
2. Asegúrate de que la carpeta `/hb_api` tenga permisos de lectura.
3. Configura tus datos de acceso en **`hb_api/db.php`**.
4. Importa **`hb_api/habitmon_setup.sql`** en tu base de datos MariaDB.

## Instalación en Producción (Opción Python/Flask)
1. Instala las dependencias: `pip install -r backend/requirements.txt`
2. Configura tu base de datos en `backend/app.py`.
3. Ejecuta la API: `python backend/app.py`
EOF

echo "--------------------------------------------------"
echo "✅ ¡COMPILACIÓN CORRECTA!"
echo "--------------------------------------------------"
echo "Tus archivos listos están en la carpeta: /${DIST_DIR}"
echo "--------------------------------------------------"
