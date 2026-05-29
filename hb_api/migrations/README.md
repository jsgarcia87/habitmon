# Migrations Habitmon

Las migrations son SQL idempotentes que se ejecutan sobre `habitmon_db` para
añadir tablas/columnas sin tocar las existentes.

## Cómo aplicar

### Opción A — CLI (recomendada en local)

```bash
mysql -u <user> -p habitmon_db < hb_api/migrations/001_modo_profesor.sql
```

### Opción B — Desde phpMyAdmin / Adminer

Abre el .sql en un editor, copia su contenido y pégalo en la pestaña "SQL".

### Opción C — Endpoint admin (útil en producción compartida)

`POST /admin/migrate` con header `Authorization: Bearer <token-admin>`. Aplica
todos los .sql de esta carpeta en orden alfabético (saltándose los ya aplicados
según la tabla `migrations_aplicadas`).

## Convención de nombres

`NNN_descripcion.sql` — el prefijo numérico controla el orden de aplicación.

Migrations actuales:

| Archivo | Qué hace |
|---|---|
| `001_modo_profesor.sql` | Añade `tipo_cuenta` a `usuarios` y crea `relaciones_familiares` |
