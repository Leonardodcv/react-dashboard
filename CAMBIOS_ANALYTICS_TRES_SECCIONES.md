# Analíticas: tres secciones de proyección

La página `Analíticas` ahora muestra tres bloques independientes con la misma estructura visual:

1. Estación 2 / Producto 1
   - `GET /api/proyeccion/?estacion=2&codprd=1&fecha_inicio=2026-04-01&fecha_fin=2026-06-16`
2. Estación 2 / Producto 3
   - `GET /api/proyeccion/?estacion=2&codprd=3&fecha_inicio=2026-04-01&fecha_fin=2026-06-16`
3. Estación 1 / Producto 3
   - `GET /api/proyeccion/?estacion=1&codprd=3&fecha_inicio=2026-04-01&fecha_fin=2026-06-16`

Cada bloque incluye:

- Gráfica ampliada `Proyección vs. consumo real`.
- Botón de actualización independiente.
- Collapse independiente para las tablas.
- Tabla diaria con Fecha, Proyección, Real, Diferencia, Error porcentual, Proyección acumulada, Real acumulada, Diferencia acumulada y Error porcentual acumulado.
- Resumen del período.
- Tabla de últimas variaciones.

Las tres peticiones se cargan de forma independiente desde `DataContext`, por lo que un error en una combinación no impide visualizar las otras.
