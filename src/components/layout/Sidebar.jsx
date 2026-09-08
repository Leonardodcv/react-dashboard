/**
 * layout/Sidebar.jsx
 * ------------------------------------------------------------------
 * Barra lateral fija: marca, navegación entre páginas y tarjeta de
 * perfil. Recibe `page`/`onNavigate` desde App.jsx, que es quien
 * decide qué página renderizar en el área principal.
 */
import { Zap, LogOut } from "lucide-react";
import { useTheme } from "../../theme/ThemeContext.jsx";
import { NAV } from "../../nav/navConfig.jsx";
import { Avatar } from "../ui/Avatar.jsx";
import { HoverTip } from "../ui/HoverTip.jsx";

export function Sidebar({ page, onNavigate }) {
  const { theme: t } = useTheme();

  return (
    <aside
      style={{
        width: 246, flexShrink: 0, background: t.sidebar, borderRight: `1px solid ${t.border}`,
        display: "flex", flexDirection: "column", position: "sticky", top: 0, height: "100vh",
      }}
    >
      {/* Marca */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "22px 20px 18px" }}>
        <span style={{ width: 34, height: 34, borderRadius: 10, background: t.gradAccent, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 6px 16px ${t.accent}40` }}>
          <Zap size={17} color="#fff" fill="#fff" />
        </span>
        <div>
          <div style={{ fontSize: 15.5, fontWeight: 800, color: t.text, fontFamily: "'Plus Jakarta Sans', sans-serif", lineHeight: 1 }}>React-Iconics</div>
          <div style={{ fontSize: 10.5, color: t.textFaint, fontFamily: "'IBM Plex Mono', monospace", marginTop: 2 }}>ENTERPRISE</div>
        </div>
      </div>

      {/* Navegación */}
      <nav style={{ padding: "8px 14px", display: "flex", flexDirection: "column", gap: 3, flex: 1 }}>
        {NAV.map((item) => {
          const active = page === item.id;
          return (
            <button
              key={item.id}
              className={`nav-item ${active ? "nav-active" : ""}`}
              onClick={() => onNavigate(item.id)}
              style={{
                display: "flex", alignItems: "center", gap: 11, padding: "10px 12px", borderRadius: 10,
                border: "none", cursor: "pointer", textAlign: "left",
                background: active ? t.accentSoft : "transparent",
                color: active ? t.accent : t.textSoft,
                fontSize: 13.5, fontWeight: active ? 700 : 500, fontFamily: "'Inter', sans-serif",
              }}
            >
              <span style={{ display: "flex", color: active ? t.accent : t.textFaint }}>{item.icon}</span>
              {item.label}
              {active && <span style={{ marginLeft: "auto", width: 6, height: 6, borderRadius: "50%", background: t.gradAccent }} />}
            </button>
          );
        })}
      </nav>

      {/* Perfil */}
      <div style={{ padding: 14, borderTop: `1px solid ${t.border}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 8px", borderRadius: 12, background: t.hover }}>
          <Avatar name="Ana Torres" size={34} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: t.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>Ana Torres</div>
            <div style={{ fontSize: 11, color: t.textFaint }}>Plan Pro</div>
          </div>
          <HoverTip label="Cerrar sesión">
            <LogOut size={15} color={t.textFaint} style={{ cursor: "pointer" }} />
          </HoverTip>
        </div>
      </div>
    </aside>
  );
}
