// Handgemachtes Netzdiagramm (7 Achsen) als reines SVG — keine Chart-Bibliothek.
// Zeigt 1 oder 2 Serien in unterscheidbaren Farben. Zeichnet AUSSCHLIESSLICH
// Schläger mit allen sieben Testwerten (Aufrufer stellt das sicher) — nie Nullen
// für fehlende Werte, das wäre eine erfundene Aussage.

export type RadarAxis = { key: string; label: string };
export type RadarSeries = { id: string; label: string; color: string; values: number[] };

const SIZE = 320;
const C = SIZE / 2; // Mittelpunkt
const R = 108;      // Außenradius (Platz für Beschriftung bleibt)
const RINGS = [0.25, 0.5, 0.75, 1]; // Gitterringe (0–100 in Viertelschritten)

// Winkel der Achse i: oben beginnend (-90°), im Uhrzeigersinn gleichmäßig verteilt.
function angle(i: number, n: number) {
  return (-90 + (360 / n) * i) * (Math.PI / 180);
}
function point(value: number, i: number, n: number, radius = R) {
  const a = angle(i, n);
  const r = (Math.max(0, Math.min(100, value)) / 100) * radius;
  return [C + r * Math.cos(a), C + r * Math.sin(a)] as const;
}
function polygon(values: number[], n: number) {
  return values.map((v, i) => point(v, i, n).join(",")).join(" ");
}

export default function RacketRadar({ axes, series }: { axes: RadarAxis[]; series: RadarSeries[] }) {
  const n = axes.length;
  return (
    <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="mx-auto h-auto w-full max-w-[360px]" role="img">
      {/* Gitter: konzentrische Siebenecke */}
      {RINGS.map((lvl) => (
        <polygon
          key={lvl}
          points={polygon(axes.map(() => lvl * 100), n)}
          className="fill-none stroke-black/10"
          strokeWidth={1}
        />
      ))}

      {/* Speichen + Achsenbeschriftung */}
      {axes.map((ax, i) => {
        const [x, y] = point(100, i, n);
        const [lx, ly] = point(118, i, n, R); // Label etwas außerhalb des Rings
        const cos = Math.cos(angle(i, n));
        const anchor = cos > 0.3 ? "start" : cos < -0.3 ? "end" : "middle";
        return (
          <g key={ax.key}>
            <line x1={C} y1={C} x2={x} y2={y} className="stroke-black/10" strokeWidth={1} />
            <text
              x={lx}
              y={ly}
              textAnchor={anchor}
              dominantBaseline="middle"
              className="fill-neutral-500 text-[11px] font-semibold"
            >
              {ax.label}
            </text>
          </g>
        );
      })}

      {/* Serien: gefülltes Polygon + Eckpunkte */}
      {series.map((s) => (
        <g key={s.id}>
          <polygon
            points={polygon(s.values, n)}
            fill={s.color}
            fillOpacity={series.length > 1 ? 0.14 : 0.18}
            stroke={s.color}
            strokeWidth={2}
            strokeLinejoin="round"
          />
          {s.values.map((v, i) => {
            const [px, py] = point(v, i, n);
            return <circle key={i} cx={px} cy={py} r={3} fill={s.color} />;
          })}
        </g>
      ))}
    </svg>
  );
}
