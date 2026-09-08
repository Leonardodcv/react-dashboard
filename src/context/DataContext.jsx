/**
 * context/DataContext.jsx
 * ------------------------------------------------------------------
 * Centraliza los datos "dinámicos" que alimentan las gráficas
 * (Dashboard y Analíticas) y la función `regenerate()` que el botón
 * "regenerar datos" de la barra superior dispara.
 *
 * Al vivir en contexto, cualquier página puede leer los mismos datos
 * sin que el Topbar necesite conocer el detalle de cada gráfica.
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
import { fetchProjection } from "../services/projectionApi.js";

const DataContext = createContext(null);

export function DataProvider({ children }) {
  const { pushToast } = useToast();

  const [barData, setBarData] = useState(randomBarData);
  const [pieData, setPieData] = useState(randomPieData);
  const [lineData, setLineData] = useState(randomLineData);
  const [areaData, setAreaData] = useState(randomAreaData);
  const [sparklines, setSparklines] = useState(() => [sparkline(), sparkline(), sparkline(), sparkline()]);
  const [regenerating, setRegenerating] = useState(false);

  const [projectionData, setProjectionData] = useState([]);
  const [projectionLoading, setProjectionLoading] = useState(true);
  const [projectionError, setProjectionError] = useState(null);


  async function loadProjection({ notify = false } = {}) {
    setProjectionLoading(true);
    setProjectionError(null);

    try {
      const data = await fetchProjection();
      setProjectionData(data);
      if (notify) pushToast("success", "Proyección actualizada desde el backend");
    } catch (error) {
      const message = error instanceof Error ? error.message : "No fue posible cargar la proyección";
      setProjectionError(message);
      if (notify) pushToast("danger", message);
    } finally {
      setProjectionLoading(false);
    }
  }

  useEffect(() => {
    const controller = new AbortController();

    fetchProjection({ signal: controller.signal })
      .then(setProjectionData)
      .catch((error) => {
        if (error?.name !== "AbortError") {
          setProjectionError(error instanceof Error ? error.message : "No fue posible cargar la proyección");
        }
      })
      .finally(() => setProjectionLoading(false));

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
    loadProjection();
    pushToast("success", "Datos actualizados en todos los paneles");
    setTimeout(() => setRegenerating(false), 500);
  }

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
    projectionData,
    projectionLoading,
    projectionError,
    reloadProjection: () => loadProjection({ notify: true }),
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData() debe usarse dentro de <DataProvider>");
  return ctx;
}
