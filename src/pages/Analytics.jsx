import { useMemo, useState } from "react";
import {
  Area, AreaChart, Brush, CartesianGrid, Legend, ResponsiveContainer,
  Tooltip, XAxis, YAxis,
} from "recharts";
import { useTheme } from "../theme/ThemeContext.jsx";
import { useData } from "../context/DataContext.jsx";
import { ChevronDown, ChevronUp } from "lucide-react";
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

export default function Analytics() {
  const { theme: t } = useTheme();
  const {
    projectionData,
    projectionLoading,
    projectionError,
    reloadProjection,
  } = useData();
  const [tablesExpanded, setTablesExpanded] = useState(false);

  const detailRows = useMemo(() => {
    let acumuladoProyeccion = 0;
    let acumuladoReal = 0;

    return projectionData.map((item) => {
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
  }, [projectionData]);

  const summaryRows = useMemo(() => {
    if (!detailRows.length) return [];

    const totalProyeccion = detailRows[detailRows.length - 1].proyeccionAcumulada;
    const totalReal = detailRows[detailRows.length - 1].realAcumulada;
    const totalDiferencia = detailRows[detailRows.length - 1].diferenciaAcumulada;
    const promedioProyeccion = totalProyeccion / detailRows.length;
    const promedioReal = totalReal / detailRows.length;
    const errorPorcentualAcumuladoFinal = detailRows[detailRows.length - 1].errorPorcentualAcumulado;

    const maxGapRow = detailRows.reduce((best, current) => (
      current.diferencia > best.diferencia ? current : best
    ), detailRows[0]);

    return [
      { metrica: "Días analizados", valor: `${detailRows.length}` },
      { metrica: "Proyección total", valor: formatNumber(totalProyeccion) },
      { metrica: "Real total", valor: formatNumber(totalReal) },
      { metrica: "Diferencia acumulada final", valor: formatNumber(totalDiferencia) },
      { metrica: "Error porcentual acumulado final", valor: formatPercentage(errorPorcentualAcumuladoFinal) },
      { metrica: "Promedio proyectado diario", valor: formatNumber(promedioProyeccion) },
      { metrica: "Promedio real diario", valor: formatNumber(promedioReal) },
      { metrica: "Mayor desviación", valor: `${maxGapRow.fecha} · ${formatNumber(maxGapRow.diferencia)}` },
    ];
  }, [detailRows]);

  const variationRows = useMemo(() => {
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
      };
    });
  }, [detailRows]);

  const totalGap = detailRows.length
    ? detailRows[detailRows.length - 1].realAcumulada - detailRows[detailRows.length - 1].proyeccionAcumulada
    : 0;

  const largestGap = detailRows.length
    ? detailRows.reduce((best, current) => (current.diferencia > best.diferencia ? current : best), detailRows[0])
    : null;

  return (
    <>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
        <AlertBanner
          type="info"
          title="Comparativo diario entre proyección y consumo real"
          message={detailRows.length
            ? `Se muestran ${detailRows.length} registros del backend v11 para analizar la proyección frente al consumo observado.`
            : "La gráfica se alimenta con los datos del endpoint /api/proyeccion del backend v11."}
        />
        <AlertBanner
          type={totalGap > 0 ? "warning" : "success"}
          title={totalGap > 0 ? "El consumo real acumulado está por encima de la proyección" : "La proyección acompaña de cerca al consumo real"}
          message={largestGap
            ? `La mayor diferencia del período se observó el ${largestGap.fecha} y fue de ${formatNumber(largestGap.diferencia)} litros.`
            : "Cuando se carguen datos, aquí verás un resumen automático del comportamiento del período."}
        />
      </div>

      <Panel
        title="Proyección vs. consumo real"
        code="Vista ampliada · ocupa el espacio principal del módulo de analíticas"
        style={{ marginBottom: 16 }}
        right={
          <button
            type="button"
            onClick={reloadProjection}
            style={{
              border: `1px solid ${t.border}`,
              background: t.surface,
              color: t.text,
              borderRadius: 8,
              padding: "8px 12px",
              cursor: "pointer",
              fontSize: 12,
            }}
          >
            Actualizar datos
          </button>
        }
      >
        {projectionLoading ? (
          <div style={{ height: 430, display: "grid", placeItems: "center", color: t.textSoft }}>
            Cargando proyección…
          </div>
        ) : projectionError ? (
          <div style={{ height: 430, display: "grid", placeItems: "center", textAlign: "center", padding: 20 }}>
            <div>
              <div style={{ color: t.coral, marginBottom: 10 }}>{projectionError}</div>
              <button
                type="button"
                onClick={reloadProjection}
                style={{ border: `1px solid ${t.border}`, background: t.surface, color: t.text, borderRadius: 8, padding: "8px 12px", cursor: "pointer" }}
              >
                Reintentar
              </button>
            </div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={430}>
            <AreaChart data={projectionData} margin={{ top: 10, right: 10, left: 0, bottom: 18 }}>
              <defs>
                <linearGradient id="fillRealBig" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={t.accent} stopOpacity={0.34} />
                  <stop offset="100%" stopColor={t.accent} stopOpacity={0.03} />
                </linearGradient>
                <linearGradient id="fillProjectionBig" x1="0" y1="0" x2="0" y2="1">
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
                fill="url(#fillRealBig)"
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
                fill="url(#fillProjectionBig)"
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
        }}
      >
        <div>
          <div style={{ color: t.text, fontWeight: 600, fontSize: 13 }}>Tablas de análisis</div>
          <div style={{ color: t.textFaint, fontSize: 11, marginTop: 2 }}>
            {tablesExpanded
              ? "Oculta el detalle para concentrarte en la gráfica."
              : `Hay ${detailRows.length} filas disponibles. Despliega para consultar detalle, acumulados y resúmenes.`}
          </div>
        </div>
        <button
          type="button"
          onClick={() => setTablesExpanded((current) => !current)}
          aria-expanded={tablesExpanded}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 7,
            border: `1px solid ${t.border}`,
            background: t.surface,
            color: t.text,
            borderRadius: 8,
            padding: "8px 12px",
            cursor: "pointer",
            fontSize: 12,
            whiteSpace: "nowrap",
          }}
        >
          {tablesExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          {tablesExpanded ? "Ocultar tablas" : "Mostrar tablas"}
        </button>
      </div>

      {tablesExpanded && (
        <div style={{ animation: "fadeIn 0.25s ease both" }}>
      <Panel
        title="Detalle diario de la proyección"
        code="Tabla analítica · datos del backend y acumulados del período"
        noPad
        style={{ marginBottom: 16 }}
      >
        {projectionLoading ? (
          <div style={{ padding: 20, color: t.textSoft }}>Cargando tabla…</div>
        ) : projectionError ? (
          <div style={{ padding: 20, color: t.coral }}>No fue posible mostrar la tabla porque la proyección no está disponible.</div>
        ) : (
          <div style={{ overflowX: "auto" }} className="scrollbar-thin">
            <table style={{ width: "100%", minWidth: 1500, borderCollapse: "collapse", fontSize: 13 }}>
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
                        textAlign: header === "Fecha" ? "left" : "right",
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
                {detailRows.map((row, index) => (
                  <tr key={`${row.fecha}-${index}`} className="table-row">
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
                    <td style={{ padding: "11px 12px", borderBottom: `1px solid ${t.border}`, textAlign: "right", color: row.errorPorcentual !== null && row.errorPorcentual > 10 ? t.amber : t.textSoft, fontFamily: "'IBM Plex Mono', monospace" }}>
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
                    <td style={{ padding: "11px 12px", borderBottom: `1px solid ${t.border}`, textAlign: "right", color: row.errorPorcentualAcumulado !== null && row.errorPorcentualAcumulado > 10 ? t.amber : t.textSoft, fontFamily: "'IBM Plex Mono', monospace" }}>
                      {formatPercentage(row.errorPorcentualAcumulado)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 16 }}>
        <Panel title="Resumen del período" code="Métricas derivadas de la tabla" noPad>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr>
                {[
                  "Métrica",
                  "Valor",
                ].map((header, index) => (
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
                <tr key={`${row.metrica}-${index}`} className="table-row">
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

        <Panel title="Últimas variaciones" code="Lectura rápida del comportamiento reciente" noPad>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr>
                {[
                  "Fecha",
                  "Estado",
                  "Brecha",
                  "Dif. acumulada",
                ].map((header, index) => (
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
                    }}
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {variationRows.map((row, index) => (
                <tr key={`${row.fecha}-${index}`} className="table-row">
                  <td style={{ padding: "11px 12px", borderBottom: `1px solid ${t.border}`, color: t.text, fontWeight: 500, whiteSpace: "nowrap" }}>
                    {row.fecha}
                  </td>
                  <td style={{ padding: "11px 12px", borderBottom: `1px solid ${t.border}`, color: t.textSoft }}>
                    {row.estado}
                  </td>
                  <td style={{ padding: "11px 12px", borderBottom: `1px solid ${t.border}`, textAlign: "right", color: row.brecha > 0 ? t.accent : row.brecha < 0 ? t.amber : t.textSoft, fontFamily: "'IBM Plex Mono', monospace" }}>
                    {row.brecha > 0 ? "+" : ""}{formatDelta(row.brecha)}
                  </td>
                  <td style={{ padding: "11px 12px", borderBottom: `1px solid ${t.border}`, textAlign: "right", color: t.textSoft, fontFamily: "'IBM Plex Mono', monospace" }}>
                    {formatNumber(row.acumulado)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      </div>
        </div>
      )}
    </>
  );
}
