# Sprint 1 — Modo Profesor: pruebas manuales con curl

API en `http://localhost/hb_api/index.php` (ajusta a tu URL).

## 0. Aplicar migration

Si la base ya existe, las migrations se aplican **automáticamente** al primer
request (ver `db.php`). Confirma con:

```sql
DESCRIBE usuarios;
-- debe incluir tipo_cuenta ENUM('child','professor','admin')

SHOW TABLES LIKE 'relaciones_familiares';
-- debe devolver una fila
```

Alternativa manual:
```bash
mysql -u<user> -p habitmon_db < hb_api/migrations/001_modo_profesor.sql
```

## 1. Registrar una cuenta de Profesor

```bash
curl -X POST http://localhost/hb_api/index.php/auth/register-profesor \
  -H "Content-Type: application/json" \
  -d '{"username":"papa_test","email":"papa@test.com","password":"secret123"}'
```

Respuesta esperada (200):
```json
{
  "success": true,
  "token": "...",
  "usuario": { "id": 42, "username": "papa_test", "tipo_cuenta": "professor" }
}
```

Guarda el `token` como `PROF_TOKEN`.

## 2. Verificar perfil del Profesor

```bash
curl http://localhost/hb_api/index.php/profesor/me \
  -H "Authorization: Bearer $PROF_TOKEN"
```

Si intentas esto con un token de un usuario tipo `child`, deberías ver `403`.

## 3. Generar un código de invitación

```bash
curl -X POST http://localhost/hb_api/index.php/profesor/invitar \
  -H "Authorization: Bearer $PROF_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"rol_display":"PAPÁ","avatar_npc":1}'
```

Respuesta esperada:
```json
{
  "success": true,
  "codigo": "K7XR42",      // 6 chars, A-Z + 2-9
  "caduca_en": "en 7 días",
  "rol_display": "PAPÁ",
  "avatar_npc": 1
}
```

## 4. Listar el estado actual (debe estar `pendiente`)

```bash
curl http://localhost/hb_api/index.php/profesor/hijos \
  -H "Authorization: Bearer $PROF_TOKEN"
```

Debe devolver la relación con `estado: "pendiente"` y sin `child_id`.

## 5. El niño introduce el código

Registra un niño normal (o usa uno existente):

```bash
curl -X POST http://localhost/hb_api/index.php/auth/login \
  -H "Content-Type: application/json" \
  -d '{"identifier":"niño_existente","password":"..."}'
```

Guarda el token como `CHILD_TOKEN`. Y vincula:

```bash
curl -X POST http://localhost/hb_api/index.php/usuarios/vincular-profesor \
  -H "Authorization: Bearer $CHILD_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"codigo":"K7XR42"}'
```

Respuesta esperada:
```json
{
  "success": true,
  "profesor_username": "papa_test",
  "rol_display": "PAPÁ"
}
```

## 6. Confirmar que la relación está activa

Como Profesor:
```bash
curl http://localhost/hb_api/index.php/profesor/hijos \
  -H "Authorization: Bearer $PROF_TOKEN"
```

Ahora la relación debe tener `estado: "activo"`, `child_id`, `child_username`,
`activado_en`.

Como Niño:
```bash
curl http://localhost/hb_api/index.php/usuarios/profesores \
  -H "Authorization: Bearer $CHILD_TOKEN"
```

Debe listar a `papa_test` con su rol y avatar.

## 7. Errores esperados

| Caso | Resultado |
|---|---|
| Código inválido | `404 {"error":"Código inválido o caducado."}` |
| Mismo código usado 2× | `404` (porque ya tiene child_id) |
| Profesor intenta vincularse a sí mismo | `400 {"error":"No puedes vincularte contigo mismo."}` |
| Padre genera 2 códigos → niño usa 1 → intenta usar el otro | `409 {"error":"Ya estás vinculado con este Profesor."}` |
| Token de child llama /profesor/invitar | `403` |

## 8. Estado en BD (SQL queries útiles)

```sql
-- Ver todas las relaciones
SELECT r.id, r.estado, r.codigo_invitacion, r.rol_display,
       prof.username AS profesor, child.username AS hijo
FROM relaciones_familiares r
JOIN usuarios prof ON prof.id = r.professor_id
LEFT JOIN usuarios child ON child.id = r.child_id;

-- Revocar (limpiar) una relación durante pruebas
UPDATE relaciones_familiares SET estado='revocado' WHERE id=?;
```
