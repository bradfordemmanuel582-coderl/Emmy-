import React, { useState, useId } from 'react';
import { ChartData } from '../types';
import {
  BarChart3,
  LineChart,
  PieChart,
  AreaChart,
  Table as TableIcon,
  Download,
  Copy,
  Check,
  Maximize2,
  Minimize2,
  Info,
} from 'lucide-react';

interface InteractiveChartProps {
  rawJson: string;
}

const DEFAULT_COLORS = [
  '#3b82f6', // blue
  '#10b981', // emerald
  '#8b5cf6', // violet
  '#f59e0b', // amber
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#f97316', // orange
];

export const InteractiveChart: React.FC<InteractiveChartProps> = ({ rawJson }) => {
  const [copied, setCopied] = useState(false);
  const [hoveredPoint, setHoveredPoint] = useState<{
    label: string;
    series: string;
    value: number;
    x: number;
    y: number;
  } | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Parse chart data
  let chartData: ChartData | null = null;
  let parseError: string | null = null;

  try {
    const cleaned = rawJson.trim();
    chartData = JSON.parse(cleaned);
  } catch (err: any) {
    parseError = err.message || 'Failed to parse chart JSON';
  }

  const [activeType, setActiveType] = useState<'bar' | 'line' | 'area' | 'pie' | 'donut' | 'table'>('bar');
  const [initializedType, setInitializedType] = useState(false);

  // Set default active type from data once
  React.useEffect(() => {
    if (chartData && !initializedType) {
      setActiveType(chartData.type || 'bar');
      setInitializedType(true);
    }
  }, [chartData, initializedType]);

  const uniqueId = useId().replace(/:/g, '');

  if (parseError || !chartData) {
    return (
      <div className="my-4 rounded-xl border border-red-500/20 bg-red-950/20 p-4 text-sm text-red-300">
        <div className="font-semibold text-red-200">Invalid Chart Definition</div>
        <div className="text-xs text-red-400 mt-1">{parseError}</div>
        <pre className="mt-2 text-xs bg-black/40 p-2 rounded overflow-x-auto text-zinc-400">
          {rawJson}
        </pre>
      </div>
    );
  }

  const labels = chartData.labels || [];
  const datasets = chartData.datasets || [];

  // Compute stats
  const allValues = datasets.flatMap((d) => d.data || []);
  const maxValue = allValues.length > 0 ? Math.max(...allValues, 1) : 100;
  const minValue = allValues.length > 0 ? Math.min(...allValues, 0) : 0;
  const totalValue = allValues.reduce((acc, curr) => acc + curr, 0);
  const avgValue = allValues.length > 0 ? (totalValue / allValues.length).toFixed(1) : '0';

  const copyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(chartData, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadCsv = () => {
    if (!chartData) return;
    const header = ['Label', ...datasets.map((d) => `"${d.label}"`)].join(',');
    const rows = labels.map((lbl, idx) => {
      const vals = datasets.map((d) => d.data[idx] ?? '');
      return [`"${lbl}"`, ...vals].join(',');
    });
    const csvContent = 'data:text/csv;charset=utf-8,' + [header, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${chartData.title.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Dimensions for SVG
  const width = 640;
  const height = 300;
  const padding = { top: 30, right: 30, bottom: 45, left: 55 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  // Grid steps (4 horizontal grid lines)
  const gridSteps = 4;
  const yTicks = Array.from({ length: gridSteps + 1 }, (_, i) => {
    const val = Math.round(minValue + ((maxValue - minValue) / gridSteps) * (gridSteps - i));
    const y = padding.top + (chartH / gridSteps) * i;
    return { val, y };
  });

  return (
    <div
      className={`my-5 rounded-2xl border border-zinc-700/60 bg-zinc-900/90 shadow-xl backdrop-blur-md transition-all overflow-hidden ${
        isFullscreen ? 'fixed inset-4 z-50 overflow-y-auto bg-zinc-950 p-6' : 'p-4 md:p-5'
      }`}
    >
      {/* Top Header & Chart Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
              <BarChart3 className="h-4 w-4" />
            </span>
            <h4 className="text-base font-semibold text-zinc-100">{chartData.title}</h4>
          </div>
          {chartData.yAxisLabel && (
            <p className="text-xs text-zinc-400 mt-0.5 ml-8">{chartData.yAxisLabel}</p>
          )}
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center gap-1 rounded-xl bg-zinc-800/80 p-1 text-xs">
          <button
            onClick={() => setActiveType('bar')}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 font-medium transition ${
              activeType === 'bar'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
            title="Bar Chart"
          >
            <BarChart3 className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Bar</span>
          </button>
          <button
            onClick={() => setActiveType('line')}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 font-medium transition ${
              activeType === 'line'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
            title="Line Chart"
          >
            <LineChart className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Line</span>
          </button>
          <button
            onClick={() => setActiveType('area')}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 font-medium transition ${
              activeType === 'area'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
            title="Area Chart"
          >
            <AreaChart className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Area</span>
          </button>
          <button
            onClick={() => setActiveType('donut')}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 font-medium transition ${
              activeType === 'donut' || activeType === 'pie'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
            title="Donut / Pie Chart"
          >
            <PieChart className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Donut</span>
          </button>
          <button
            onClick={() => setActiveType('table')}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 font-medium transition ${
              activeType === 'table'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
            title="Data Table"
          >
            <TableIcon className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Table</span>
          </button>
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={copyJson}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-700 bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white transition"
            title="Copy Raw JSON"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
          </button>
          <button
            onClick={downloadCsv}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-700 bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white transition"
            title="Export CSV"
          >
            <Download className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-700 bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white transition"
            title={isFullscreen ? 'Exit Fullscreen' : 'Expand View'}
          >
            {isFullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>

      {/* Dataset Legend */}
      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-zinc-300">
        {datasets.map((d, i) => {
          const color = d.color || DEFAULT_COLORS[i % DEFAULT_COLORS.length];
          return (
            <div key={i} className="flex items-center gap-1.5 bg-zinc-800/60 px-2.5 py-1 rounded-md border border-zinc-700/50">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
              <span className="font-medium">{d.label}</span>
            </div>
          );
        })}
      </div>

      {/* Chart Canvas Area */}
      <div className="relative mt-4 min-h-[300px] w-full flex items-center justify-center">
        {activeType === 'table' ? (
          <div className="w-full overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-950/60 p-2">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-zinc-800 text-zinc-400 uppercase">
                <tr>
                  <th className="py-2.5 px-3 font-semibold">{chartData.xAxisLabel || 'Category'}</th>
                  {datasets.map((d, i) => (
                    <th key={i} className="py-2.5 px-3 font-semibold text-right">
                      {d.label}
                    </th>
                  ))}
                  {datasets.length > 1 && (
                    <th className="py-2.5 px-3 font-semibold text-right text-emerald-400">Total</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 text-zinc-200">
                {labels.map((label, idx) => {
                  const rowSum = datasets.reduce((acc, curr) => acc + (curr.data[idx] || 0), 0);
                  return (
                    <tr key={idx} className="hover:bg-zinc-800/40 transition">
                      <td className="py-2 px-3 font-medium text-zinc-300">{label}</td>
                      {datasets.map((d, di) => (
                        <td key={di} className="py-2 px-3 text-right font-mono">
                          {(d.data[idx] ?? 0).toLocaleString()}
                        </td>
                      ))}
                      {datasets.length > 1 && (
                        <td className="py-2 px-3 text-right font-mono font-semibold text-emerald-400">
                          {rowSum.toLocaleString()}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : activeType === 'donut' || activeType === 'pie' ? (
          // Donut / Pie SVG Visualization
          <div className="flex flex-col md:flex-row items-center justify-center gap-6 py-4 w-full">
            <div className="relative h-64 w-64">
              <svg viewBox="0 0 200 200" className="h-full w-full">
                {(() => {
                  // For pie, aggregate values per label using first dataset or sum across datasets
                  const values = labels.map((_, idx) =>
                    datasets.reduce((acc, curr) => acc + (curr.data[idx] || 0), 0)
                  );
                  const total = values.reduce((a, b) => a + b, 0) || 1;
                  let currentAngle = 0;

                  return values.map((val, i) => {
                    const sliceAngle = (val / total) * 360;
                    const startAngle = currentAngle;
                    const endAngle = currentAngle + sliceAngle;
                    currentAngle = endAngle;

                    const rad1 = ((startAngle - 90) * Math.PI) / 180;
                    const rad2 = ((endAngle - 90) * Math.PI) / 180;

                    const rOuter = 85;
                    const rInner = activeType === 'donut' ? 50 : 0;

                    const x1 = 100 + rOuter * Math.cos(rad1);
                    const y1 = 100 + rOuter * Math.sin(rad1);
                    const x2 = 100 + rOuter * Math.cos(rad2);
                    const y2 = 100 + rOuter * Math.sin(rad2);

                    const x3 = 100 + rInner * Math.cos(rad2);
                    const y3 = 100 + rInner * Math.sin(rad2);
                    const x4 = 100 + rInner * Math.cos(rad1);
                    const y4 = 100 + rInner * Math.sin(rad1);

                    const largeArc = sliceAngle > 180 ? 1 : 0;
                    const color = DEFAULT_COLORS[i % DEFAULT_COLORS.length];

                    const d =
                      rInner > 0
                        ? `M ${x1} ${y1} A ${rOuter} ${rOuter} 0 ${largeArc} 1 ${x2} ${y2} L ${x3} ${y3} A ${rInner} ${rInner} 0 ${largeArc} 0 ${x4} ${y4} Z`
                        : `M 100 100 L ${x1} ${y1} A ${rOuter} ${rOuter} 0 ${largeArc} 1 ${x2} ${y2} Z`;

                    return (
                      <path
                        key={i}
                        d={d}
                        fill={color}
                        stroke="#18181b"
                        strokeWidth="2"
                        className="transition-all duration-300 hover:opacity-80 cursor-pointer"
                        onMouseEnter={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          setHoveredPoint({
                            label: labels[i] || `Item ${i + 1}`,
                            series: `${((val / total) * 100).toFixed(1)}%`,
                            value: val,
                            x: rect.left + rect.width / 2,
                            y: rect.top,
                          });
                        }}
                        onMouseLeave={() => setHoveredPoint(null)}
                      />
                    );
                  });
                })()}
                {activeType === 'donut' && (
                  <circle cx="100" cy="100" r="48" fill="#18181b" />
                )}
              </svg>
            </div>
            {/* Legend for pie/donut */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs max-w-xs">
              {labels.map((lbl, idx) => {
                const val = datasets.reduce((acc, curr) => acc + (curr.data[idx] || 0), 0);
                const color = DEFAULT_COLORS[idx % DEFAULT_COLORS.length];
                const pct = totalValue > 0 ? ((val / totalValue) * 100).toFixed(1) : '0';
                return (
                  <div key={idx} className="flex items-center justify-between gap-2 p-1.5 rounded-lg bg-zinc-800/40">
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
                      <span className="truncate text-zinc-300">{lbl}</span>
                    </div>
                    <span className="font-mono text-zinc-400 shrink-0">{pct}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          // Cartesian SVG Chart (Bar / Line / Area)
          <div className="w-full overflow-x-auto">
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto min-w-[500px]">
              <defs>
                {datasets.map((d, di) => {
                  const color = d.color || DEFAULT_COLORS[di % DEFAULT_COLORS.length];
                  return (
                    <linearGradient
                      key={di}
                      id={`grad-${uniqueId}-${di}`}
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="0%" stopColor={color} stopOpacity="0.4" />
                      <stop offset="100%" stopColor={color} stopOpacity="0.0" />
                    </linearGradient>
                  );
                })}
              </defs>

              {/* Background Grid Lines */}
              {yTicks.map(({ val, y }, idx) => (
                <g key={idx}>
                  <line
                    x1={padding.left}
                    y1={y}
                    x2={width - padding.right}
                    y2={y}
                    stroke="#27272a"
                    strokeDasharray={idx === gridSteps ? 'none' : '3 3'}
                  />
                  <text
                    x={padding.left - 10}
                    y={y + 3}
                    textAnchor="end"
                    fill="#71717a"
                    fontSize="10"
                    fontFamily="monospace"
                  >
                    {val.toLocaleString()}
                  </text>
                </g>
              ))}

              {/* Render Bar Chart */}
              {activeType === 'bar' &&
                labels.map((label, labelIdx) => {
                  const groupWidth = chartW / labels.length;
                  const groupX = padding.left + labelIdx * groupWidth;
                  const numSets = datasets.length;
                  const barWidth = Math.max(8, (groupWidth * 0.7) / numSets);
                  const startOffset = (groupWidth - barWidth * numSets) / 2;

                  return (
                    <g key={labelIdx}>
                      {datasets.map((d, di) => {
                        const val = d.data[labelIdx] ?? 0;
                        const barH = ((val - minValue) / (maxValue - minValue || 1)) * chartH;
                        const barX = groupX + startOffset + di * barWidth;
                        const barY = padding.top + (chartH - barH);
                        const color = d.color || DEFAULT_COLORS[di % DEFAULT_COLORS.length];

                        return (
                          <rect
                            key={di}
                            x={barX}
                            y={barY}
                            width={barWidth - 2}
                            height={Math.max(2, barH)}
                            rx="3"
                            fill={color}
                            className="transition-all duration-200 hover:opacity-80 cursor-pointer"
                            onMouseEnter={(e) => {
                              const rect = e.currentTarget.getBoundingClientRect();
                              setHoveredPoint({
                                label,
                                series: d.label,
                                value: val,
                                x: rect.left + rect.width / 2,
                                y: rect.top,
                              });
                            }}
                            onMouseLeave={() => setHoveredPoint(null)}
                          />
                        );
                      })}
                      {/* X Axis Label */}
                      <text
                        x={groupX + groupWidth / 2}
                        y={height - 12}
                        textAnchor="middle"
                        fill="#a1a1aa"
                        fontSize="11"
                        className="truncate"
                      >
                        {label}
                      </text>
                    </g>
                  );
                })}

              {/* Render Line or Area Chart */}
              {(activeType === 'line' || activeType === 'area') &&
                datasets.map((d, di) => {
                  const color = d.color || DEFAULT_COLORS[di % DEFAULT_COLORS.length];
                  const points = labels.map((_, i) => {
                    const val = d.data[i] ?? 0;
                    const x =
                      padding.left +
                      (labels.length > 1 ? (i / (labels.length - 1)) * chartW : chartW / 2);
                    const y =
                      padding.top +
                      chartH -
                      ((val - minValue) / (maxValue - minValue || 1)) * chartH;
                    return { x, y, val, label: labels[i] };
                  });

                  if (points.length === 0) return null;

                  const pathD = points.reduce(
                    (acc, p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`),
                    ''
                  );

                  const areaD = `${pathD} L ${points[points.length - 1].x} ${
                    padding.top + chartH
                  } L ${points[0].x} ${padding.top + chartH} Z`;

                  return (
                    <g key={di}>
                      {activeType === 'area' && (
                        <path d={areaD} fill={`url(#grad-${uniqueId}-${di})`} />
                      )}
                      <path
                        d={pathD}
                        fill="none"
                        stroke={color}
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      {points.map((p, pi) => (
                        <circle
                          key={pi}
                          cx={p.x}
                          cy={p.y}
                          r="4"
                          fill="#18181b"
                          stroke={color}
                          strokeWidth="2.5"
                          className="hover:r-6 transition-all cursor-pointer"
                          onMouseEnter={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect();
                            setHoveredPoint({
                              label: p.label,
                              series: d.label,
                              value: p.val,
                              x: rect.left + rect.width / 2,
                              y: rect.top,
                            });
                          }}
                          onMouseLeave={() => setHoveredPoint(null)}
                        />
                      ))}
                    </g>
                  );
                })}

              {/* X Axis labels for Line/Area */}
              {(activeType === 'line' || activeType === 'area') &&
                labels.map((lbl, idx) => {
                  const x =
                    padding.left +
                    (labels.length > 1 ? (idx / (labels.length - 1)) * chartW : chartW / 2);
                  return (
                    <text
                      key={idx}
                      x={x}
                      y={height - 12}
                      textAnchor="middle"
                      fill="#a1a1aa"
                      fontSize="11"
                    >
                      {lbl}
                    </text>
                  );
                })}
            </svg>
          </div>
        )}
      </div>

      {/* Floating Tooltip */}
      {hoveredPoint && (
        <div
          className="fixed pointer-events-none z-50 -translate-x-1/2 -translate-y-full rounded-lg border border-zinc-700 bg-zinc-900/95 px-3 py-1.5 shadow-2xl text-xs backdrop-blur"
          style={{
            left: `${hoveredPoint.x}px`,
            top: `${hoveredPoint.y - 8}px`,
          }}
        >
          <div className="font-semibold text-zinc-100">{hoveredPoint.label}</div>
          <div className="text-emerald-400 font-mono">
            {hoveredPoint.series}: {hoveredPoint.value.toLocaleString()}
          </div>
        </div>
      )}

      {/* Summary Row */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-zinc-800/80 pt-3 text-xs">
        <div className="flex items-center gap-4 text-zinc-400">
          <div>
            <span className="text-zinc-500">Max: </span>
            <span className="font-mono text-zinc-200">{maxValue.toLocaleString()}</span>
          </div>
          <div>
            <span className="text-zinc-500">Avg: </span>
            <span className="font-mono text-zinc-200">{avgValue}</span>
          </div>
          <div>
            <span className="text-zinc-500">Sum: </span>
            <span className="font-mono text-emerald-400">{totalValue.toLocaleString()}</span>
          </div>
        </div>

        {chartData.summary && (
          <div className="flex items-center gap-1.5 text-zinc-300 max-w-md bg-zinc-800/40 px-2.5 py-1 rounded-md border border-zinc-700/40">
            <Info className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
            <span className="italic">{chartData.summary}</span>
          </div>
        )}
      </div>
    </div>
  );
};
