/** Loaders/CircularProgress.jsx — anillo SVG que se llena según `percent` (0-100). */
import { useTheme } from "../../../theme/ThemeContext.jsx";

export function CircularProgress({ percent, label = "subiendo archivo" }) {
  const { theme: t } = useTheme();
  const r = 22;
  const c = 2 * Math.PI * r;
  const offset = c - (percent / 100) * c;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <svg width="56" height="56" viewBox="0 0 56 56" style={{ transform: "rotate(-90deg)" }}>
        <circle cx="28" cy="28" r={r} fill="none" stroke={t.grid} strokeWidth="5" />
        <circle
          cx="28" cy="28" r={r} fill="none" stroke={t.accent} strokeWidth="5"
          strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.4s ease" }}
        />
      </svg>
      <div>
        <div style={{ fontSize: 16, fontWeight: 700, color: t.text }}>{percent}%</div>
        <div style={{ fontSize: 11, color: t.textFaint, fontFamily: "'IBM Plex Mono', monospace" }}>{label}</div>
      </div>
    </div>
  );
}
