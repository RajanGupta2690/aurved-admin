import { Link } from 'react-router-dom';
import { Info } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from './cn';
import Popover from './Popover';
import { CHART_COLORS } from './chartColors';

interface Datum {
  label: string;
  value: number;
  color?: string;
}

function hiddenTable(caption: string, rows: Array<[string, string]>, headers: [string, string] = ['Item', 'Value']) {
  return (
    <table className="sr-only">
      <caption>{caption}</caption>
      <thead>
        <tr>
          <th scope="col">{headers[0]}</th>
          <th scope="col">{headers[1]}</th>
        </tr>
      </thead>
      <tbody>
        {rows.map(([a, b]) => (
          <tr key={a}>
            <th scope="row">{a}</th>
            <td>{b}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

interface BarChartProps {
  data: Datum[];
  ariaLabel: string;
  height?: number;
  format?: (value: number) => string;
  /** Called when a bar is clicked or activated by keyboard. Use for drill-down. */
  onSelect?: (label: string) => void;
}

export function BarChart({ data, ariaLabel, height = 220, format = (value) => String(value), onSelect }: BarChartProps) {
  const width = 600;
  const pad = { top: 16, right: 8, bottom: 34, left: 8 };
  const max = Math.max(1, ...data.map((item) => item.value));
  const slot = (width - pad.left - pad.right) / Math.max(1, data.length);
  const barWidth = Math.min(56, slot * 0.6);
  const plotHeight = height - pad.top - pad.bottom;

  return (
    <figure>
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={ariaLabel} className="h-auto w-full">
        <line x1={pad.left} x2={width - pad.right} y1={height - pad.bottom} y2={height - pad.bottom} stroke="#d6d3d1" />
        {data.map((item, index) => {
          const barHeight = (item.value / max) * plotHeight;
          const x = pad.left + slot * index + (slot - barWidth) / 2;
          const y = height - pad.bottom - barHeight;
          const color = item.color ?? CHART_COLORS[index % CHART_COLORS.length];
          const interactive = Boolean(onSelect);
          return (
            <g
              key={item.label}
              tabIndex={interactive ? 0 : undefined}
              role={interactive ? 'button' : undefined}
              aria-label={interactive ? `${item.label}: ${format(item.value)}. Open details` : undefined}
              onClick={interactive ? () => onSelect?.(item.label) : undefined}
              onKeyDown={interactive ? (event) => (event.key === 'Enter' || event.key === ' ') && (event.preventDefault(), onSelect?.(item.label)) : undefined}
              className={interactive ? 'cursor-pointer outline-none focus-visible:[&>rect]:stroke-[#262626] focus-visible:[&>rect]:stroke-2' : undefined}
            >
              <title>{`${item.label}: ${format(item.value)}`}</title>
              <rect x={x} y={y} width={barWidth} height={Math.max(barHeight, 1)} rx={4} fill={color} />
              <text x={x + barWidth / 2} y={y - 4} textAnchor="middle" fontSize="11" fill="#3d3d3d">
                {format(item.value)}
              </text>
              <text x={x + barWidth / 2} y={height - pad.bottom + 16} textAnchor="middle" fontSize="11" fill="#4f4f4f">
                {item.label.length > 12 ? `${item.label.slice(0, 11)}...` : item.label}
              </text>
            </g>
          );
        })}
      </svg>
      {hiddenTable(ariaLabel, data.map((item) => [item.label, format(item.value)]))}
    </figure>
  );
}

interface LineSeries {
  name: string;
  color?: string;
  points: Array<{ label: string; value: number }>;
}

export function LineChart({ series, ariaLabel, height = 220, format = (value) => String(value) }: { series: LineSeries[]; ariaLabel: string; height?: number; format?: (value: number) => string }) {
  const width = 600;
  const pad = { top: 16, right: 16, bottom: 34, left: 40 };
  const labels = series[0]?.points.map((point) => point.label) ?? [];
  const max = Math.max(1, ...series.flatMap((line) => line.points.map((point) => point.value)));
  const plotWidth = width - pad.left - pad.right;
  const plotHeight = height - pad.top - pad.bottom;
  const x = (index: number) => pad.left + (labels.length <= 1 ? plotWidth / 2 : (plotWidth / (labels.length - 1)) * index);
  const y = (value: number) => pad.top + plotHeight - (value / max) * plotHeight;

  return (
    <figure>
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={ariaLabel} className="h-auto w-full">
        {[0, 0.5, 1].map((fraction) => (
          <g key={fraction}>
            <line x1={pad.left} x2={width - pad.right} y1={y(max * fraction)} y2={y(max * fraction)} stroke="#e7e5e4" />
            <text x={pad.left - 6} y={y(max * fraction) + 4} textAnchor="end" fontSize="10" fill="#57534e">
              {format(Math.round(max * fraction))}
            </text>
          </g>
        ))}
        {labels.map((label, index) => (
          <text key={label} x={x(index)} y={height - pad.bottom + 16} textAnchor="middle" fontSize="11" fill="#4f4f4f">
            {label}
          </text>
        ))}
        {series.map((line, seriesIndex) => {
          const color = line.color ?? CHART_COLORS[seriesIndex % CHART_COLORS.length];
          return (
            <g key={line.name}>
              <polyline fill="none" stroke={color} strokeWidth="2.5" points={line.points.map((point, index) => `${x(index)},${y(point.value)}`).join(' ')} />
              {line.points.map((point, index) => (
                <circle key={point.label} cx={x(index)} cy={y(point.value)} r="4" fill={color}>
                  <title>{`${line.name}, ${point.label}: ${format(point.value)}`}</title>
                </circle>
              ))}
            </g>
          );
        })}
      </svg>
      <ul className="mt-2 flex flex-wrap gap-4 text-xs text-charcoal-700">
        {series.map((line, index) => (
          <li key={line.name} className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: line.color ?? CHART_COLORS[index % CHART_COLORS.length] }} aria-hidden="true" />
            {line.name}
          </li>
        ))}
      </ul>
      {hiddenTable(
        ariaLabel,
        labels.map((label, index) => [label, series.map((line) => `${line.name} ${format(line.points[index]?.value ?? 0)}`).join(', ')]),
        ['Period', 'Values'],
      )}
    </figure>
  );
}

export function DonutChart({ data, ariaLabel, centerLabel, format = (value) => String(value), onSelect }: { data: Datum[]; ariaLabel: string; centerLabel?: string; format?: (value: number) => string; onSelect?: (label: string) => void }) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const starts = data.map((_, index) => data.slice(0, index).reduce((sum, item) => sum + (total > 0 ? (item.value / total) * circumference : 0), 0));

  return (
    <figure className="flex flex-wrap items-center gap-6">
      <svg viewBox="0 0 140 140" role="img" aria-label={ariaLabel} className="h-36 w-36 shrink-0">
        <circle cx="70" cy="70" r={radius} fill="none" stroke="#f5f5f4" strokeWidth="18" />
        {total > 0 &&
          data.map((item, index) => {
            const length = (item.value / total) * circumference;
            return (
              <circle
                key={item.label}
                cx="70"
                cy="70"
                r={radius}
                fill="none"
                stroke={item.color ?? CHART_COLORS[index % CHART_COLORS.length]}
                strokeWidth="18"
                strokeDasharray={`${length} ${circumference - length}`}
                strokeDashoffset={-starts[index]}
                transform="rotate(-90 70 70)"
              >
                <title>{`${item.label}: ${format(item.value)} (${Math.round((item.value / total) * 100)}%)`}</title>
              </circle>
            );
          })}
        <text x="70" y="68" textAnchor="middle" fontSize="18" fontWeight="700" fill="#262626">
          {format(total)}
        </text>
        {centerLabel && (
          <text x="70" y="84" textAnchor="middle" fontSize="9" fill="#57534e">
            {centerLabel}
          </text>
        )}
      </svg>
      <ul className="space-y-1.5 text-sm">
        {data.map((item, index) => {
          const content = (
            <>
              <span className="h-3 w-3 rounded-sm" style={{ background: item.color ?? CHART_COLORS[index % CHART_COLORS.length] }} aria-hidden="true" />
              <span className="text-charcoal-800">{item.label}</span>
              <span className="font-semibold text-charcoal-950">{format(item.value)}</span>
            </>
          );
          return (
            <li key={item.label}>
              {onSelect ? (
                <button type="button" onClick={() => onSelect(item.label)} className="flex items-center gap-2 rounded px-1 py-0.5 hover:bg-warm-100">
                  {content}
                </button>
              ) : (
                <span className="flex items-center gap-2 px-1 py-0.5">{content}</span>
              )}
            </li>
          );
        })}
      </ul>
      {hiddenTable(ariaLabel, data.map((item) => [item.label, format(item.value)]))}
    </figure>
  );
}

interface MetricCardProps {
  label: string;
  value: string;
  hint?: string;
  icon?: ReactNode;
  /** What the number means and how it is counted. Required: every metric must be explainable. */
  definition: string;
  period: string;
  updated: string;
  coverage: string;
  /** Where the detail view is. Makes the card a drill-down. */
  to?: string;
  tone?: 'default' | 'alert';
}

/** KPI card with metric definition, period, last updated, coverage and drill-down. */
export function MetricCard({ label, value, hint, icon, definition, period, updated, coverage, to, tone = 'default' }: MetricCardProps) {
  return (
    <div className={cn('card flex flex-col gap-2 !p-4', tone === 'alert' && 'border-danger-200 bg-danger-50/40')}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-charcoal-700">{label}</p>
        <div className="flex items-center gap-1">
          {icon && (
            <span className="text-primary-700" aria-hidden="true">
              {icon}
            </span>
          )}
          <Popover
            label={`About ${label}`}
            align="right"
            panelClassName="w-72 !p-3"
            trigger={(props) => (
              <button {...props} type="button" aria-label={`About the metric ${label}`} className="rounded p-1 text-charcoal-500 hover:bg-warm-100">
                <Info size={16} aria-hidden="true" />
              </button>
            )}
          >
            {() => (
              <dl className="space-y-2 text-xs text-charcoal-700">
                <div>
                  <dt className="font-semibold text-charcoal-900">Definition</dt>
                  <dd>{definition}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-charcoal-900">Period</dt>
                  <dd>{period}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-charcoal-900">Coverage</dt>
                  <dd>{coverage}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-charcoal-900">Last updated</dt>
                  <dd>{updated}</dd>
                </div>
              </dl>
            )}
          </Popover>
        </div>
      </div>
      <p className="text-3xl font-bold text-charcoal-950">{value}</p>
      {hint && <p className="text-xs text-charcoal-600">{hint}</p>}
      <div className="mt-auto flex items-center justify-between gap-2 pt-1 text-xs text-charcoal-500">
        <span>{period}</span>
        {to && (
          <Link to={to} className="font-medium text-primary-700 hover:underline">
            View details
          </Link>
        )}
      </div>
    </div>
  );
}
