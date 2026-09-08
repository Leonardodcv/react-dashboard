/** Loaders/Spinner.jsx — ícono girando + etiqueta. El loader más "clásico". */
import { Loader2 } from "lucide-react";
import { useTheme } from "../../../theme/ThemeContext.jsx";

export function Spinner() {
  const { theme: t } = useTheme();
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <Loader2 size={19} color={t.accent} className="spin" />
      <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12.5, color: t.textSoft }}>
        cargando datos…
      </span>
    </div>
  );
}
