const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "http://localhost:8000").replace(/\/$/, "");
const PROJECTION_ENDPOINT = import.meta.env.VITE_PROJECTION_ENDPOINT || "/api/proyeccion";

function toNumber(value) {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function firstDefined(source, keys) {
  for (const key of keys) {
    if (source?.[key] !== undefined && source?.[key] !== null) return source[key];
  }
  return null;
}

function normalizePoint(item, index) {
  const fecha = firstDefined(item, ["fecha", "Fecha", "date", "periodo", "mes", "semana"]);
  const real = toNumber(firstDefined(item, ["real", "valor_real", "consumo_real", "litros_reales", "observado", "actual", "y_real"]));
  const proyeccion = toNumber(firstDefined(item, ["proyeccion", "prediccion", "pronostico", "forecast", "valor_proyectado", "consumo_proyectado", "y_pred"]));
  return { periodo: fecha ?? `P${index + 1}`, real, proyeccion };
}

function extractRows(payload) {
  if (Array.isArray(payload)) return payload;
  const rows = [payload?.data, payload?.resultados, payload?.proyeccion, payload?.predicciones, payload?.series].find(Array.isArray);
  if (rows) return rows;

  const labels = payload?.fechas || payload?.periodos || payload?.labels;
  const actual = payload?.reales || payload?.real || payload?.actual;
  const forecast = payload?.proyecciones || payload?.predicciones || payload?.forecast;
  if (Array.isArray(labels) && (Array.isArray(actual) || Array.isArray(forecast))) {
    return labels.map((label, index) => ({ periodo: label, real: Array.isArray(actual) ? actual[index] : null, proyeccion: Array.isArray(forecast) ? forecast[index] : null }));
  }
  throw new Error("La respuesta del backend no contiene una serie reconocible.");
}

export async function fetchProjection({ signal } = {}) {
  const response = await fetch(`${API_BASE_URL}${PROJECTION_ENDPOINT}`, { headers: { Accept: "application/json" }, signal });
  if (!response.ok) throw new Error(`El backend respondió ${response.status} ${response.statusText}`);
  const payload = await response.json();
  const rows = extractRows(payload).map(normalizePoint).filter((item) => item.real !== null || item.proyeccion !== null);
  if (!rows.length) throw new Error("El backend respondió correctamente, pero no devolvió datos de proyección.");
  return rows;
}
