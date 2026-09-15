# Adaptación del frontend al backend v14.4

El frontend se ajustó al contrato y comportamiento de `14.4-horizonte-futuro-extensible`.

## Cambios realizados

1. Se mantiene `GET /api/proyeccion/` con las tres combinaciones existentes.
2. Se consulta `GET /api/v1/config/` para obtener:
   - versión de API;
   - límite de horizonte de la proyección analítica (`projection_analytics_max_horizon_days`).
3. El selector de fechas limita dinámicamente `fecha_fin` a un máximo de 730 días por defecto, o al valor que indique el backend.
4. Las fechas futuras son válidas. Cuando el backend devuelve `real: null`:
   - se muestra `—` en la tabla;
   - no se convierte a cero;
   - no se calcula diferencia diaria;
   - no se calcula error porcentual diario;
   - no se calcula diferencia/error acumulado para ese día;
   - la línea Real de la gráfica se detiene donde dejan de existir observaciones.
5. La proyección acumulada sí continúa a lo largo de todo el horizonte porque el backend sí entrega una proyección futura.
6. Las métricas de comparación utilizan únicamente días que tienen simultáneamente `real` y `proyeccion`.
7. Los mensajes de error del backend ahora muestran el contenido de `detail` cuando existe (por ejemplo, errores de rango o de selección histórica de modelo).

## Contrato esperado

```json
[
  {
    "fecha": "2026-08-18",
    "real": 1250.5,
    "proyeccion": 1218.2
  },
  {
    "fecha": "2026-08-19",
    "real": null,
    "proyeccion": 1231.7
  }
]
```

El segundo registro representa una fecha para la que todavía no existe consumo real conocido.
