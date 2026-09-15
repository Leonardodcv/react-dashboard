import { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Brush,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CalendarDays, ChevronDown, ChevronUp } from "lucide-react";
import { useTheme } from "../theme/ThemeContext.jsx";
import { useData } from "../context/DataContext.jsx";
import { Panel, AlertBanner, ChartTooltip } from "../components/ui/index.js";
import {
  DEFAULT_ANALYTICS_MAX_HORIZON_DAYS,
  MIN_PROJECTION_DATE,
} from "../services/projectionApi.js";

const numberFormatter = new Intl.NumberFormat("es-GT", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

function nullableNumber(value) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function formatNumber(value) {
  const number = nullableNumber(value);
  return number === null ? "—" : numberFormatter.format(number);
}

function formatDelta(value) {
  const number = nullableNumber(value);
  if (number === null) return "—";
  return number === 0 ? "0" : numberFormatter.format(number);
}

function calculatePercentageError(projected, actual) {
  const proyeccion = nullableNumber(projected);
  const real = nullableNumber(actual);

  if (proyeccion === null || real === null) return null;
  if (real === 0) return proyeccion === 0 ? 0 : null;
  return (Math.abs(proyeccion - real) / Math.abs(real)) * 100;
}

function formatPercentage(value) {
  const number = nullableNumber(value);
  return number === null ? "—" : `${numberFormatter.format(number)}%`;
}

function isoToUtcDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || "")) return null;
  const [year, month, day] = value.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function addDaysIso(value, days) {
  const date = isoToUtcDate(value);
  if (!date) return "";
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function inclusiveDays(start, end) {
  const startDate = isoToUtcDate(start);
  const endDate = isoToUtcDate(end);
  if (!startDate || !endDate) return null;
  return Math.floor((endDate - startDate) / 86400000) + 1;
}

function formatIsoDate(value) {
  const date = isoToUtcDate(value);
  if (!date) return value || "—";
  return new Intl.DateTimeFormat("es-GT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

function buildDetailRows(data) {
  let acumuladoProyeccion = 0;
  let acumuladoRealObservado = 0;
  let acumuladoProyeccionComparable = 0;

  return data.map((item) => {
    const proyeccion = nullableNumber(item.proyeccion);
    const real = nullableNumber(item.real);
    const tieneProyeccion = proyeccion !== null;
    const tieneReal = real !== null;
    const comparable = tieneProyeccion && tieneReal;

    if (tieneProyeccion) acumuladoProyeccion += proyeccion;
    if (tieneReal) acumuladoRealObservado += real;
    if (comparable) acumuladoProyeccionComparable += proyeccion;

    const diferencia = comparable ? Math.abs(proyeccion - real) : null;
    const errorPorcentual = comparable
      ? calculatePercentageError(proyeccion, real)
      : null;

    // En v14.4, real:null significa que todavía no existe dato observado.
    // No se trata como cero y tampoco se calcula diferencia acumulada para
    // esa fecha. La comparación acumulada usa únicamente días comparables.
    const diferenciaAcumulada = comparable
      ? Math.abs(acumuladoProyeccionComparable - acumuladoRealObservado)
      : null;
    const errorPorcentualAcumulado = comparable
      ? calculatePercentageError(acumuladoProyeccionComparable, acumuladoRealObservado)
      : null;

    return {
      fecha: item.periodo,
      proyeccion,
      real,
      diferencia,
      errorPorcentual,
      proyeccionAcumulada: acumuladoProyeccion,
      realAcumulada: tieneReal ? acumuladoRealObservado : null,
      diferenciaAcumulada,
      errorPorcentualAcumulado,
      tieneReal,
      comparable,
    };
  });
}

function buildSummaryRows(detailRows) {
  if (!detailRows.length) return [];

  const projectedRows = detailRows.filter((row) => row.proyeccion !== null);
  const realRows = detailRows.filter((row) => row.real !== null);
  const comparableRows = detailRows.filter((row) => row.comparable);
  const pendingRows = detailRows.length - realRows.length;

  const totalProyeccion = projectedRows.reduce((sum, row) => sum + row.proyeccion, 0);
  const totalReal = realRows.reduce((sum, row) => sum + row.real, 0);
  const proyeccionComparable = comparableRows.reduce((sum, row) => sum + row.proyeccion, 0);
  const realComparable = comparableRows.reduce((sum, row) => sum + row.real, 0);
  const diferenciaComparable = comparableRows.length
    ? Math.abs(proyeccionComparable - realComparable)
    : null;
  const errorComparable = comparableRows.length
    ? calculatePercentageError(proyeccionComparable, realComparable)
    : null;

  const promedioProyeccion = projectedRows.length
    ? totalProyeccion / projectedRows.length
    : null;
  const promedioReal = realRows.length
    ? totalReal / realRows.length
    : null;

  const maxGapRow = comparableRows.length
    ? comparableRows.reduce(
      (best, current) => (current.diferencia > best.diferencia ? current : best),
      comparableRows[0],
    )
    : null;

  return [
    { metrica: "Días del horizonte", valor: `${detailRows.length}` },
    { metrica: "Días con dato real", valor: `${realRows.length}` },
    { metrica: "Días sin dato real", valor: `${pendingRows}` },
    { metrica: "Proyección total del horizonte", valor: formatNumber(totalProyeccion) },
    { metrica: "Real total observado", valor: formatNumber(totalReal) },
    { metrica: "Proyección comparable", valor: formatNumber(proyeccionComparable) },
    { metrica: "Diferencia acumulada comparable", valor: formatNumber(diferenciaComparable) },
    { metrica: "Error porcentual acumulado comparable", valor: formatPercentage(errorComparable) },
    { metrica: "Promedio proyectado diario", valor: formatNumber(promedioProyeccion) },
    { metrica: "Promedio real diario", valor: formatNumber(promedioReal) },
    {
      metrica: "Mayor desviación observada",
      valor: maxGapRow
        ? `${maxGapRow.fecha} · ${formatNumber(maxGapRow.diferencia)}`
        : "—",
    },
  ];
}

function buildVariationRows(detailRows) {
  const comparableRows = detailRows.filter((row) => row.comparable);
  if (!comparableRows.length) return [];

  return comparableRows.slice(-6).map((row) => {
    const signedGap = row.real - row.proyeccion;
    const estado = signedGap === 0
      ? "Exacto"
      : signedGap > 0
        ? "Real por encima"
        : "Real por debajo";

    return {
      fecha: row.fecha,
      estado,
      brecha: signedGap,
      acumulado: row.diferenciaAcumulada,
      errorAcumulado: row.errorPorcentualAcumulado,
    };
  });
}

function ProjectionAnalyticsSection({ section, onReload, backendConfig }) {
  const { theme: t } = useTheme();
  const [tablesExpanded, setTablesExpanded] = useState(false);

  const detailRows = useMemo(() => buildDetailRows(section.data), [section.data]);
  const summaryRows = useMemo(() => buildSummaryRows(detailRows), [detailRows]);
  const variationRows = useMemo(() => buildVariationRows(detailRows), [detailRows]);

  const observedRows = detailRows.filter((row) => row.tieneReal);
  const pendingRows = detailRows.length - observedRows.length;
  const comparableRows = detailRows.filter((row) => row.comparable);
  const largestGap = comparableRows.length
    ? comparableRows.reduce(
      (best, current) => (current.diferencia > best.diferencia ? current : best),
      comparableRows[0],
    )
    : null;

  const gradientId = section.id.replace(/[^a-zA-Z0-9_-]/g, "-");
  const queryLabel = `${section.estacionLabel} · ${section.productoLabel} · ${section.params.fecha_inicio} → ${section.params.fecha_fin}`;
  const backendLabel = backendConfig?.apiVersion || "14.4";

  return (
    <section style={{ marginBottom: 30 }}>
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          gap: 16,
          margin: "0 2px 10px",
          flexWrap: "wrap",
        }}
      >
        <div>
          <h2
            style={{
              margin: 0,
              color: t.text,
              fontSize: 17,
              fontWeight: 700,
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}
          >
            {section.title}
          </h2>
          <div
            style={{
              marginTop: 4,
              color: t.textFaint,
              fontSize: 10.5,
              fontFamily: "'IBM Plex Mono', monospace",
            }}
          >
            {queryLabel}
          </div>
        </div>
        <div style={{ color: t.textSoft, fontSize: 12 }}>
          {detailRows.length
            ? `${detailRows.length} registros · ${observedRows.length} con real${pendingRows ? ` · ${pendingRows} sin real` : ""}`
            : "Esperando datos"}
        </div>
      </div>

      <Panel
        title={`Proyección vs. consumo real · ${section.title}`}
        code={`${section.subtitle} · backend ${backendLabel}`}
        style={{ marginBottom: 12 }}
        right={
          <button
            type="button"
            onClick={() => onReload(section.id)}
            disabled={section.loading}
            style={{
              border: `1px solid ${t.border}`,
              background: t.surface,
              color: section.loading ? t.textFaint : t.text,
              borderRadius: 8,
              padding: "8px 12px",
              cursor: section.loading ? "wait" : "pointer",
              fontSize: 12,
              opacity: section.loading ? 0.7 : 1,
            }}
          >
            {section.loading ? "Actualizando…" : "Actualizar datos"}
          </button>
        }
      >
        {section.loading ? (
          <div style={{ height: 430, display: "grid", placeItems: "center", color: t.textSoft }}>
            Cargando proyección…
          </div>
        ) : section.error ? (
          <div style={{ height: 430, display: "grid", placeItems: "center", textAlign: "center", padding: 20 }}>
            <div>
              <div style={{ color: t.coral, marginBottom: 10 }}>{section.error}</div>
              <button
                type="button"
                onClick={() => onReload(section.id)}
                style={{
                  border: `1px solid ${t.border}`,
                  background: t.surface,
                  color: t.text,
                  borderRadius: 8,
                  padding: "8px 12px",
                  cursor: "pointer",
                }}
              >
                Reintentar
              </button>
            </div>
          </div>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={430}>
              <AreaChart data={section.data} margin={{ top: 10, right: 10, left: 0, bottom: 18 }}>
                <defs>
                  <linearGradient id={`fillReal-${gradientId}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={t.accent} stopOpacity={0.34} />
                    <stop offset="100%" stopColor={t.accent} stopOpacity={0.03} />
                  </linearGradient>
                  <linearGradient id={`fillProjection-${gradientId}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={t.amber} stopOpacity={0.28} />
                    <stop offset="100%" stopColor={t.amber} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke={t.grid} vertical={false} />
                <XAxis
                  dataKey="periodo"
                  tick={{ fontSize: 11, fill: t.textSoft }}
                  axisLine={{ stroke: t.grid }}
                  tickLine={false}
                  minTickGap={24}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: t.textSoft }}
                  axisLine={{ stroke: t.grid }}
                  tickLine={false}
                  width={70}
                  tickFormatter={(value) => formatNumber(value)}
                />
                <Tooltip
                  content={(
                    <ChartTooltip
                      formatter={(value, name) => (
                        value === null || value === undefined
                          ? (name === "Real" ? "Sin dato real" : "—")
                          : formatNumber(value)
                      )}
                    />
                  )}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Area
                  type="monotone"
                  dataKey="real"
                  name="Real"
                  stroke={t.accent}
                  strokeWidth={2.5}
                  fill={`url(#fillReal-${gradientId})`}
                  connectNulls={false}
                  animationDuration={600}
                />
                <Area
                  type="monotone"
                  dataKey="proyeccion"
                  name="Proyección"
                  stroke={t.amber}
                  strokeWidth={2.5}
                  strokeDasharray="6 4"
                  fill={`url(#fillProjection-${gradientId})`}
                  connectNulls
                  animationDuration={600}
                />
                <Brush
                  dataKey="periodo"
                  height={22}
                  stroke={t.border}
                  travellerWidth={10}
                  fill={t.surface}
                  tickFormatter={(value) => value}
                />
              </AreaChart>
            </ResponsiveContainer>

            <div
              style={{
                display: "flex",
                gap: 14,
                flexWrap: "wrap",
                paddingTop: 8,
                color: t.textFaint,
                fontSize: 11,
              }}
            >
              <span>Con dato real: <strong style={{ color: t.textSoft }}>{observedRows.length}</strong></span>
              <span>Sin dato real: <strong style={{ color: pendingRows ? t.amber : t.textSoft }}>{pendingRows}</strong></span>
              {largestGap && (
                <span>
                  Mayor diferencia observada: <strong style={{ color: t.textSoft }}>{formatNumber(largestGap.diferencia)} L</strong>
                </span>
              )}
            </div>
          </>
        )}
      </Panel>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          marginBottom: tablesExpanded ? 12 : 0,
          padding: "13px 16px",
          background: t.panel,
          border: `1px solid ${t.border}`,
          borderRadius: 12,
          boxShadow: t.shadow,
          flexWrap: "wrap",
        }}
      >
        <div>
          <div style={{ color: t.text, fontWeight: 600, fontSize: 13 }}>
            Tablas de análisis · {section.title}
          </div>
          <div style={{ color: t.textFaint, fontSize: 11, marginTop: 2 }}>
            {detailRows.length
              ? `${detailRows.length} filas disponibles. Los días sin valor real se muestran como “—” y se excluyen de los errores comparables.`
              : "Las tablas se habilitarán cuando existan datos."}
          </div>
        </div>
        <button
          type="button"
          onClick={() => setTablesExpanded((current) => !current)}
          disabled={!detailRows.length}
          aria-expanded={tablesExpanded}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            border: `1px solid ${t.border}`,
            background: t.surface,
            color: detailRows.length ? t.text : t.textFaint,
            borderRadius: 8,
            padding: "8px 12px",
            cursor: detailRows.length ? "pointer" : "not-allowed",
            fontSize: 12,
          }}
        >
          {tablesExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          {tablesExpanded ? "Ocultar tablas" : "Mostrar tablas"}
        </button>
      </div>

      {tablesExpanded && (
        <div>
          <Panel
            title={`Detalle diario · ${section.title}`}
            code="Fecha, valores diarios, diferencias, errores porcentuales y acumulados"
            noPad
            style={{ marginBottom: 16 }}
          >
            <div
              style={{ maxHeight: 520, overflow: "auto" }}
              className="scrollbar-thin"
            >
              <table style={{ width: "100%", minWidth: 1480, borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr>
                    {[
                      "Fecha",
                      "Proyección",
                      "Real",
                      "Diferencia",
                      "Error porcentual",
                      "Proyección acumulada",
                      "Real acumulada",
                      "Diferencia acumulada",
                      "Error porcentual acumulado",
                    ].map((header) => (
                      <th
                        key={header}
                        style={{
                          position: "sticky",
                          top: 0,
                          zIndex: 2,
                          textAlign: header === "Fecha" ? "left" : "right",
                          padding: "10px 12px",
                          fontSize: 11,
                          fontFamily: "'IBM Plex Mono', monospace",
                          color: t.textFaint,
                          background: t.panel,
                          borderBottom: `1px solid ${t.border}`,
                          fontWeight: 500,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {detailRows.map((row, index) => (
                    <tr
                      key={`${section.id}-${row.fecha}-${index}`}
                      className="table-row"
                      title={row.tieneReal ? undefined : "Todavía no existe dato real para esta fecha"}
                    >
                      <td style={{ padding: "11px 12px", borderBottom: `1px solid ${t.border}`, color: t.text, fontWeight: 500, whiteSpace: "nowrap" }}>
                        {row.fecha}
                      </td>
                      <td style={{ padding: "11px 12px", borderBottom: `1px solid ${t.border}`, textAlign: "right", color: t.textSoft, fontFamily: "'IBM Plex Mono', monospace" }}>
                        {formatNumber(row.proyeccion)}
                      </td>
                      <td style={{ padding: "11px 12px", borderBottom: `1px solid ${t.border}`, textAlign: "right", color: row.tieneReal ? t.textSoft : t.textFaint, fontFamily: "'IBM Plex Mono', monospace" }}>
                        {formatNumber(row.real)}
                      </td>
                      <td style={{ padding: "11px 12px", borderBottom: `1px solid ${t.border}`, textAlign: "right", color: row.diferencia === null ? t.textFaint : t.text, fontFamily: "'IBM Plex Mono', monospace" }}>
                        {formatNumber(row.diferencia)}
                      </td>
                      <td style={{ padding: "11px 12px", borderBottom: `1px solid ${t.border}`, textAlign: "right", color: row.errorPorcentual === null ? t.textFaint : t.amber, fontFamily: "'IBM Plex Mono', monospace" }}>
                        {formatPercentage(row.errorPorcentual)}
                      </td>
                      <td style={{ padding: "11px 12px", borderBottom: `1px solid ${t.border}`, textAlign: "right", color: t.textSoft, fontFamily: "'IBM Plex Mono', monospace" }}>
                        {formatNumber(row.proyeccionAcumulada)}
                      </td>
                      <td style={{ padding: "11px 12px", borderBottom: `1px solid ${t.border}`, textAlign: "right", color: row.realAcumulada === null ? t.textFaint : t.textSoft, fontFamily: "'IBM Plex Mono', monospace" }}>
                        {formatNumber(row.realAcumulada)}
                      </td>
                      <td style={{ padding: "11px 12px", borderBottom: `1px solid ${t.border}`, textAlign: "right", color: row.diferenciaAcumulada === null ? t.textFaint : row.diferenciaAcumulada > 0 ? t.amber : t.textSoft, fontFamily: "'IBM Plex Mono', monospace" }}>
                        {formatNumber(row.diferenciaAcumulada)}
                      </td>
                      <td style={{ padding: "11px 12px", borderBottom: `1px solid ${t.border}`, textAlign: "right", color: row.errorPorcentualAcumulado === null ? t.textFaint : t.amber, fontFamily: "'IBM Plex Mono', monospace" }}>
                        {formatPercentage(row.errorPorcentualAcumulado)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 16 }}>
            <Panel title="Resumen del período" code={`${section.title} · métricas observadas y comparables`} noPad>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr>
                    {["Métrica", "Valor"].map((header, index) => (
                      <th
                        key={header}
                        style={{
                          textAlign: index === 0 ? "left" : "right",
                          padding: "10px 12px",
                          fontSize: 11,
                          fontFamily: "'IBM Plex Mono', monospace",
                          color: t.textFaint,
                          borderBottom: `1px solid ${t.border}`,
                          fontWeight: 500,
                        }}
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {summaryRows.map((row, index) => (
                    <tr key={`${section.id}-${row.metrica}-${index}`} className="table-row">
                      <td style={{ padding: "11px 12px", borderBottom: `1px solid ${t.border}`, color: t.text, fontWeight: 500 }}>
                        {row.metrica}
                      </td>
                      <td style={{ padding: "11px 12px", borderBottom: `1px solid ${t.border}`, textAlign: "right", color: t.textSoft, fontFamily: "'IBM Plex Mono', monospace" }}>
                        {row.valor}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Panel>

            <Panel title="Últimas variaciones" code={`${section.title} · solo días con real disponible`} noPad>
              <div style={{ overflowX: "auto" }} className="scrollbar-thin">
                <table style={{ width: "100%", minWidth: 590, borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr>
                      {["Fecha", "Estado", "Brecha", "Dif. acumulada", "Error acum."].map((header, index) => (
                        <th
                          key={header}
                          style={{
                            textAlign: index <= 1 ? "left" : "right",
                            padding: "10px 12px",
                            fontSize: 11,
                            fontFamily: "'IBM Plex Mono', monospace",
                            color: t.textFaint,
                            borderBottom: `1px solid ${t.border}`,
                            fontWeight: 500,
                            whiteSpace: "nowrap",
                          }}
                        >
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {variationRows.length ? variationRows.map((row, index) => (
                      <tr key={`${section.id}-${row.fecha}-${index}`} className="table-row">
                        <td style={{ padding: "11px 12px", borderBottom: `1px solid ${t.border}`, color: t.text, fontWeight: 500, whiteSpace: "nowrap" }}>
                          {row.fecha}
                        </td>
                        <td style={{ padding: "11px 12px", borderBottom: `1px solid ${t.border}`, color: t.textSoft, whiteSpace: "nowrap" }}>
                          {row.estado}
                        </td>
                        <td style={{ padding: "11px 12px", borderBottom: `1px solid ${t.border}`, textAlign: "right", color: row.brecha > 0 ? t.accent : row.brecha < 0 ? t.amber : t.textSoft, fontFamily: "'IBM Plex Mono', monospace" }}>
                          {row.brecha > 0 ? "+" : ""}{formatDelta(row.brecha)}
                        </td>
                        <td style={{ padding: "11px 12px", borderBottom: `1px solid ${t.border}`, textAlign: "right", color: t.textSoft, fontFamily: "'IBM Plex Mono', monospace" }}>
                          {formatNumber(row.acumulado)}
                        </td>
                        <td style={{ padding: "11px 12px", borderBottom: `1px solid ${t.border}`, textAlign: "right", color: t.textSoft, fontFamily: "'IBM Plex Mono', monospace" }}>
                          {formatPercentage(row.errorAcumulado)}
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={5} style={{ padding: 18, color: t.textFaint, textAlign: "center" }}>
                          No hay días comparables con valor real disponible.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Panel>
          </div>
        </div>
      )}
    </section>
  );
}

function ProjectionDateFilter({ dateRange, onApply, loading, backendConfig }) {
  const { theme: t, dark } = useTheme();
  const [startDate, setStartDate] = useState(dateRange.fecha_inicio);
  const [endDate, setEndDate] = useState(dateRange.fecha_fin);
  const [validationError, setValidationError] = useState("");

  const maxHorizonDays = backendConfig?.analyticsMaxHorizonDays
    || DEFAULT_ANALYTICS_MAX_HORIZON_DAYS;
  const maxEndDate = startDate
    ? addDaysIso(startDate, maxHorizonDays - 1)
    : "";

  useEffect(() => {
    setStartDate(dateRange.fecha_inicio);
    setEndDate(dateRange.fecha_fin);
  }, [dateRange.fecha_inicio, dateRange.fecha_fin]);

  useEffect(() => {
    if (maxEndDate && endDate && endDate > maxEndDate) {
      setEndDate(maxEndDate);
    }
  }, [maxEndDate, endDate]);

  const hasChanges = startDate !== dateRange.fecha_inicio || endDate !== dateRange.fecha_fin;
  const selectedDays = inclusiveDays(startDate, endDate);

  function handleStartChange(event) {
    const value = event.target.value;
    setStartDate(value);
    setValidationError("");

    if (!value) return;

    const nextMaxEnd = addDaysIso(value, maxHorizonDays - 1);
    if (endDate && endDate < value) {
      setEndDate(value);
    } else if (endDate && nextMaxEnd && endDate > nextMaxEnd) {
      setEndDate(nextMaxEnd);
    }
  }

  function handleEndChange(event) {
    setEndDate(event.target.value);
    setValidationError("");
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!startDate || !endDate) {
      setValidationError("Selecciona una fecha de inicio y una fecha final.");
      return;
    }

    if (startDate < MIN_PROJECTION_DATE) {
      setValidationError("La fecha de inicio debe ser igual o posterior al 1 de abril de 2026.");
      return;
    }

    if (endDate < startDate) {
      setValidationError("La fecha final no puede ser anterior a la fecha de inicio.");
      return;
    }

    const days = inclusiveDays(startDate, endDate);
    if (days !== null && days > maxHorizonDays) {
      setValidationError(`El backend permite un máximo de ${maxHorizonDays} días en /api/proyeccion/.`);
      return;
    }

    setValidationError("");
    await onApply({ fecha_inicio: startDate, fecha_fin: endDate });
  }

  const inputStyle = {
    width: "100%",
    minWidth: 190,
    border: `1px solid ${t.border}`,
    background: t.page,
    color: t.text,
    borderRadius: 9,
    padding: "10px 12px",
    fontSize: 13,
    outline: "none",
    colorScheme: dark ? "dark" : "light",
  };

  return (
    <Panel
      title="Período de proyección"
      code={`Backend ${backendConfig?.apiVersion || "14.4"} · horizonte analítico máximo: ${maxHorizonDays} días`}
      style={{ marginBottom: 18 }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          display: "flex",
          alignItems: "flex-end",
          gap: 14,
          flexWrap: "wrap",
        }}
      >
        <div style={{ flex: "1 1 220px" }}>
          <label
            htmlFor="projection-start-date"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              marginBottom: 7,
              color: t.textSoft,
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            <CalendarDays size={14} />
            Día de inicio
          </label>
          <input
            id="projection-start-date"
            type="date"
            min={MIN_PROJECTION_DATE}
            value={startDate}
            onChange={handleStartChange}
            style={inputStyle}
          />
          <div style={{ marginTop: 6, color: t.textFaint, fontSize: 10.5 }}>
            Fecha mínima: 01/04/2026
          </div>
        </div>

        <div style={{ flex: "1 1 220px" }}>
          <label
            htmlFor="projection-end-date"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              marginBottom: 7,
              color: t.textSoft,
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            <CalendarDays size={14} />
            Día final
          </label>
          <input
            id="projection-end-date"
            type="date"
            min={startDate || MIN_PROJECTION_DATE}
            max={maxEndDate || undefined}
            value={endDate}
            onChange={handleEndChange}
            style={inputStyle}
          />
          <div style={{ marginTop: 6, color: t.textFaint, fontSize: 10.5 }}>
            {startDate && maxEndDate
              ? `Con este inicio, fecha final máxima: ${formatIsoDate(maxEndDate)}`
              : "Debe ser igual o posterior al día de inicio"}
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || !hasChanges}
          style={{
            minHeight: 42,
            border: `1px solid ${loading || !hasChanges ? t.border : t.accent}`,
            background: loading || !hasChanges ? t.hover : t.accent,
            color: loading || !hasChanges ? t.textFaint : "#FFFFFF",
            borderRadius: 9,
            padding: "10px 18px",
            cursor: loading || !hasChanges ? "not-allowed" : "pointer",
            fontSize: 12.5,
            fontWeight: 600,
            whiteSpace: "nowrap",
          }}
        >
          {loading ? "Consultando…" : hasChanges ? "Aplicar período" : "Período aplicado"}
        </button>
      </form>

      <div
        style={{
          marginTop: 12,
          display: "flex",
          gap: 14,
          flexWrap: "wrap",
          color: t.textFaint,
          fontSize: 11,
        }}
      >
        <span>Rango seleccionado: <strong style={{ color: t.textSoft }}>{selectedDays ?? "—"} días</strong></span>
        <span>La fecha final puede ser futura; v14.4 devuelve <strong style={{ color: t.textSoft }}>real: null</strong> cuando aún no existe observación.</span>
      </div>

      {backendConfig?.error && (
        <div
          style={{
            marginTop: 10,
            padding: "9px 11px",
            borderRadius: 8,
            background: t.hover,
            color: t.textFaint,
            fontSize: 11,
          }}
        >
          No se pudo leer /api/v1/config/. Se usa el límite de respaldo de {DEFAULT_ANALYTICS_MAX_HORIZON_DAYS} días.
        </div>
      )}

      {validationError && (
        <div
          role="alert"
          style={{
            marginTop: 12,
            padding: "9px 11px",
            borderRadius: 8,
            background: t.coralSoft,
            color: t.coral,
            fontSize: 12,
          }}
        >
          {validationError}
        </div>
      )}
    </Panel>
  );
}

export default function Analytics() {
  const {
    projectionSections,
    projectionDateRange,
    backendConfig,
    applyProjectionDateRange,
    reloadProjection,
  } = useData();

  const projectionsLoading = projectionSections.some((section) => section.loading);
  const missingRealCount = projectionSections.reduce(
    (total, section) => total + section.data.filter((point) => point.real === null).length,
    0,
  );

  return (
    <>
      <ProjectionDateFilter
        dateRange={projectionDateRange}
        onApply={applyProjectionDateRange}
        loading={projectionsLoading}
        backendConfig={backendConfig}
      />

      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 22 }}>
        <AlertBanner
          type="info"
          title="Frontend adaptado al horizonte extensible del backend v14.4"
          message={`Período actual: ${projectionDateRange.fecha_inicio} a ${projectionDateRange.fecha_fin}. Las tres combinaciones usan el mismo rango y el límite analítico configurado es de ${backendConfig.analyticsMaxHorizonDays} días.`}
        />
        <AlertBanner
          type={missingRealCount ? "warning" : "success"}
          title={missingRealCount ? "El período contiene fechas sin dato real" : "Todos los puntos cargados tienen dato real"}
          message={missingRealCount
            ? `Hay ${missingRealCount} puntos sin valor real entre las tres series. Se muestran como “—” y no se interpretan como cero al calcular diferencias, errores o métricas comparables. Las tablas permanecen contraídas por defecto.`
            : "Las diferencias y errores porcentuales pueden calcularse sobre todos los puntos cargados. Las tablas permanecen contraídas por defecto."}
        />
      </div>

      {projectionSections.map((section) => (
        <ProjectionAnalyticsSection
          key={section.id}
          section={section}
          onReload={reloadProjection}
          backendConfig={backendConfig}
        />
      ))}
    </>
  );
}
