"use client";

/**
 * Premium Dual-Range-Slider für eine Altersspanne (min/max) — per Ziehen
 * statt Eingeben. Zwei überlagerte Range-Inputs mit hervorgehobenem Bereich.
 */
export default function AgeRangeSlider({
  min = 18,
  max = 99,
  valueMin,
  valueMax,
  onChange,
}: {
  min?: number;
  max?: number;
  valueMin: number;
  valueMax: number;
  onChange: (nextMin: number, nextMax: number) => void;
}) {
  const span = max - min || 1;
  const pctMin = ((valueMin - min) / span) * 100;
  const pctMax = ((valueMax - min) / span) * 100;

  function setLow(v: number) {
    onChange(Math.min(v, valueMax - 1), valueMax);
  }
  function setHigh(v: number) {
    onChange(valueMin, Math.max(v, valueMin + 1));
  }

  return (
    <div className="pt-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-zinc-400">Alter</span>
        <span className="font-semibold text-white">
          {valueMin} – {valueMax}{valueMax >= max ? "+" : ""} Jahre
        </span>
      </div>

      <div className="relative mt-5 h-6 select-none">
        {/* Track */}
        <div className="absolute left-0 right-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-zinc-700" />
        {/* aktiver Bereich */}
        <div
          className="absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-matchup"
          style={{ left: `${pctMin}%`, right: `${100 - pctMax}%` }}
        />
        {/* untere Grenze */}
        <input
          type="range"
          aria-label="Mindestalter"
          min={min}
          max={max}
          value={valueMin}
          onChange={(e) => setLow(Number(e.target.value))}
          className="range-thumb absolute inset-0 h-6 w-full"
        />
        {/* obere Grenze */}
        <input
          type="range"
          aria-label="Höchstalter"
          min={min}
          max={max}
          value={valueMax}
          onChange={(e) => setHigh(Number(e.target.value))}
          className="range-thumb absolute inset-0 h-6 w-full"
        />
      </div>
    </div>
  );
}
