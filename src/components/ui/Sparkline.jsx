/** ui/Sparkline.jsx — mini gráfica de línea sin ejes, para el fondo de las tarjetas de métricas. */
import { LineChart, Line, ResponsiveContainer } from "recharts";

export function Sparkline({ data, color }) {
  return (
    <ResponsiveContainer width="100%" height={40}>
      <LineChart data={data}>
        <Line type="monotone" dataKey="v" stroke={color} strokeWidth={2} dot={false} isAnimationActive={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}
