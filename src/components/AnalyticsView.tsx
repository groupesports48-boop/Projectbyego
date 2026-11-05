import React, { useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Activity,
  Layers,
} from 'lucide-react';
import {
  EsportsTrophy,
  EsportsSwords,
  EsportsDefeat,
  EsportsTelemetry,
} from './EsportsIcons';
import { MatchResult, PeriodFilter, DailyPerformancePoint } from '../types';
import { calculatePerformanceMetrics } from '../utils/analytics';

interface AnalyticsViewProps {
  results: MatchResult[];
  onOpenAddModal: () => void;
  onOpenOcrModal: () => void;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  results,
  onOpenAddModal,
  onOpenOcrModal,
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodFilter>('30d');
  const [hoveredPoint, setHoveredPoint] = useState<DailyPerformancePoint | null>(null);

  // Calculate real performance metrics for the selected period
  const metrics = calculatePerformanceMetrics(results, selectedPeriod);
  const comparison = metrics.comparison;

  const periods: { id: PeriodFilter; label: string }[] = [
    { id: '7d', label: 'Last 7 Days' },
    { id: '15d', label: 'Last 15 Days' },
    { id: '30d', label: 'Last 30 Days' },
    { id: '90d', label: 'Last 90 Days' },
    { id: 'all', label: 'All Time' },
  ];

