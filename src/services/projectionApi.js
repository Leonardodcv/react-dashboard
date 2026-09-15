const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "http://localhost:8000").replace(/\/$/, "");
const PROJECTION_ENDPOINT_RAW = import.meta.env.VITE_PROJECTION_ENDPOINT || "/api/proyeccion/";
const PROJECTION_ENDPOINT = PROJECTION_ENDPOINT_RAW.endsWith("/")
  ? PROJECTION_ENDPOINT_RAW
  : `${PROJECTION_ENDPOINT_RAW}/`;
const CONFIG_ENDPOINT = import.meta.env.VITE_CONFIG_ENDPOINT || "/api/v1/config/";

export const MIN_PROJECTION_DATE = "2026-04-01";
export const DEFAULT_ANALYTICS_MAX_HORIZON_DAYS = 730;

export const DEFAULT_PROJECTION_DATE_RANGE = {
  fecha_inicio: import.meta.env.VITE_PROJECTION_FECHA_INICIO || MIN_PROJECTION_DATE,
  fecha_fin: import.meta.env.VITE_PROJECTION_FECHA_FIN || "2026-06-16",
};

export const PROJECTION_REQUESTS = [
  {
    id: "estacion-2-producto-1",
    title: "TGF · Gasolina regular",
    subtitle: "TGF · Gasolina regular · comparativo de proyección y consumo real",
    estacionLabel: "TGF",
    productoLabel: "Gasolina regular",
    params: {
      estacion: "2",
      codprd: "1",
    },
  },
  {
    id: "estacion-2-producto-3",
    title: "TGF · Diesel",
    subtitle: "TGF · Diesel · comparativo de proyección y consumo real",
    estacionLabel: "TGF",
    productoLabel: "Diesel",
    params: {
      estacion: "2",
      codprd: "3",
    },
  },
  {
    id: "estacion-1-producto-3",
    title: "TankFarm · Diesel",
    subtitle: "TankFarm · Diesel · comparativo de proyección y consumo real",
    estacionLabel: "TankFarm",
    productoLabel: "Diesel",
    params: {
      estacion: "1",
      codprd: "3",
    },
  },
];

const DEFAULT_PROJECTION_PARAMS = {
  ...PROJECTION_REQUESTS[0].params,
  ...DEFAULT_PROJECTION_DATE_RANGE,
};

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

  const rows = [
    payload?.data,
    payload?.resultados,
    payload?.proyeccion,
    payload?.predicciones,
    payload?.series,
  ].find(Array.isArray);

  if (rows) return rows;

  const labels = payload?.fechas || payload?.periodos || payload?.labels;
  const actual = payload?.reales || payload?.real || payload?.actual;
  const forecast = payload?.proyecciones || payload?.predicciones || payload?.forecast;

  if (Array.isArray(labels) && (Array.isArray(actual) || Array.isArray(forecast))) {
    return labels.map((label, index) => ({
      periodo: label,
      real: Array.isArray(actual) ? actual[index] : null,
      proyeccion: Array.isArray(forecast) ? forecast[index] : null,
    }));
  }

  throw new Error("La respuesta del backend no contiene una serie reconocible.");
}

async function readErrorMessage(response) {
  const payload = await response.json().catch(() => null);

  if (typeof payload?.detail === "string") return payload.detail;
  if (typeof payload?.error?.message === "string") return payload.error.message;

  if (payload && typeof payload === "object") {
    const firstValue = Object.values(payload)[0];
    if (Array.isArray(firstValue) && firstValue.length) return String(firstValue[0]);
    if (typeof firstValue === "string") return firstValue;
  }

  return `El backend respondió ${response.status} ${response.statusText}`;
}

export function buildProjectionUrl(params = {}) {
  const query = new URLSearchParams({
    ...DEFAULT_PROJECTION_PARAMS,
    ...params,
  });

  return `${API_BASE_URL}${PROJECTION_ENDPOINT}?${query.toString()}`;
}

export async function fetchProjection({ signal, params } = {}) {
  const response = await fetch(buildProjectionUrl(params), {
    headers: { Accept: "application/json" },
    signal,
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  const payload = await response.json();
  const rows = extractRows(payload)
    .map(normalizePoint)
    .filter((item) => item.real !== null || item.proyeccion !== null);

  if (!rows.length) {
    throw new Error("El backend respondió correctamente, pero no devolvió datos de proyección.");
  }

  return rows;
}

export async function fetchFrontendConfig({ signal } = {}) {
  const response = await fetch(`${API_BASE_URL}${CONFIG_ENDPOINT}`, {
    headers: { Accept: "application/json" },
    signal,
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  const payload = await response.json();
  const data = payload?.data || {};
  const maxHorizon = Number(data?.limits?.projection_analytics_max_horizon_days);

  return {
    apiVersion: payload?.meta?.api_version || null,
    algorithmVersion: payload?.meta?.algorithm_version || null,
    analyticsMaxHorizonDays: Number.isFinite(maxHorizon) && maxHorizon > 0
      ? maxHorizon
      : DEFAULT_ANALYTICS_MAX_HORIZON_DAYS,
    projectionAnalyticsPublic: Boolean(data?.feature_flags?.projection_analytics_public),
  };
}
