/**
 * theme/themes.js
 * ------------------------------------------------------------------
 * Fuente única de verdad para los colores de la aplicación.
 *
 * Cada tema expone los mismos "tokens" (nombres) con valores distintos,
 * así los componentes nunca escriben colores literales: siempre piden
 * `theme.accent`, `theme.textSoft`, etc. Esto es lo que permite que
 * TODA la app cambie de claro a oscuro con un solo booleano.
 *
 * Si mañana quieres un tercer tema (p. ej. "alto contraste"), solo
 * agregas un objeto más aquí, con las mismas llaves.
 */
export const THEMES = {
  light: {
    // Fondos
    page: "#F5F6FA",
    sidebar: "#FFFFFF",
    panel: "#FFFFFF",
    hover: "#F1F3F8",
    grid: "#E3E7EE",
    border: "#E7EAF0",
    overlay: "rgba(16,20,30,0.5)",

    // Texto
    text: "#111528",
    textSoft: "#5B6472",
    textFaint: "#8A93A3",

    // Color de marca y semánticos
    accent: "#3654E0",
    accentSoft: "#EEF0FD",
    amber: "#D98A1B",
    amberSoft: "#FBF0DC",
    coral: "#D9573F",
    coralSoft: "#FCEAE6",
    success: "#1B9169",
    successSoft: "#E3F5EE",
    violet: "#7C4FE0",
    violetSoft: "#F1ECFC",

    // Sombras y degradados reutilizables
    shadow: "0 1px 2px rgba(16,24,40,0.04), 0 8px 24px rgba(16,24,40,0.06)",
    shadowHover: "0 4px 10px rgba(16,24,40,0.06), 0 16px 40px rgba(54,84,224,0.12)",
    gradAccent: "linear-gradient(135deg, #3654E0 0%, #6C86F0 100%)",
    gradWarm: "linear-gradient(135deg, #D98A1B 0%, #D9573F 100%)",
    gradSuccess: "linear-gradient(135deg, #1B9169 0%, #4FC79A 100%)",
    gradViolet: "linear-gradient(135deg, #7C4FE0 0%, #A98CF0 100%)",
    shimmer: "linear-gradient(90deg, #E7EAF0 25%, #F3F5F9 37%, #E7EAF0 63%)",

    // Manchas decorativas de fondo
    blob1: "rgba(54,84,224,0.12)",
    blob2: "rgba(217,138,27,0.10)",
  },

  dark: {
    page: "#0B0E16",
    sidebar: "#10141F",
    panel: "#151B27",
    hover: "#1B2333",
    grid: "#1C2331",
    border: "#232B3B",
    overlay: "rgba(4,6,12,0.65)",

    text: "#E9ECF3",
    textSoft: "#9AA4B8",
    textFaint: "#5F6981",

    accent: "#5C82F5",
    accentSoft: "#1B2436",
    amber: "#E5A93C",
    amberSoft: "#2B2312",
    coral: "#E37A63",
    coralSoft: "#2C1B17",
    success: "#3ED9A5",
    successSoft: "#122A22",
    violet: "#A98CF0",
    violetSoft: "#211A34",

    shadow: "0 1px 2px rgba(0,0,0,0.2), 0 8px 24px rgba(0,0,0,0.28)",
    shadowHover: "0 4px 14px rgba(0,0,0,0.32), 0 20px 44px rgba(92,130,245,0.20)",
    gradAccent: "linear-gradient(135deg, #5C82F5 0%, #8AA3FA 100%)",
    gradWarm: "linear-gradient(135deg, #E5A93C 0%, #E37A63 100%)",
    gradSuccess: "linear-gradient(135deg, #1B9169 0%, #3ED9A5 100%)",
    gradViolet: "linear-gradient(135deg, #7C4FE0 0%, #A98CF0 100%)",
    shimmer: "linear-gradient(90deg, #1C2331 25%, #262E40 37%, #1C2331 63%)",

    blob1: "rgba(92,130,245,0.18)",
    blob2: "rgba(229,169,60,0.12)",
  },
};

/** Paleta usada para colorear series de gráficas (pastel, barras múltiples, etc). */
export const chartPalette = (theme) => [theme.accent, theme.amber, theme.violet, theme.coral, "#B7C2E6"];
