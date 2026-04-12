# Guía de Despliegue - Habitmon RPG

Esta guía explica el proceso estándar para generar una versión de lanzamiento ("release") y desplegarla en un servidor web.

## Los Procesos (Ciclo de Vida)

### 1. Preparación en Local (Carpeta Raíz)
Antes de generar una versión de lanzamiento, asegúrate de que todos los mapas y archivos en la carpeta raíz estén correctos. 
- Las reparaciones de mapas que hemos hecho se aplican aquí.

### 2. Generación del Release
Para crear la carpeta `habitmon_release` con todos los archivos actualizados y optimizados, ejecuta el siguiente comando en tu terminal desde la raíz del proyecto:

```bash
./release.sh
```

**¿Qué hace este proceso?**
1. Borra la carpeta `habitmon_release` anterior para evitar archivos viejos.
2. Compila el Frontend (React) para que sea rápido y eficiente.
3. Copia las carpetas de recursos (`Data`, `Graphics`, `Audio`, `Fonts`) ya actualizadas.
4. Organiza el Backend en carpetas `/api` (para PHP) y `/backend` (para Flask).

### 3. Despliegue al Servidor
Una vez generado el contenido en `habitmon_release`, debes subirlo a tu servidor (vía FTP o similar).

> [!IMPORTANT]
> **Configuración Crítica en el Servidor:**
> 1. **Base de Datos**: Importa el archivo `api/habitmon_setup.sql` en tu MySQL/MariaDB.
> 2. **Credenciales**: Edita el archivo `api/db.php` **directamente en el servidor** para poner los datos de conexión correctos (Host, Usuario, Password).

### 4. Mantenimiento
Si haces cambios en los mapas o el código:
1. Haz el cambio en la carpeta raíz.
2. Vuelve a ejecutar `./release.sh`.
3. Sube únicamente los archivos que hayan cambiado (normalmente la carpeta `assets` y `Data`).

---
> [!TIP]
> Si el juego sigue mostrando errores de "Mapa no encontrado" o pantalla negra después de subirlo, verifica que la carpeta `Data/` en el servidor contenga archivos `.json` de tamaño superior a 1KB (lo que indica que son mapas reales y no errores).