  // Helper for trend badge
  const renderTrendDiff = (diff: number, isPercentage: boolean = false) => {
    if (diff > 0) {
      return (
        <span className="inline-flex items-center gap-0.5 text-xs font-semibold font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/25 shadow-sm">
          <ArrowUpRight className="w-3.5 h-3.5" />
          <span>+{diff}{isPercentage ? '%' : ''}</span>
        </span>
      );
    }
    if (diff < 0) {
      return (
        <span className="inline-flex items-center gap-0.5 text-xs font-semibold font-mono text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-md border border-rose-500/25 shadow-sm">
          <ArrowDownRight className="w-3.5 h-3.5" />
          <span>{diff}{isPercentage ? '%' : ''}</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-0.5 text-xs font-semibold font-mono text-[#9296A8] bg-[#111321] px-2 py-0.5 rounded-md border border-[#1f233a]">
        <Minus className="w-3.5 h-3.5" />
        <span>0{isPercentage ? '%' : ''}</span>
      </span>
    );
  };

  // SVG Chart Geometry
  const trend = metrics.dailyTrend;
  const chartHeight = 240;
  const chartWidth = 720;
  const paddingX = 45;
  const paddingY = 35;

  // Compute min and max for cumulative score
  let minScore = 0;
  let maxScore = 0;
  trend.forEach((p) => {
    if (p.cumulativeScore < minScore) minScore = p.cumulativeScore;
    if (p.cumulativeScore > maxScore) maxScore = p.cumulativeScore;
  });

  // Provide a safe range
  if (minScore === maxScore) {
    minScore -= 2;
    maxScore += 2;
  }
  const scoreRange = maxScore - minScore;

  // Map daily points to SVG coordinates
  const points = trend.map((p, idx) => {
    const x =
      trend.length === 1
        ? chartWidth / 2
        : paddingX + (idx / (trend.length - 1)) * (chartWidth - paddingX * 2);
    const normalizedY = (p.cumulativeScore - minScore) / scoreRange;
    const y = chartHeight - paddingY - normalizedY * (chartHeight - paddingY * 2);
    return { ...p, x, y };
  });

  const pathD =
    points.length > 0
      ? points.reduce((acc, pt, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`, '')
      : '';

  const areaD =
    points.length > 0
      ? `${pathD} L ${points[points.length - 1].x} ${chartHeight - paddingY} L ${points[0].x} ${chartHeight - paddingY} Z`
      : '';

  const zeroY =
    chartHeight - paddingY - ((-minScore) / scoreRange) * (chartHeight - paddingY * 2);

  return (
    <div className="space-y-6 pb-12">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-[#8B5CF6]/15 border border-[#8B5CF6]/30 text-[11px] font-semibold text-[#A78BFA] mb-1.5 font-sub tracking-wider uppercase">
            <Activity className="w-3.5 h-3.5" />
            <span>Combat Analytics Telemetry</span>
          </div>
          <h1 className="text-2xl font-extrabold font-heading text-white tracking-wide">
            PERFORMANCE ANALYTICS
          </h1>
          <p className="text-xs text-[#9296A8] mt-1 font-mono">
            Strict verified records • Interactive momentum telemetry • Period comparison
          </p>
        </div>

        {/* Time Period Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1.5 bg-[#171A2B] border border-[#1f233a] rounded-2xl shadow-inner overflow-x-auto">
          {periods.map((p) => (
            <button
              key={p.id}
              onClick={() => setSelectedPeriod(p.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedPeriod === p.id
                  ? 'btn-3d-purple text-white'
                  : 'text-[#9296A8] hover:text-white hover:bg-[#111321]'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* PERFORMANCE INSIGHTS BANNER (3D Layered) */}
      <div className="p-5 rounded-2xl card-3d flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative overflow-hidden">
        <div className="absolute top-0 right-1/3 w-64 h-32 bg-[#8B5CF6]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center gap-3.5 relative z-10">
          <div
            className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-md ${
              comparison.insight === 'improved'
                ? 'icon-badge-3d-emerald text-emerald-400'
                : comparison.insight === 'declined'
                ? 'icon-badge-3d-rose text-rose-400'
                : 'icon-badge-3d-purple text-[#A78BFA]'
            }`}
          >
            {comparison.insight === 'improved' ? (
              <TrendingUp className="w-5 h-5" />
            ) : comparison.insight === 'declined' ? (
              <TrendingDown className="w-5 h-5" />
            ) : (
              <Sparkles className="w-5 h-5" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#9296A8]">
                Combat Status:
              </span>
              <span
                className={`text-xs font-extrabold uppercase px-2.5 py-0.5 rounded-md font-mono ${
                  comparison.insight === 'improved'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
                    : comparison.insight === 'declined'
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-[0_0_10px_rgba(244,63,94,0.2)]'
                    : 'bg-[#1f233a] text-[#C0C4D0] border border-[#1f233a]'
                }`}
              >
                {comparison.insight === 'improved'
                  ? 'Performance Improved'
                  : comparison.insight === 'declined'
                  ? 'Performance Declined'
                  : 'Performance Remained Stable'}
              </span>
            </div>
            <p className="text-sm font-semibold text-white mt-1">
              {comparison.insightDetail}
            </p>
          </div>
        </div>

        <div className="text-right text-xs text-[#9296A8] border-t sm:border-t-0 sm:border-l border-[#1f233a] pt-3 sm:pt-0 sm:pl-5">
          <span className="block font-medium">Comparison Baseline:</span>
          <span className="text-white font-mono font-semibold">
            {selectedPeriod === 'all'
              ? 'First half of recorded matches'
              : `Preceding ${selectedPeriod.replace('d', '')} days period`}
          </span>
        </div>
      </div>

      {/* KPI Cards for the Selected Period */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Matches Played */}
        <div className="card-3d rounded-2xl p-4 sm:p-5">
          <div className="flex items-center justify-between text-[#9296A8] mb-1.5">
            <span className="text-xs font-semibold uppercase text-[#C0C4D0]">Matches Played</span>
            <div className="w-8 h-8 rounded-lg icon-badge-3d-purple flex items-center justify-center text-[#A78BFA]">
              <EsportsSwords className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold font-heading text-white">
              {metrics.totalMatches}
            </span>
            <span className="text-xs text-[#9296A8] font-mono">battles</span>
          </div>
          <div className="mt-2.5 pt-2.5 border-t border-[#1f233a] flex items-center justify-between">
            <span className="text-[11px] text-[#9296A8] font-mono">Prior: {comparison.prevMatches}</span>
            {renderTrendDiff(comparison.matchesDiff)}
          </div>
        </div>

        {/* Wins */}
        <div className="card-3d rounded-2xl p-4 sm:p-5">
          <div className="flex items-center justify-between text-[#9296A8] mb-1.5">
            <span className="text-xs font-semibold uppercase text-emerald-400">Total Wins</span>
            <div className="w-8 h-8 rounded-lg icon-badge-3d-emerald flex items-center justify-center text-emerald-400">
              <EsportsTrophy className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold font-heading text-emerald-400">
              {metrics.totalWins}
            </span>
            <span className="text-xs text-[#9296A8] font-mono">Booyahs</span>
          </div>
          <div className="mt-2.5 pt-2.5 border-t border-[#1f233a] flex items-center justify-between">
            <span className="text-[11px] text-[#9296A8] font-mono">Prior: {comparison.prevWins}</span>
            {renderTrendDiff(comparison.winsDiff)}
          </div>
        </div>

        {/* Losses */}
        <div className="card-3d rounded-2xl p-4 sm:p-5">
          <div className="flex items-center justify-between text-[#9296A8] mb-1.5">
            <span className="text-xs font-semibold uppercase text-rose-400">Total Losses</span>
            <div className="w-8 h-8 rounded-lg icon-badge-3d-rose flex items-center justify-center text-rose-400">
              <EsportsDefeat className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold font-heading text-rose-400">
              {metrics.totalLosses}
            </span>
            <span className="text-xs text-[#9296A8] font-mono">defeats</span>
          </div>
          <div className="mt-2.5 pt-2.5 border-t border-[#1f233a] flex items-center justify-between">
            <span className="text-[11px] text-[#9296A8] font-mono">Prior: {comparison.prevLosses}</span>
            {renderTrendDiff(comparison.lossesDiff)}
          </div>
        </div>

        {/* Win Rate */}
        <div className="card-3d rounded-2xl p-4 sm:p-5">
          <div className="flex items-center justify-between text-[#9296A8] mb-1.5">
            <span className="text-xs font-semibold uppercase text-[#A78BFA]">Win Rate</span>
            <div className="w-8 h-8 rounded-lg icon-badge-3d-purple flex items-center justify-center text-[#A78BFA]">
              <EsportsTelemetry className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold font-heading text-white">
              {metrics.winRate}%
            </span>
          </div>
          <div className="mt-2.5 pt-2.5 border-t border-[#1f233a] flex items-center justify-between">
            <span className="text-[11px] text-[#9296A8] font-mono">Prior: {comparison.prevWinRate}%</span>
            {renderTrendDiff(comparison.winRateDiff, true)}
          </div>
        </div>
      </div>

      {/* 3D PERFORMANCE GRAPH SECTION */}
      <div className="card-3d rounded-2xl p-6 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#A78BFA]" />
              <h3 className="text-base font-bold text-white font-heading">
                Combat Performance & Momentum Curve
              </h3>
            </div>
            <p className="text-xs text-[#9296A8] mt-0.5">
              Net combat momentum telemetry: (+1 for BOOYAH! / WIN, -1 for Defeat / LOSS)
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-[#8B5CF6] shadow-[0_0_8px_#8B5CF6]" />
              <span className="text-[#C0C4D0]">Momentum Curve</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-emerald-400 shadow-[0_0_8px_#34D399]" />
              <span className="text-[#C0C4D0]">Booyah Peak</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-rose-400 shadow-[0_0_8px_#FB7185]" />
              <span className="text-[#C0C4D0]">Loss Trough</span>
            </div>
          </div>
        </div>

        {/* Interactive SVG Chart */}
        {trend.length > 0 ? (
          <div className="relative overflow-x-auto">
            <svg
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              className="w-full h-auto min-w-[550px] overflow-visible"
              onMouseLeave={() => setHoveredPoint(null)}
            >
              <defs>
                <linearGradient id="purpleAreaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.45" />
                  <stop offset="50%" stopColor="#8B5CF6" stopOpacity="0.12" />
                  <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.0" />
                </linearGradient>
                <filter id="glowFilter" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* Grid Lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
                const y = paddingY + ratio * (chartHeight - paddingY * 2);
                return (
                  <line
                    key={ratio}
                    x1={paddingX}
                    y1={y}
                    x2={chartWidth - paddingX}
                    y2={y}
                    stroke="#1f233a"
                    strokeWidth="1"
                    strokeDasharray="4 4"
                  />
                );
              })}

              {/* Zero baseline indicator */}
              {minScore <= 0 && maxScore >= 0 && (
                <g>
                  <line
                    x1={paddingX}
                    y1={zeroY}
                    x2={chartWidth - paddingX}
                    y2={zeroY}
                    stroke="rgba(167, 139, 250, 0.4)"
                    strokeWidth="1.5"
                    strokeDasharray="3 3"
                  />
                  <text
                    x={chartWidth - paddingX + 8}
                    y={zeroY + 3}
                    fill="#9296A8"
                    fontSize="9"
                    fontFamily="monospace"
                  >
                    0 Baseline
                  </text>
                </g>
              )}

              {/* Area gradient fill */}
              {areaD && <path d={areaD} fill="url(#purpleAreaGrad)" />}

              {/* Main momentum line with glow */}
              {pathD && (
                <>
                  <path
                    d={pathD}
                    fill="none"
                    stroke="#8B5CF6"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    filter="url(#glowFilter)"
                  />
                  <path
                    d={pathD}
                    fill="none"
                    stroke="#FFFFFF"
                    strokeWidth="1.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity="0.8"
                  />
                </>
              )}

              {/* Interactive Point Nodes */}
              {points.map((pt, i) => {
                const isHovered = hoveredPoint?.date === pt.date;
                const isWinHeavy = pt.wins >= pt.losses;
                return (
                  <g key={i}>
                    {/* Hit target */}
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r="18"
                      fill="transparent"
                      className="cursor-pointer"
                      onMouseEnter={() => setHoveredPoint(pt)}
                      onClick={() => setHoveredPoint(pt)}
                    />

                    {/* Outer pulse ring on hover */}
                    {isHovered && (
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r="10"
                        fill="none"
                        stroke={isWinHeavy ? '#10B981' : '#F43F5E'}
                        strokeWidth="2"
                        className="animate-ping"
                      />
                    )}

                    {/* Node circle */}
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={isHovered ? 7 : 5}
                      fill={isWinHeavy ? '#10B981' : '#F43F5E'}
                      stroke="#08090F"
                      strokeWidth="2.5"
                      className="transition-all"
                    />

                    {/* Date label underneath */}
                    <text
                      x={pt.x}
                      y={chartHeight - 10}
                      textAnchor="middle"
                      fill={isHovered ? '#FFFFFF' : '#9296A8'}
                      fontSize="10"
                      fontFamily="monospace"
                      fontWeight={isHovered ? 'bold' : 'normal'}
                    >
                      {pt.displayDate}
                    </text>
                  </g>
                );
              })}
            </svg>

            {/* Hover Tooltip Card (3D Bevel) */}
            {hoveredPoint && (
              <div className="mt-4 p-4 rounded-xl bg-[#111321] border border-[#8B5CF6]/50 shadow-[0_10px_25px_rgba(0,0,0,0.6)] flex flex-wrap items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-[#A78BFA]" />
                    <span className="text-sm font-bold text-white font-mono">
                      {hoveredPoint.displayDate} ({hoveredPoint.date})
                    </span>
                  </div>
                  <p className="text-xs text-[#9296A8] font-mono">
                    Daily Matches: <strong className="text-white">{hoveredPoint.total}</strong> • Wins:{' '}
                    <strong className="text-emerald-400">{hoveredPoint.wins}</strong> • Losses:{' '}
                    <strong className="text-rose-400">{hoveredPoint.losses}</strong>
                  </p>
                </div>
                <div className="flex items-center gap-5">
                  <div className="text-right">
                    <span className="text-[10px] uppercase text-[#9296A8] block font-mono">Net Momentum</span>
                    <span
                      className={`text-lg font-extrabold font-mono ${
                        hoveredPoint.cumulativeScore >= 0 ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {hoveredPoint.cumulativeScore > 0 ? `+${hoveredPoint.cumulativeScore}` : hoveredPoint.cumulativeScore}
                    </span>
                  </div>
                  <div className="text-right border-l border-[#1f233a] pl-5">
                    <span className="text-[10px] uppercase text-[#9296A8] block font-mono">Win Rate to Date</span>
                    <span className="text-lg font-extrabold text-[#A78BFA] font-mono">
                      {hoveredPoint.winRate}%
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Empty Graph State */
          <div className="text-center py-16 px-4 bg-[#111321] border border-dashed border-[#1f233a] rounded-xl space-y-3">
            <EsportsTelemetry className="w-12 h-12 text-[#9296A8]/40 mx-auto" />
            <h4 className="text-sm font-bold text-white">No Match Data for this Period</h4>
            <p className="text-xs text-[#9296A8] max-w-sm mx-auto">
              Record match results to generate the interactive performance trend graph.
            </p>
            <div className="pt-2 flex justify-center gap-2">
              <button
                onClick={onOpenAddModal}
                className="px-4 py-2 rounded-xl btn-3d-purple text-white text-xs font-semibold cursor-pointer"
              >
                Log Result
              </button>
              <button
                onClick={onOpenOcrModal}
                className="px-4 py-2 rounded-xl btn-3d-dark text-[#C0C4D0] hover:text-white text-xs font-semibold cursor-pointer"
              >
                Scan Scorecard
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MATCH TYPE PERFORMANCE BREAKDOWN (Solo vs Duo vs Squad with 3D depth) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Solo */}
        <div className="card-3d rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="px-2.5 py-1 rounded-md bg-[#8B5CF6]/20 text-[#A78BFA] text-xs font-bold uppercase font-mono border border-[#8B5CF6]/30">
              Solo
            </span>
            <span className="text-xs font-mono text-[#9296A8]">
              {metrics.soloStats.matches} matches
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-xl font-extrabold text-white font-mono">
              {metrics.soloStats.winRate}%
            </span>
            <span className="text-xs text-[#9296A8] font-mono">
              {metrics.soloStats.wins}W - {metrics.soloStats.losses}L
            </span>
          </div>
          <div className="w-full bg-[#111321] rounded-full h-2 overflow-hidden p-0.5 border border-[#1f233a]">
            <div
              className="bg-[#8B5CF6] h-full rounded-full transition-all duration-500 shadow-[0_0_8px_#8B5CF6]"
              style={{ width: `${metrics.soloStats.winRate}%` }}
            />
          </div>
        </div>

        {/* Duo */}
        <div className="card-3d rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="px-2.5 py-1 rounded-md bg-blue-500/20 text-blue-400 text-xs font-bold uppercase font-mono border border-blue-500/30">
              Duo
            </span>
            <span className="text-xs font-mono text-[#9296A8]">
              {metrics.duoStats.matches} matches
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-xl font-extrabold text-white font-mono">
              {metrics.duoStats.winRate}%
            </span>
            <span className="text-xs text-[#9296A8] font-mono">
              {metrics.duoStats.wins}W - {metrics.duoStats.losses}L
            </span>
          </div>
          <div className="w-full bg-[#111321] rounded-full h-2 overflow-hidden p-0.5 border border-[#1f233a]">
            <div
              className="bg-blue-400 h-full rounded-full transition-all duration-500 shadow-[0_0_8px_#60A5FA]"
              style={{ width: `${metrics.duoStats.winRate}%` }}
            />
          </div>
        </div>

        {/* Squad */}
        <div className="card-3d rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="px-2.5 py-1 rounded-md bg-emerald-500/20 text-emerald-400 text-xs font-bold uppercase font-mono border border-emerald-500/30">
              Squad
            </span>
            <span className="text-xs font-mono text-[#9296A8]">
              {metrics.squadStats.matches} matches
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-xl font-extrabold text-white font-mono">
              {metrics.squadStats.winRate}%
            </span>
            <span className="text-xs text-[#9296A8] font-mono">
              {metrics.squadStats.wins}W - {metrics.squadStats.losses}L
            </span>
          </div>
          <div className="w-full bg-[#111321] rounded-full h-2 overflow-hidden p-0.5 border border-[#1f233a]">
            <div
              className="bg-emerald-400 h-full rounded-full transition-all duration-500 shadow-[0_0_8px_#34D399]"
              style={{ width: `${metrics.squadStats.winRate}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
