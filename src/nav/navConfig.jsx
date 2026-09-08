/**
 * nav/navConfig.jsx
 * ------------------------------------------------------------------
 * Única fuente de verdad para la navegación: qué páginas existen,
 * en qué orden aparecen en el sidebar, y el título/subtítulo que el
 * Topbar muestra para cada una.
 *
 * Para agregar una página nueva a la app:
 *   1) Crea src/pages/MiPagina.jsx
 *   2) Agrégala aquí (NAV + PAGE_META)
 *   3) Regístrala en el switch de src/App.jsx
 */
import { LayoutDashboard, BarChart3, Users, Table2, Blocks, Settings } from "lucide-react";

export const NAV = [
  { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard size={17} /> },
  { id: "analytics", label: "Analíticas", icon: <BarChart3 size={17} /> },
  { id: "users", label: "Usuarios", icon: <Users size={17} /> },
  { id: "tables", label: "Tablas", icon: <Table2 size={17} /> },
  { id: "components", label: "Componentes", icon: <Blocks size={17} /> },
  { id: "settings", label: "Configuración", icon: <Settings size={17} /> },
];

export const PAGE_META = {
  dashboard: { title: "Dashboard", sub: "Resumen general del negocio en tiempo real" },
  analytics: { title: "Analíticas", sub: "Tendencias, comparativas y rendimiento" },
  users: { title: "Usuarios", sub: "Gestiona miembros, roles y accesos" },
  tables: { title: "Tablas", sub: "Facturación y registros del sistema" },
  components: { title: "Componentes", sub: "Kit de UI: botones, inputs, loaders y feedback" },
  settings: { title: "Configuración", sub: "Preferencias de cuenta y notificaciones" },
};
