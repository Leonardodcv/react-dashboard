/** Loaders/PulseDot.jsx — punto con anillo expandiéndose, sugiere "en vivo". */
import { useTheme } from "../../../theme/ThemeContext.jsx";

export function PulseDot() {
  const { theme: t } = useTheme();
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <span style={{ position: "relative", width: 14, height: 14, display: "inline-flex" }}>
        <span className="pulse-ring" style={{ position: "absolute", inset: 0, borderRadius: "50%", background: t.coral }} />
        <span style={{ width: 14, height: 14, borderRadius: "50%", background: t.coral, position: "relative" }} />
      </span>
      <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12.5, color: t.textSoft }}>transmisión en vivo</span>
    </div>
  );
}
