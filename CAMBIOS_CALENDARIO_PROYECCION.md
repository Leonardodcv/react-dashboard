# Selector de fechas para Analíticas

Se agregaron dos calendarios en la parte superior de la página **Analíticas**:

- **Día de inicio**: no permite seleccionar una fecha anterior al 1 de abril de 2026.
- **Día final**: no permite seleccionar una fecha anterior al día de inicio.

El botón **Aplicar período** vuelve a consultar las tres secciones utilizando el mismo rango seleccionado.

Ejemplo, si se selecciona `2026-05-01` a `2026-06-10`, las peticiones quedan:

```text
/api/proyeccion/?estacion=2&codprd=1&fecha_inicio=2026-05-01&fecha_fin=2026-06-10
/api/proyeccion/?estacion=2&codprd=3&fecha_inicio=2026-05-01&fecha_fin=2026-06-10
/api/proyeccion/?estacion=1&codprd=3&fecha_inicio=2026-05-01&fecha_fin=2026-06-10
```

También se actualizan los subtítulos de cada sección para mostrar el período actualmente aplicado.

## Archivos modificados

- `src/pages/Analytics.jsx`
- `src/context/DataContext.jsx`
- `src/services/projectionApi.js`
- `.env.example`
