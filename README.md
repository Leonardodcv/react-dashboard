# Aurora · Panel de administración

Dashboard de ejemplo construido con **React + Vite**, pensado como catálogo
de componentes premium (gráficas, tablas, formularios, loaders y feedback)
organizado como un proyecto de React "de verdad": carpetas por
responsabilidad, Context API en vez de prop-drilling, y comentarios en cada
archivo explicando su propósito.

## Requisitos

- Node.js 18 o superior

## Puesta en marcha

```bash
npm install
npm run dev
```

Luego abre la URL que muestra Vite en la terminal (normalmente
`http://localhost:5173`).

Otros scripts disponibles:

```bash
npm run build     # compila a /dist para producción
npm run preview   # sirve /dist localmente para probar el build
```

## Estructura del proyecto

```
src/
├── main.jsx                # Punto de entrada: monta <App /> en el DOM
├── App.jsx                 # Compone los providers y arma el layout general
├── index.css                # Fuentes, variables CSS por tema y animaciones
│
├── theme/
│   ├── themes.js            # Fuente única de verdad de los colores (claro/oscuro)
│   └── ThemeContext.jsx      # Context + hook useTheme()
│
├── context/
│   ├── ToastContext.jsx      # Sistema global de notificaciones toast
│   ├── ModalContext.jsx      # Controla qué modal está abierto
│   └── DataContext.jsx       # Datos de las gráficas + función "regenerar"
│
├── data/
│   ├── mockData.js           # Datos de ejemplo estáticos (usuarios, tablas...)
│   └── generators.js         # Generadores de datos aleatorios para gráficas
│
├── nav/
│   └── navConfig.jsx         # Lista de páginas del sidebar + sus títulos
│
├── components/
│   ├── layout/
│   │   ├── Sidebar.jsx       # Barra lateral de navegación
│   │   └── Topbar.jsx        # Barra superior (buscador, tema, notificaciones)
│   └── ui/
│       ├── Panel.jsx, Button.jsx, Input.jsx, Badge.jsx, ...
│       └── loaders/          # 10 variantes de loaders animados
│
└── pages/
    ├── Dashboard.jsx         # Resumen general con métricas y gráficas
    ├── Analytics.jsx         # Gráficas de tendencia y comparativas
    ├── Users.jsx              # Tabla de usuarios con filtros y búsqueda
    ├── Tables.jsx             # Galería de estilos de tabla
    ├── Components.jsx        # Catálogo de botones, inputs, loaders, alertas...
    └── Settings.jsx           # Perfil, preferencias y zona de peligro
```

## Cómo está pensado

- **Un solo lugar para los colores**: todo componente lee sus colores de
  `useTheme()`, nunca escribe un color literal. Cambiar de tema es
  instantáneo en toda la app.
- **Sin prop-drilling**: tema, toasts, modal y datos de gráficas viven en
  Context, no como props que hay que arrastrar por cada componente.
- **Datos de ejemplo aislados**: todo lo que hoy es aleatorio o estático
  vive en `src/data/`. Para conectar una API real, solo tienes que
  reemplazar esos dos archivos — el resto de la app no cambia.
- **Componentes pequeños y de un solo propósito**: cada archivo en
  `components/ui/` hace una cosa (un botón, un badge, un loader...), lo que
  facilita reusarlos o reemplazarlos sin tocar el resto.

## Añadir una página nueva

1. Crea `src/pages/MiPagina.jsx`.
2. Regístrala en `src/nav/navConfig.jsx` (agrega su entrada en `NAV` y `PAGE_META`).
3. Impórtala y agrégala al mapa `PAGES` en `src/App.jsx`.

## Stack

- [React 18](https://react.dev)
- [Vite](https://vitejs.dev) — bundler y servidor de desarrollo
- [Recharts](https://recharts.org) — gráficas (barras, pastel, línea, área, combinadas)
- [Lucide React](https://lucide.dev) — íconos

## Conexión con el backend de proyección

Copia `.env.example` como `.env` y ajusta la URL/ruta del backend:

```bash
cp .env.example .env
```

La gráfica **Proyección vs. consumo real** consulta:

```text
GET ${VITE_API_BASE_URL}${VITE_PROJECTION_ENDPOINT}
```

Formato recomendado:

```json
[
  { "fecha": "2026-08-01", "real": 1250.5, "proyeccion": 1218.2 },
  { "fecha": "2026-08-02", "real": 1194.0, "proyeccion": 1231.7 }
]
```

El adaptador también reconoce nombres habituales como `consumo_real`, `valor_real`, `prediccion`, `pronostico`, `forecast` y respuestas envueltas en `data`, `resultados`, `proyeccion` o `predicciones`.
