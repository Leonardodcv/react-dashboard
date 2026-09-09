# Cambios en Analíticas

## Consulta al backend

La vista usa por defecto:

```http
GET /api/proyeccion/?estacion=2&codprd=1&fecha_inicio=2026-04-01&fecha_fin=2026-06-16
```

Los valores pueden cambiarse con las variables de `.env.example`.

## Error porcentual diario

Se calcula como:

```text
|Proyección - Real| / |Real| * 100
```

- Si `Real = 0` y `Proyección = 0`, se muestra `0%`.
- Si `Real = 0` y `Proyección != 0`, se muestra `—`, porque el error porcentual no está definido al dividir entre cero.

## Error porcentual acumulado

Se calcula como:

```text
|Proyección acumulada - Real acumulada| / |Real acumulada| * 100
```

Se aplican las mismas reglas cuando el real acumulado es cero.

## Collapse de tablas

Las tablas quedan contraídas inicialmente. El usuario puede usar **Mostrar tablas** / **Ocultar tablas** para desplegar o contraer el detalle diario, el resumen del período y las últimas variaciones.
