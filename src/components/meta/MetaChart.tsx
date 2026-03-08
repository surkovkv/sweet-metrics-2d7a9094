import { useCallback, useMemo } from "react";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  CartesianGrid,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceArea,
  Tooltip as RechartsTooltip,
} from "recharts";
import { type ArchetypeInfo } from "@/data/matchups";
import { useT } from "@/i18n/useTranslation";

export const TIERS = [
  { id: "S", label: "S-Tier", minWr: 54, color: "hsl(var(--winrate-good))" },
  { id: "A", label: "A-Tier", minWr: 52, color: "hsl(142 71% 55%)" },
  { id: "B", label: "B-Tier", minWr: 50, color: "hsl(var(--winrate-neutral))" },
  { id: "C", label: "C-Tier", minWr: 48, color: "hsl(25 95% 53%)" },
  { id: "D", label: "D-Tier", minWr: 0, color: "hsl(var(--winrate-bad))" },
];

export function getTier(winrate: number) {
  if (winrate >= 54) return TIERS[0];
  if (winrate >= 52) return TIERS[1];
  if (winrate >= 50) return TIERS[2];
  if (winrate >= 48) return TIERS[3];
  return TIERS[4];
}

interface Props {
  archetypes: ArchetypeInfo[];
  selected: string | null;
  onSelect: (name: string | null) => void;
  activeTier: string | null;
  onTierClick: (tier: string | null) => void;
}

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.[0]) return null;
  const d = payload[0].payload;
  const tier = getTier(d.winrate);
  return (
    <div className="bg-card border border-border rounded-lg px-3 py-2 shadow-xl z-50">
      <div className="font-semibold text-foreground text-sm">{d.name}</div>
      <div className="text-xs text-muted-foreground mt-0.5">
        WR: {d.winrate}% · Pop: {d.popularity}% · Tier {tier.id} · {d.hsClass}
      </div>
    </div>
  );
};

export default function MetaChart({ archetypes, selected, onSelect, activeTier, onTierClick }: Props) {
  const t = useT();
  const maxPop = useMemo(() => Math.max(...archetypes.map(a => a.popularity), 1), [archetypes]);

  const chartData = useMemo(() =>
    archetypes.map(a => ({ ...a, z: a.popularity })),
    [archetypes]
  );

  const yDomain = useMemo(() => {
    if (archetypes.length === 0) return [38, 60];
    const wrs = archetypes.map(a => a.winrate);
    const min = Math.floor(Math.min(...wrs) / 2) * 2 - 2;
    const max = Math.ceil(Math.max(...wrs) / 2) * 2 + 2;
    return [Math.min(min, 38), Math.max(max, 60)];
  }, [archetypes]);

  const renderDot = useCallback((props: any) => {
    const { cx, cy, payload } = props;
    if (cx == null || cy == null) return null;
    const tier = getTier(payload.winrate);
    const size = 12 + (payload.popularity / maxPop) * 26;
    const isSelected = selected === payload.name;
    const dimmed = (activeTier && tier.id !== activeTier) || (selected && !isSelected);

    return (
      <g style={{ cursor: "pointer" }}>
        <circle
          cx={cx} cy={cy} r={size}
          fill={tier.color}
          opacity={dimmed ? 0.12 : 0.85}
          stroke={isSelected ? "hsl(var(--foreground))" : "transparent"}
          strokeWidth={isSelected ? 2.5 : 0}
        />
        {size > 18 && (
          <text
            x={cx} y={cy}
            textAnchor="middle" dominantBaseline="middle"
            fill="hsl(var(--background))"
            fontSize={Math.max(7, Math.min(10, size * 0.35))}
            fontWeight="700"
            style={{ pointerEvents: "none", userSelect: "none" }}
          >
            {payload.name.length > 12 ? payload.name.split(" ")[0] : payload.name}
          </text>
        )}
      </g>
    );
  }, [selected, activeTier, maxPop]);

  const handleScatterClick = useCallback((data: any) => {
    const name = data?.name || data?.payload?.name;
    if (name) onSelect(selected === name ? null : name);
  }, [selected, onSelect]);

  return (
    <div className="w-full">
      {/* Tier legend buttons */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <span className="text-xs text-muted-foreground mr-1 uppercase tracking-wider">Tiers:</span>
        {TIERS.map(tier => (
          <button
            key={tier.id}
            onClick={() => onTierClick(activeTier === tier.id ? null : tier.id)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all border-2 ${
              activeTier === tier.id
                ? "border-foreground shadow-lg scale-110"
                : "border-transparent hover:scale-105 hover:shadow-md"
            }`}
            style={{
              backgroundColor: tier.color,
              color: "hsl(var(--background))",
              opacity: activeTier && activeTier !== tier.id ? 0.35 : 1,
            }}
          >
            {tier.label}
          </button>
        ))}
        {activeTier && (
          <button
            onClick={() => onTierClick(null)}
            className="text-xs text-muted-foreground hover:text-foreground underline ml-2 transition-colors"
          >
            {t("meta.showAll")}
          </button>
        )}
      </div>

      {/* Scatter chart */}
      <div className="w-full rounded-xl bg-secondary/30 border border-border p-2">
        <ResponsiveContainer width="100%" height={500}>
          <ScatterChart margin={{ top: 15, right: 25, bottom: 30, left: 15 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.4} />

            {/* Tier background zones */}
            <ReferenceArea y1={54} y2={yDomain[1]} fill="hsl(var(--winrate-good))" fillOpacity={0.06} />
            <ReferenceArea y1={52} y2={54} fill="hsl(142 71% 55%)" fillOpacity={0.05} />
            <ReferenceArea y1={50} y2={52} fill="hsl(var(--winrate-neutral))" fillOpacity={0.04} />
            <ReferenceArea y1={48} y2={50} fill="hsl(25 95% 53%)" fillOpacity={0.03} />
            <ReferenceArea y1={yDomain[0]} y2={48} fill="hsl(var(--winrate-bad))" fillOpacity={0.03} />

            {/* 50% baseline */}
            <ReferenceLine y={50} stroke="hsl(var(--muted-foreground))" strokeDasharray="8 4" strokeOpacity={0.5} />

            <XAxis
              type="number"
              dataKey="popularity"
              name="Popularity"
              unit="%"
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
              axisLine={{ stroke: "hsl(var(--border))" }}
              tickLine={{ stroke: "hsl(var(--border))" }}
              label={{
                value: t("meta.popularityAxis"),
                position: "bottom",
                offset: 10,
                style: { fill: "hsl(var(--muted-foreground))", fontSize: 12, fontWeight: 500 },
              }}
            />
            <YAxis
              type="number"
              dataKey="winrate"
              name="Winrate"
              unit="%"
              domain={yDomain}
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
              axisLine={{ stroke: "hsl(var(--border))" }}
              tickLine={{ stroke: "hsl(var(--border))" }}
              label={{
                value: t("meta.winrateAxis"),
                angle: -90,
                position: "insideLeft",
                offset: 5,
                style: { fill: "hsl(var(--muted-foreground))", fontSize: 12, fontWeight: 500 },
              }}
            />
            <ZAxis type="number" dataKey="popularity" range={[300, 2500]} />

            <RechartsTooltip content={<CustomTooltip />} cursor={false} />

            <Scatter
              data={chartData}
              shape={renderDot}
              onClick={handleScatterClick}
              isAnimationActive={false}
            />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
