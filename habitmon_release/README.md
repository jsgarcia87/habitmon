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
