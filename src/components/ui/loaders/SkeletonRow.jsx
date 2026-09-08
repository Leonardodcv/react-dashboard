/** Loaders/SkeletonRow.jsx — una línea de "esqueleto" con efecto shimmer. Recibe el ancho (`w`). */
import { useTheme } from "../../../theme/ThemeContext.jsx";

export function SkeletonRow({ w = "70%" }) {
  const { theme: t } = useTheme();
  return (
    <div className="shimmer" style={{ height: 12, width: w, background: t.shimmer, backgroundSize: "400% 100%", borderRadius: 3 }} />
  );
}
