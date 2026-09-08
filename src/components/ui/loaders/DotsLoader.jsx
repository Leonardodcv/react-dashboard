/** Loaders/DotsLoader.jsx — tres puntos rebotando en cascada (típico de apps de chat). */
import { useTheme } from "../../../theme/ThemeContext.jsx";

export function DotsLoader() {
  const { theme: t } = useTheme();
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{ display: "flex", gap: 5 }}>
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="dot-bounce"
            style={{ width: 7, height: 7, borderRadius: "50%", background: t.gradAccent, animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
      <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12.5, color: t.textSoft }}>procesando…</span>
    </div>
  );
}
