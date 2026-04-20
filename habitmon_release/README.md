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
