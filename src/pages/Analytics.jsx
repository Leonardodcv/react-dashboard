import { useMemo, useState } from "react";
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
import { ChevronDown, ChevronUp } from "lucide-react";
import { useTheme } from "../theme/ThemeContext.jsx";
import { useData } from "../context/DataContext.jsx";
import { Panel, AlertBanner, ChartTooltip } from "../components/ui/index.js";

const numberFormatter = new Intl.NumberFormat("es-GT", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

function safeNumber(value) {
  return Number.isFinite(Number(value)) ? Number(value) : 0;
}

function formatNumber(value) {
  return numberFormatter.format(safeNumber(value));
}

function formatDelta(value) {
  const number = safeNumber(value);
  return number === 0 ? "0" : numberFormatter.format(number);
}

function calculatePercentageError(projected, actual) {
  const proyeccion = safeNumber(projected);
  const real = safeNumber(actual);

  if (real === 0) return proyeccion === 0 ? 0 : null;
  return (Math.abs(proyeccion - real) / Math.abs(real)) * 100;
}

function formatPercentage(value) {
  if (value === null || value === undefined || !Number.isFinite(value)) return "—";
  return `${numberFormatter.format(value)}%`;
}

function buildDetailRows(data) {
  let acumuladoProyeccion = 0;
  let acumuladoReal = 0;

  return data.map((item) => {
    const proyeccion = safeNumber(item.proyeccion);
    const real = safeNumber(item.real);
    const diferencia = Math.abs(proyeccion - real);
    const errorPorcentual = calculatePercentageError(proyeccion, real);

    acumuladoProyeccion += proyeccion;
    acumuladoReal += real;

    const diferenciaAcumulada = Math.abs(acumuladoProyeccion - acumuladoReal);
    const errorPorcentualAcumulado = calculatePercentageError(
      acumuladoProyeccion,
      acumuladoReal,
    );

    return {
      fecha: item.periodo,
      proyeccion,
      real,
      diferencia,
      errorPorcentual,
      proyeccionAcumulada: acumuladoProyeccion,
      realAcumulada: acumuladoReal,
      diferenciaAcumulada,
      errorPorcentualAcumulado,
    };
  });
}

function buildSummaryRows(detailRows) {
  if (!detailRows.length) return [];

  const last = detailRows[detailRows.length - 1];
  const totalProyeccion = last.proyeccionAcumulada;
  const totalReal = last.realAcumulada;
  const promedioProyeccion = totalProyeccion / detailRows.length;
  const promedioReal = totalReal / detailRows.length;

  const maxGapRow = detailRows.reduce(
    (best, current) => (current.diferencia > best.diferencia ? current : best),
    detailRows[0],
  );

  return [
    { metrica: "Días analizados", valor: `${detailRows.length}` },
    { metrica: "Proyección total", valor: formatNumber(totalProyeccion) },
    { metrica: "Real total", valor: formatNumber(totalReal) },
    { metrica: "Diferencia acumulada final", valor: formatNumber(last.diferenciaAcumulada) },
    { metrica: "Error porcentual acumulado final", valor: formatPercentage(last.errorPorcentualAcumulado) },
    { metrica: "Promedio proyectado diario", valor: formatNumber(promedioProyeccion) },
    { metrica: "Promedio real diario", valor: formatNumber(promedioReal) },
    { metrica: "Mayor desviación", valor: `${maxGapRow.fecha} · ${formatNumber(maxGapRow.diferencia)}` },
  ];
}

function buildVariationRows(detailRows) {
  if (!detailRows.length) return [];

  return detailRows.slice(-6).map((row) => {
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

function ProjectionAnalyticsSection({ section, onReload }) {
  const { theme: t } = useTheme();
  const [tablesExpanded, setTablesExpanded] = useState(false);

  const detailRows = useMemo(() => buildDetailRows(section.data), [section.data]);
  const summaryRows = useMemo(() => buildSummaryRows(detailRows), [detailRows]);
  const variationRows = useMemo(() => buildVariationRows(detailRows), [detailRows]);

  const gradientId = section.id.replace(/[^a-zA-Z0-9_-]/g, "-");
  const queryLabel = `GET /api/proyeccion/?estacion=${section.params.estacion}&codprd=${section.params.codprd}&fecha_inicio=${section.params.fecha_inicio}&fecha_fin=${section.params.fecha_fin}`;

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
          {detailRows.length ? `${detailRows.length} registros cargados` : "Esperando datos"}
        </div>
      </div>

      <Panel
        title={`Proyección vs. consumo real · ${section.title}`}
        code={`${section.subtitle} · backend v11`}
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
              <Tooltip content={<ChartTooltip formatter={(value) => formatNumber(value)} />} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Area
                type="monotone"
                dataKey="real"
                name="Real"
                stroke={t.accent}
                strokeWidth={2.5}
                fill={`url(#fillReal-${gradientId})`}
                connectNulls
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
              ? `${detailRows.length} filas disponibles. Expande esta sección para consultar el detalle y los acumulados.`
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
                    <tr key={`${section.id}-${row.fecha}-${index}`} className="table-row">
                      <td style={{ padding: "11px 12px", borderBottom: `1px solid ${t.border}`, color: t.text, fontWeight: 500, whiteSpace: "nowrap" }}>
                        {row.fecha}
                      </td>
                      <td style={{ padding: "11px 12px", borderBottom: `1px solid ${t.border}`, textAlign: "right", color: t.textSoft, fontFamily: "'IBM Plex Mono', monospace" }}>
                        {formatNumber(row.proyeccion)}
                      </td>
                      <td style={{ padding: "11px 12px", borderBottom: `1px solid ${t.border}`, textAlign: "right", color: t.textSoft, fontFamily: "'IBM Plex Mono', monospace" }}>
                        {formatNumber(row.real)}
                      </td>
                      <td style={{ padding: "11px 12px", borderBottom: `1px solid ${t.border}`, textAlign: "right", color: t.text, fontFamily: "'IBM Plex Mono', monospace" }}>
                        {formatNumber(row.diferencia)}
                      </td>
                      <td style={{ padding: "11px 12px", borderBottom: `1px solid ${t.border}`, textAlign: "right", color: row.errorPorcentual === null ? t.textFaint : t.amber, fontFamily: "'IBM Plex Mono', monospace" }}>
                        {formatPercentage(row.errorPorcentual)}
                      </td>
                      <td style={{ padding: "11px 12px", borderBottom: `1px solid ${t.border}`, textAlign: "right", color: t.textSoft, fontFamily: "'IBM Plex Mono', monospace" }}>
                        {formatNumber(row.proyeccionAcumulada)}
                      </td>
                      <td style={{ padding: "11px 12px", borderBottom: `1px solid ${t.border}`, textAlign: "right", color: t.textSoft, fontFamily: "'IBM Plex Mono', monospace" }}>
                        {formatNumber(row.realAcumulada)}
                      </td>
                      <td style={{ padding: "11px 12px", borderBottom: `1px solid ${t.border}`, textAlign: "right", color: row.diferenciaAcumulada > 0 ? t.amber : t.textSoft, fontFamily: "'IBM Plex Mono', monospace" }}>
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
            <Panel title="Resumen del período" code={section.title} noPad>
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

            <Panel title="Últimas variaciones" code={section.title} noPad>
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
                    {variationRows.map((row, index) => (
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
                    ))}
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

export default function Analytics() {
  const { projectionSections, reloadProjection } = useData();

  return (
    <>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 22 }}>
        <AlertBanner
          type="info"
          title="Comparativo diario de tres combinaciones de estación y producto"
          message="Cada sección consulta el backend v11 de forma independiente y muestra su propia gráfica, detalle diario, acumulados y errores porcentuales."
        />
        <AlertBanner
          type="warning"
          title="Las tablas permanecen contraídas por defecto"
          message="Usa el botón Mostrar tablas de cada sección para consultar los registros sin sobrecargar visualmente la página."
        />
      </div>

      {projectionSections.map((section) => (
        <ProjectionAnalyticsSection
          key={section.id}
          section={section}
          onReload={reloadProjection}
        />
      ))}
    </>
  );
}
