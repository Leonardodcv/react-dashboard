/**
 * ui/Panel.jsx
 * ------------------------------------------------------------------
 * Tarjeta contenedora reutilizada en TODA la app (gráficas, tablas,
 * formularios, loaders...). Da fondo, borde, sombra, radio y una
 * animación de entrada escalonada automática.
 *
 * Props:
 *  - title, code: encabezado opcional (code = subtítulo tipo monospace)
 *  - right: nodo opcional a la derecha del encabezado (botón, filtro...)
 *  - noPad: si es true, quita el padding interno (útil para tablas)
 */
import { useMemo } from "react";
import { useTheme } from "../../theme/ThemeContext.jsx";

// Contador de módulo: da a cada Panel un pequeño retraso distinto
// para que la animación de entrada se vea "en cascada".
let panelIndex = 0;

export function Panel({ title, code, children, right, style, noPad }) {
  const { theme: t } = useTheme();
  const delay = useMemo(() => {
    panelIndex += 1;
    return Math.min((panelIndex % 8) * 0.05, 0.4);
  }, []);

  return (
    <div
      className="panel-card"
      style={{
        background: t.panel,
        border: `1px solid ${t.border}`,
        borderRadius: 16,
        padding: noPad ? 0 : "20px 22px 24px",
        boxShadow: t.shadow,
        animation: "fadeInUp 0.5s ease both",
        animationDelay: `${delay}s`,
        "--shadow-hover": t.shadowHover,
        ...style,
      }}
    >
      {(title || right) && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 16,
            paddingBottom: 12,
            borderBottom: `1px solid ${t.border}`,
            padding: noPad ? "18px 20px 12px" : 0,
          }}
        >
          <div>
            {title && (
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: t.text, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                {title}
              </h3>
            )}
            {code && <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: t.textFaint }}>{code}</span>}
          </div>
          {right}
        </div>
      )}
      <div style={{ padding: noPad ? "0 20px 20px" : 0 }}>{children}</div>
    </div>
  );
}
