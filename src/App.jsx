/**
 * App.jsx
 * ------------------------------------------------------------------
 * Punto de composición de la app:
 *   1) Envuelve todo con los providers de contexto (tema, toasts,
 *      modal, datos) — el orden importa: DataProvider usa useToast(),
 *      así que ToastProvider debe ir por fuera de él.
 *   2) Dentro, <Shell> arma el layout (sidebar + topbar + contenido)
 *      y decide qué página mostrar según el estado `page`.
 */
import { useState } from "react";
import { ThemeProvider } from "./theme/ThemeContext.jsx";
import { ToastProvider } from "./context/ToastContext.jsx";
import { ModalProvider } from "./context/ModalContext.jsx";
import { DataProvider } from "./context/DataContext.jsx";
import { useTheme } from "./theme/ThemeContext.jsx";

import { Sidebar } from "./components/layout/Sidebar.jsx";
import { Topbar } from "./components/layout/Topbar.jsx";
import { Modal } from "./components/ui/Modal.jsx";

import Dashboard from "./pages/Dashboard.jsx";
import Analytics from "./pages/Analytics.jsx";
import Users from "./pages/Users.jsx";
import Tables from "./pages/Tables.jsx";
import Components from "./pages/Components.jsx";
import Settings from "./pages/Settings.jsx";

// Mapa id de página -> componente. Debe mantenerse en sync con
// src/nav/navConfig.jsx (NAV y PAGE_META).
const PAGES = {
  dashboard: Dashboard,
  analytics: Analytics,
  users: Users,
  tables: Tables,
  components: Components,
  settings: Settings,
};

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <ModalProvider>
          <DataProvider>
            <Shell />
          </DataProvider>
        </ModalProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}

function Shell() {
  const { theme: t } = useTheme();
  const [page, setPage] = useState("dashboard");
  const PageComponent = PAGES[page];

  return (
    <div style={{ minHeight: "100vh", background: t.page, display: "flex" }}>
      <Sidebar page={page} onNavigate={setPage} />

      <div style={{ flex: 1, minWidth: 0, position: "relative" }}>
        {/* Manchas decorativas de fondo, puramente visuales */}
        <div className="blob" style={{ width: 380, height: 380, background: t.blob1, top: -140, right: 60 }} />
        <div className="blob" style={{ width: 300, height: 300, background: t.blob2, top: 300, right: -140, animationDelay: "-8s" }} />

        <Modal />
        <Topbar page={page} />

        <div key={page} className="page-fade" style={{ padding: "26px 32px 50px", position: "relative" }}>
          <PageComponent />


        </div>
      </div>
    </div>
  );
}
