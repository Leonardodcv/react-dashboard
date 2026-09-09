/** ui/ChartTooltip.jsx — tooltip personalizado para las gráficas de recharts (reemplaza el feo por defecto). */
import { useTheme } from "../../theme/ThemeContext.jsx";

export function ChartTooltip({ active, payload, label, formatter, labelFormatter }) {
  const { theme: t } = useTheme();
  if (!active || !payload || !payload.length) return null;

  const formatValue = typeof formatter === "function" ? formatter : (value) => value;
  const formatLabel = typeof labelFormatter === "function" ? labelFormatter : (value) => value;

  return (
    <div style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 8, padding: "8px 11px", fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, boxShadow: t.shadowHover }}>
      {label && <div style={{ color: t.text, fontWeight: 600, marginBottom: 4 }}>{formatLabel(label)}</div>}
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color || p.payload?.fill || p.stroke }}>
          {p.name}: {formatValue(p.value, p.name, p)}
        </div>
      ))}
    </div>
  );
}
