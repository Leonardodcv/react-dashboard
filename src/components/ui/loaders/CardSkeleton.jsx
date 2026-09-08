/** Loaders/CardSkeleton.jsx — placeholder de una fila tipo "usuario" (avatar + 2 líneas). */
import { useTheme } from "../../../theme/ThemeContext.jsx";

export function CardSkeleton() {
  const { theme: t } = useTheme();
  const shimmer = { background: t.shimmer, backgroundSize: "400% 100%" };
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <div className="shimmer" style={{ width: 40, height: 40, borderRadius: "50%", flexShrink: 0, ...shimmer }} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 7 }}>
        <div className="shimmer" style={{ height: 10, width: "60%", borderRadius: 3, ...shimmer }} />
        <div className="shimmer" style={{ height: 10, width: "38%", borderRadius: 3, ...shimmer }} />
      </div>
    </div>
  );
}
