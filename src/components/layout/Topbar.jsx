/**
 * layout/Topbar.jsx
 * ------------------------------------------------------------------
 * Barra superior fija (sticky): título de la página actual, buscador,
 * notificaciones, botón "regenerar datos" y el interruptor de tema.
 */
import { Search, Bell, Sun, Moon, Shuffle } from "lucide-react";
import { useTheme } from "../../theme/ThemeContext.jsx";
import { useData } from "../../context/DataContext.jsx";
import { PAGE_META } from "../../nav/navConfig.jsx";
import { Input } from "../ui/Input.jsx";
import { HoverTip } from "../ui/HoverTip.jsx";
import { Avatar } from "../ui/Avatar.jsx";

export function Topbar({ page }) {
  const { theme: t, dark, toggleTheme } = useTheme();
  const { regenerate, regenerating } = useData();
  const meta = PAGE_META[page];

  return (
    <div
      style={{
        position: "sticky", top: 0, zIndex: 30, background: `${t.page}E6`, backdropFilter: "blur(10px)",
        borderBottom: `1px solid ${t.border}`, padding: "18px 32px",
        display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20,
      }}
    >
      <div>
        <h1 style={{ margin: 0, fontSize: 21, fontWeight: 800, color: t.text, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{meta.title}</h1>
        <p style={{ margin: "2px 0 0", fontSize: 12.5, color: t.textFaint }}>{meta.sub}</p>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
        <div style={{ width: 210 }}>
          <Input icon={<Search size={14} />} placeholder="Buscar…" />
        </div>

        <HoverTip label="3 notificaciones">
          <span style={{ position: "relative", display: "flex", padding: 9, borderRadius: 9, background: t.panel, border: `1px solid ${t.border}`, cursor: "pointer" }}>
            <Bell size={16} color={t.textSoft} />
            <span style={{ position: "absolute", top: 6, right: 6, width: 7, height: 7, borderRadius: "50%", background: t.coral, border: `1.5px solid ${t.panel}` }} />
          </span>
        </HoverTip>

        <button
          className="shuffle-btn"
          onClick={regenerate}
          style={{
            display: "flex", alignItems: "center", gap: 6, background: t.gradAccent, color: "#FFFFFF", border: "none",
            borderRadius: 999, padding: "9px 16px", fontSize: 12.5, fontFamily: "'IBM Plex Mono', monospace",
            fontWeight: 600, cursor: "pointer", boxShadow: `0 4px 14px ${t.accent}4D`,
          }}
        >
          <Shuffle size={13} className={regenerating ? "shuffle-icon-spin" : ""} />
          regenerar
        </button>

        <button
          onClick={toggleTheme}
          style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 34, height: 34, borderRadius: "50%", background: t.accentSoft, border: "none", cursor: "pointer" }}
        >
          {dark ? <Moon size={15} color={t.accent} /> : <Sun size={15} color={t.accent} />}
        </button>

        <Avatar name="Ana Torres" size={34} />
      </div>
    </div>
  );
}
