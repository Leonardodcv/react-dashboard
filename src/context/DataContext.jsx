/**
 * context/DataContext.jsx
 * ------------------------------------------------------------------
 * Centraliza los datos dinámicos de la aplicación. Para Analíticas
 * mantiene tres consultas de proyección independientes para que cada
 * combinación estación/producto tenga su propia gráfica y tablas.
 */
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  randomBarData,
  randomPieData,
  randomLineData,
  randomAreaData,
  sparkline,
} from "../data/generators.js";
import { useToast } from "./ToastContext.jsx";
import { fetchProjection, PROJECTION_REQUESTS } from "../services/projectionApi.js";

const DataContext = createContext(null);

function createInitialProjectionState() {
  return Object.fromEntries(
    PROJECTION_REQUESTS.map((config) => [
      config.id,
      { data: [], loading: true, error: null },
    ]),
  );
}

export function DataProvider({ children }) {
  const { pushToast } = useToast();

  const [barData, setBarData] = useState(randomBarData);
  const [pieData, setPieData] = useState(randomPieData);
  const [lineData, setLineData] = useState(randomLineData);
  const [areaData, setAreaData] = useState(randomAreaData);
  const [sparklines, setSparklines] = useState(() => [sparkline(), sparkline(), sparkline(), sparkline()]);
  const [regenerating, setRegenerating] = useState(false);
  const [projectionState, setProjectionState] = useState(createInitialProjectionState);

  function updateProjectionState(id, patch) {
    setProjectionState((current) => ({
      ...current,
      [id]: {
        ...current[id],
        ...patch,
      },
    }));
  }

  async function loadProjection(id, { notify = false, signal } = {}) {
    const config = PROJECTION_REQUESTS.find((item) => item.id === id);
    if (!config) return;

    updateProjectionState(id, { loading: true, error: null });

    try {
      const data = await fetchProjection({ signal, params: config.params });
      updateProjectionState(id, { data, loading: false, error: null });

      if (notify) {
        pushToast("success", `${config.title}: proyección actualizada`);
      }
    } catch (error) {
      if (error?.name === "AbortError") return;

      const message = error instanceof Error
        ? error.message
        : "No fue posible cargar la proyección";

      updateProjectionState(id, { loading: false, error: message });

      if (notify) {
        pushToast("danger", `${config.title}: ${message}`);
      }
    }
  }

  function loadAllProjections({ notify = false } = {}) {
    return Promise.all(
      PROJECTION_REQUESTS.map((config) => loadProjection(config.id, { notify })),
    );
  }

  useEffect(() => {
    const controller = new AbortController();

    PROJECTION_REQUESTS.forEach((config) => {
      loadProjection(config.id, { signal: controller.signal });
    });

    return () => controller.abort();
  }, []);

  // Progreso "en vivo" que usan los distintos loaders de la página de Componentes.
  const [progress, setProgress] = useState(30);
  useEffect(() => {
    const id = setInterval(() => setProgress((p) => (p >= 100 ? 20 : p + 7)), 900);
    return () => clearInterval(id);
  }, []);

  const totalIngresos = useMemo(() => barData.reduce((a, b) => a + b.ingresos, 0), [barData]);
  const totalGastos = useMemo(() => barData.reduce((a, b) => a + b.gastos, 0), [barData]);

  function regenerate() {
    setRegenerating(true);
    setBarData(randomBarData());
    setPieData(randomPieData());
    setLineData(randomLineData());
    setAreaData(randomAreaData());
    setSparklines([sparkline(), sparkline(), sparkline(), sparkline()]);
    loadAllProjections();
    pushToast("success", "Datos actualizados en todos los paneles");
    setTimeout(() => setRegenerating(false), 500);
  }

  const projectionSections = PROJECTION_REQUESTS.map((config) => ({
    ...config,
    ...(projectionState[config.id] || { data: [], loading: true, error: null }),
  }));

  // Alias de la primera serie para mantener compatibilidad con cualquier
  // componente que todavía espere las propiedades antiguas del contexto.
  const firstProjection = projectionSections[0] || {
    data: [],
    loading: true,
    error: null,
  };

  const value = {
    barData,
    pieData,
    lineData,
    areaData,
    sparklines,
    progress,
    regenerating,
    totalIngresos,
    totalGastos,
    regenerate,
    projectionSections,
    reloadProjection: (id) => loadProjection(id || PROJECTION_REQUESTS[0].id, { notify: true }),
    reloadAllProjections: () => loadAllProjections({ notify: true }),
    projectionData: firstProjection.data,
    projectionLoading: firstProjection.loading,
    projectionError: firstProjection.error,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData() debe usarse dentro de <DataProvider>");
  return ctx;
}
