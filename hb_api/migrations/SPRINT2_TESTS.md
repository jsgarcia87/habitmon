# Sprint 2 — Mensajes-NPC del Profesor: pruebas end-to-end

Requiere haber completado Sprint 1 (cuenta de Profesor + niño vinculado).

## A. Backend con curl

### A.1 Profesor envía un mensaje
```bash
# Necesitas el relacion_id (lo da GET /profesor/hijos)
curl -X POST http://localhost/hb_api/index.php/profesor/mensajes \
  -H "Authorization: Bearer $PROF_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"relacion_id":1,"texto":"¡Me hace muy feliz verte cumplir tus hábitos!","programado_para":"'"$(date +%Y-%m-%d)"'"}'
```

Respuesta:
```json
{ "success": true, "id": 1, "programado_para": "2026-05-24" }
```

### A.2 Profesor lista sus mensajes
```bash
curl http://localhost/hb_api/index.php/profesor/mensajes \
  -H "Authorization: Bearer $PROF_TOKEN"
```

### A.3 Niño consulta mensajes pendientes
```bash
curl http://localhost/hb_api/index.php/usuarios/mensajes-pendientes \
  -H "Authorization: Bearer $CHILD_TOKEN"
```

Respuesta:
```json
{
  "success": true,
  "mensajes": [
    {
      "id": 1,
      "texto": "¡Me hace muy feliz verte cumplir tus hábitos!",
      "programado_para": "2026-05-24",
      "rol_display": "PAPÁ",
      "avatar_npc": 0,
      "profesor_username": "papa_test"
    }
  ]
}
```

### A.4 Niño marca el mensaje como visto
```bash
curl -X POST http://localhost/hb_api/index.php/usuarios/mensajes/1/visto \
  -H "Authorization: Bearer $CHILD_TOKEN"
```

### A.5 El profesor borra un mensaje no visto
```bash
curl -X DELETE http://localhost/hb_api/index.php/profesor/mensajes/2 \
  -H "Authorization: Bearer $PROF_TOKEN"
```

## B. Flujo end-to-end en la app

### Lado Profesor (navegador)
1. Login Page → "CREAR CUENTA DE PROFESOR" abajo → crear cuenta `papa_test`.
2. Aparece **ProfesorDashboard** automáticamente.
3. Sección "Invitar a un hijo": selecciona ROL = PAPÁ, AVATAR = Figura clásica, pulsa "Generar código".
4. Aparece código de 6 letras (ej. `K7XR42`). Anótalo.

### Lado Niño
1. Login normal con usuario existente.
2. En el juego, abre menú (START) → `FAMILIA`.
3. Pantalla VINCULAR FAMILIA → escribe `K7XR42` → VINCULAR.
4. Notificación "¡Te has vinculado con papa_test!". Listado muestra PAPÁ.

### Lado Profesor (de vuelta)
1. Refresca el Dashboard → ahora `papa_test` ve a su hijo bajo "Tus hijos".
2. Pulsa "Enviar un mensaje".
3. Selecciona una plantilla o escribe libre. Fecha = hoy.
4. Pulsa "Programar mensaje". Aparece banner verde de éxito.

### Lado Niño (de vuelta)
1. Si está fuera de Pueblo Primavera (Map002), entra en él (puede ser saliendo y volviendo).
2. **En el spawn debería aparecer un NPC nuevo** en (12, 9) con sprite de adulto.
3. Camina hacia él, pulsa A.
4. Aparece la caja de diálogo: `💬 PAPÁ · papa_test` con el texto del mensaje.
5. Pulsa para cerrar.
6. **El NPC desaparece del mapa** — el mensaje ya está marcado como visto.
7. Si recargas la app y vuelves a Pueblo Primavera, ese NPC no vuelve (visto=true).

## C. Casos límite

| Caso | Esperado |
|---|---|
| Profesor programa mensaje en fecha futura | El NPC no aparece hasta esa fecha |
| Profesor programa fecha pasada por error | Se ajusta a hoy automáticamente |
| 4 mensajes pendientes el mismo día | Solo se muestran los 3 primeros NPCs (limit en `PROFESOR_NPC_POSITIONS_MAP002`); el 4º queda en cola para cuando se consuman los anteriores |
| Texto con palabra "tonto" | El editor muestra advertencia ámbar pero permite enviar |
| Niño habla y cierra → recarga juego | El NPC ya no vuelve (registro en BD) |
| Niño revoca relación (futuro) | Mensajes pendientes desaparecen automáticamente al volver al pueblo |

## D. Estado en BD

```sql
SELECT m.id, r.rol_display, u.username AS hijo, m.texto, m.programado_para, m.visto_en
FROM profesor_mensajes m
JOIN relaciones_familiares r ON r.id = m.relacion_id
LEFT JOIN usuarios u ON u.id = r.child_id;
```
