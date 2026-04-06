#!/bin/bash

# --- Script de Compilación Automática para Habitmon RPG (Flask + React) ---

DIST_DIR="habitmon_release"
PROJECT_ROOT=$(pwd)

echo "🚀 Iniciando compilación de Habitmon..."

# 1. Limpiar carpeta de release anterior
if [ -d "$DIST_DIR" ]; then
  echo "🧹 Limpiando versión anterior..."
  rm -rf "$DIST_DIR"
fi
mkdir "$DIST_DIR"

# 2. Compilar el Frontend (React)
echo "📦 Compilando Frontend (React)..."
cd react-app
npm run build
if [ $? -ne 0 ]; then
  echo "❌ Error al compilar el Frontend. Abortando."
  exit 1
fi
cd "$PROJECT_ROOT"

# 3. Copiar archivos de React a la raíz del release
echo "📂 Copiando archivos de distribución..."
cp -r react-app/dist/* "$DIST_DIR/"

# 4. Copiar Assets
echo "🎨 Copiando Assets..."
cp -r Graphics "$DIST_DIR/"
cp -r Data "$DIST_DIR/"
cp -r Audio "$DIST_DIR/" 2>/dev/null || :
cp -r Fonts "$DIST_DIR/" 2>/dev/null || :

# 5. Copiar Backend (Flask)
echo "🐍 Preparando Backend (Flask)..."
mkdir -p "$DIST_DIR/backend"
cp app.py "$DIST_DIR/backend/"
cp requirements.txt "$DIST_DIR/backend/"
cp habitmon_setup.sql "$DIST_DIR/backend/"

# 6. Crear un script de inicio rápido para el usuario
cat << 'EOF' > "$DIST_DIR/README.md"
# Habitmon Release

## Estructura
- Root: Contiene los archivos estáticos del juego (React).
- `/backend`: Contiene la lógica del servidor Flask.

## Instalación en Producción
1. Sube el contenido de la raíz a tu servidor de archivos estáticos.
2. Configura tu servidor para servir `index.html` en todas las rutas (SPA).
3. En el servidor de aplicaciones:
   - Instala las dependencias: `pip install -r backend/requirements.txt`
   - Ejecuta la API: `python backend/app.py`
4. Asegúrate de configurar las variables de entorno o la base de datos según sea necesario.
EOF

echo "--------------------------------------------------"
echo "✅ ¡COMPILACIÓN CORRECTA!"
echo "--------------------------------------------------"
echo "Tus archivos listos están en la carpeta: /${DIST_DIR}"
echo "--------------------------------------------------"
