import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Clock,
  Edit3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  AlertCircle,
  Eye,
  X,
  Check,
  Sparkles,
  Receipt,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
} from 'lucide-react';
import {
  MatchResult,
  ProfitLossPeriodFilter,
  MatchType,
} from '../types';
import {
  calculateMatchNet,
  filterMatchesByProfitLossPeriod,
  calculateProfitLossSummary,
} from '../utils/profitLoss';
import { api } from '../services/api';
import {
  EsportsProfit,
  EsportsTrophy,
  EsportsDefeat,
} from './EsportsIcons';

interface ProfitLossViewProps {
  results: MatchResult[];
  onRefresh: () => void;
  onNavigateToHistory: () => void;
}

export const ProfitLossView: React.FC<ProfitLossViewProps> = ({
  results,
  onRefresh,
  onNavigateToHistory,
}) => {
  // Filters: 15d, 20d, 25d, 30d, all
  const [selectedPeriod, setSelectedPeriod] = useState<ProfitLossPeriodFilter>('30d');
  const [typeFilter, setTypeFilter] = useState<'ALL' | MatchType>('ALL');

  // Modal states
  const [editingMatch, setEditingMatch] = useState<MatchResult | null>(null);
  const [editEntryFee, setEditEntryFee] = useState<number | ''>('');
  const [editPrizeMoney, setEditPrizeMoney] = useState<number | ''>('');
  const [editExtraExpenses, setEditExtraExpenses] = useState<number | ''>('');
  const [editExpenseNotes, setEditExpenseNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Screenshot viewer modal
  const [viewingScreenshot, setViewingScreenshot] = useState<string | null>(null);

  // Active chart hover tooltip
  const [activeHoverIndex, setActiveHoverIndex] = useState<number | null>(null);

  // 1. Filter results by period
  const periodFiltered = useMemo(() => {
    return filterMatchesByProfitLossPeriod(results, selectedPeriod);
  }, [results, selectedPeriod]);

  // 2. Filter by match type if selected
  const filteredMatches = useMemo(() => {
    if (typeFilter === 'ALL') return periodFiltered;
    return periodFiltered.filter((m) => m.matchType === typeFilter);
  }, [periodFiltered, typeFilter]);

  // 3. Compute financial summary & graph points
  const summary = useMemo(() => {
    return calculateProfitLossSummary(filteredMatches);
  }, [filteredMatches]);

  // Open edit modal
  const handleOpenEdit = (m: MatchResult) => {
    setEditingMatch(m);
    setEditEntryFee(m.entryFee !== undefined ? m.entryFee : 0);
    setEditPrizeMoney(m.prizeMoney !== undefined ? m.prizeMoney : 0);
    setEditExtraExpenses(m.extraExpenses !== undefined ? m.extraExpenses : 0);
    setEditExpenseNotes(m.expenseNotes || '');
    setSaveError(null);
  };

  // Submit financial update
  const handleSaveFinances = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMatch) return;

    setSaving(true);
    setSaveError(null);
    try {
      await api.profitLoss.update(editingMatch.id, {
        entryFee: editEntryFee !== '' ? Math.max(0, Number(editEntryFee)) : 0,
        prizeMoney: editPrizeMoney !== '' ? Math.max(0, Number(editPrizeMoney)) : 0,
        extraExpenses: editExtraExpenses !== '' ? Math.max(0, Number(editExtraExpenses)) : 0,
        expenseNotes: editExpenseNotes.trim() || undefined,
      });

      setEditingMatch(null);
      onRefresh();
    } catch (err: any) {
      setSaveError(err.message || 'Failed to update match finances');
    } finally {
      setSaving(false);
    }
  };

  // Preview net calculation in modal
  const modalPreviewNet = useMemo(() => {
    const p = editPrizeMoney !== '' ? Number(editPrizeMoney) : 0;
    const e = editEntryFee !== '' ? Number(editEntryFee) : 0;
    const x = editExtraExpenses !== '' ? Number(editExtraExpenses) : 0;
    return p - (e + x);
  }, [editPrizeMoney, editEntryFee, editExtraExpenses]);

  // Period label helper
  const periodLabels: Record<ProfitLossPeriodFilter, string> = {
    '15d': 'Last 15 Days',
    '20d': 'Last 20 Days',
    '25d': 'Last 25 Days',
    '30d': 'Last 30 Days',
    all: 'All Time',
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header & Period Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="icon-badge-3d-purple">
              <EsportsProfit className="w-5 h-5 text-[#A78BFA]" />
            </div>
            <h1 className="text-2xl font-black font-heading text-white tracking-wide">
              PROFIT & LOSS TELEMETRY
            </h1>
          </div>
          <p className="text-xs text-[#9296A8] mt-1">
            Pulling directly from verified Match History • Auto-filled entry fees, actual prize money & net ROI
          </p>
        </div>

        {/* Period Filter Buttons (15d, 20d, 25d, 30d, all) */}
        <div className="flex items-center gap-1.5 p-1 bg-[#111321] border border-[#1f233a] rounded-xl self-start md:self-auto overflow-x-auto max-w-full shadow-inner">
          {(['15d', '20d', '25d', '30d', 'all'] as ProfitLossPeriodFilter[]).map((period) => (
            <button
              key={period}
              onClick={() => setSelectedPeriod(period)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                selectedPeriod === period
                  ? 'bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] text-white shadow-[0_2px_10px_rgba(139,92,246,0.5)] translate-y-[-1px]'
                  : 'text-[#9296A8] hover:text-white hover:bg-[#171A2B]'
              }`}
            >
              {periodLabels[period]}
            </button>
          ))}
        </div>
      </div>

      {/* Top 3D Financial Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Net Profit / Loss */}
        <div className="card-3d p-5 relative overflow-hidden group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#9296A8]">
              Net Profit / Loss
            </span>
            <div
              className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                summary.netProfitLoss > 0
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : summary.netProfitLoss < 0
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                  : 'bg-[#1f233a] text-[#C0C4D0]'
              }`}
            >
              {summary.netProfitLoss > 0 ? (
                <ArrowUpRight className="w-4 h-4" />
              ) : summary.netProfitLoss < 0 ? (
                <ArrowDownRight className="w-4 h-4" />
              ) : (
                <Minus className="w-4 h-4" />
              )}
            </div>
          </div>

          <div className="flex items-baseline gap-2">
            <span
              className={`text-2xl font-black font-heading tracking-tight ${
                summary.netProfitLoss > 0
                  ? 'text-emerald-400 drop-shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                  : summary.netProfitLoss < 0
                  ? 'text-rose-400 drop-shadow-[0_0_10px_rgba(244,63,94,0.3)]'
                  : 'text-white'
              }`}
            >
              {summary.netProfitLoss > 0 ? `+₹${summary.netProfitLoss.toLocaleString('en-IN')}` : summary.netProfitLoss < 0 ? `-₹${Math.abs(summary.netProfitLoss).toLocaleString('en-IN')}` : '₹0'}
            </span>
            <span className="text-xs text-[#9296A8] font-mono">
              {summary.netProfitLoss > 0 ? 'Surplus' : summary.netProfitLoss < 0 ? 'Deficit' : 'Break-Even'}
            </span>
          </div>

          <div className="mt-3 pt-2.5 border-t border-[#1f233a] flex items-center justify-between text-xs">
            <span className="text-[#9296A8]">Return on Investment</span>
            <span
              className={`font-mono font-bold ${
                summary.roi > 0
                  ? 'text-emerald-400'
                  : summary.roi < 0
                  ? 'text-rose-400'
                  : 'text-[#C0C4D0]'
              }`}
            >
              {summary.roi > 0 ? `+${summary.roi}%` : `${summary.roi}%`}
            </span>
          </div>
        </div>

        {/* 2. Total Prize Won */}
        <div className="card-3d p-5 relative overflow-hidden group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#9296A8]">
              Total Prize Won
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
              <EsportsTrophy className="w-4 h-4" />
            </div>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black font-heading text-white tracking-tight">
              ₹{summary.totalPrizeMoney.toLocaleString('en-IN')}
            </span>
            <span className="text-xs text-emerald-400 font-mono">Gross Earnings</span>
          </div>

          <div className="mt-3 pt-2.5 border-t border-[#1f233a] flex items-center justify-between text-xs">
            <span className="text-[#9296A8]">Profitable Matches</span>
            <span className="font-mono font-bold text-white">
              {summary.profitMatchesCount} of {summary.totalMatches}
            </span>
          </div>
        </div>

        {/* 3. Total Expenses Invested */}
        <div className="card-3d p-5 relative overflow-hidden group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#9296A8]">
              Total Cost / Expenses
            </span>
            <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black font-heading text-white tracking-tight">
              ₹{summary.totalExpenses.toLocaleString('en-IN')}
            </span>
            <span className="text-xs text-amber-400 font-mono">Invested</span>
          </div>

          <div className="mt-3 pt-2.5 border-t border-[#1f233a] flex items-center justify-between text-xs">
            <span className="text-[#9296A8]">Entry Fees / Extra</span>
            <span className="font-mono text-[#C0C4D0]">
              ₹{summary.totalEntryFees} + ₹{summary.totalExtraExpenses}
            </span>
          </div>
        </div>

        {/* 4. Match Financial Record Breakdown */}
        <div className="card-3d p-5 relative overflow-hidden group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#9296A8]">
              Match Balance Record
            </span>
            <div className="w-7 h-7 rounded-lg bg-[#8B5CF6]/20 text-[#A78BFA] border border-[#8B5CF6]/30 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_6px_#10B981]" />
              <span className="text-xs font-bold text-white">{summary.profitMatchesCount}W</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_6px_#F43F5E]" />
              <span className="text-xs font-bold text-white">{summary.lossMatchesCount}L</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#9296A8]" />
              <span className="text-xs font-bold text-[#C0C4D0]">{summary.breakEvenMatchesCount}E</span>
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-[#1f233a] flex items-center justify-between text-xs">
            <span className="text-[#9296A8]">Active Filter</span>
            <span className="font-mono text-[#A78BFA] font-bold">
              {periodLabels[selectedPeriod]}
            </span>
          </div>
        </div>
      </div>

      {/* Interactive 3D Profit & Loss Momentum Graph */}
      <div className="card-3d p-6 relative">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white font-heading tracking-wide">
                Net Profit & Loss Momentum Curve
              </h2>
              <span className="cyber-tag text-emerald-400 border-emerald-500/30 bg-emerald-500/10">
                INR (₹) TELEMETRY
              </span>
            </div>
            <p className="text-xs text-[#9296A8] mt-0.5">
              Cumulative financial trajectory over {periodLabels[selectedPeriod].toLowerCase()}
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-[#8B5CF6] rounded" />
              <span className="text-[#C0C4D0]">Net Trajectory</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-[#C0C4D0]">Prize Day</span>
            </div>
          </div>
        </div>

        {summary.timeline.length > 0 ? (
          <div>
            {/* SVG Visual Graph */}
            <div className="relative h-56 w-full pt-4 pb-2">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 1000 220" preserveAspectRatio="none">
                <defs>
                  {/* Purple Neon Gradient */}
                  <linearGradient id="plAreaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.45" />
                    <stop offset="60%" stopColor="#8B5CF6" stopOpacity="0.1" />
                    <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.0" />
                  </linearGradient>

                  <linearGradient id="plLineGradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#A78BFA" />
                    <stop offset="50%" stopColor="#8B5CF6" />
                    <stop offset="100%" stopColor="#10B981" />
                  </linearGradient>
                </defs>

                {/* Calculate coordinates */}
                {(() => {
                  const pts = summary.timeline;
                  const values = pts.map((p) => p.cumulativeNet);
                  const minVal = Math.min(0, ...values);
                  const maxVal = Math.max(100, ...values);
                  const range = maxVal - minVal || 100;

                  const getY = (val: number) => {
                    // Margin: 25px top, 35px bottom
                    const height = 160;
                    const normalized = (val - minVal) / range;
                    return 190 - normalized * height;
                  };

                  const getX = (index: number) => {
                    if (pts.length === 1) return 500;
                    return 50 + (index / (pts.length - 1)) * 900;
                  };

                  const zeroY = getY(0);

                  // SVG Polyline Path
                  const pathCoords = pts
                    .map((p, i) => `${getX(i)},${getY(p.cumulativeNet)}`)
                    .join(' L ');

                  const areaPath = `M ${getX(0)},${zeroY} L ${pathCoords} L ${getX(pts.length - 1)},${zeroY} Z`;

                  return (
                    <>
                      {/* Zero Baseline reference line */}
                      <line
                        x1="30"
                        y1={zeroY}
                        x2="970"
                        y2={zeroY}
                        stroke="#9296A8"
                        strokeWidth="1.5"
                        strokeDasharray="4 4"
                        opacity="0.3"
                      />
                      <text x="35" y={zeroY - 6} fill="#9296A8" fontSize="11" fontFamily="monospace" opacity="0.7">
                        ₹0 Neutral Line
                      </text>

                      {/* Area Fill */}
                      <path d={areaPath} fill="url(#plAreaGradient)" />

                      {/* Main Telemetry Line */}
                      <path
                        d={`M ${pathCoords}`}
                        fill="none"
                        stroke="url(#plLineGradient)"
                        strokeWidth="3.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        filter="drop-shadow(0 4px 10px rgba(139,92,246,0.5))"
                      />

                      {/* Point Nodes */}
                      {pts.map((pt, i) => {
                        const x = getX(i);
                        const y = getY(pt.cumulativeNet);
                        const isHovered = activeHoverIndex === i;
                        const isPositive = pt.cumulativeNet >= 0;

                        return (
                          <g key={pt.date} className="cursor-pointer" onMouseEnter={() => setActiveHoverIndex(i)} onMouseLeave={() => setActiveHoverIndex(null)}>
                            {/* Outer Glow Ring on Hover */}
                            {isHovered && (
                              <circle
                                cx={x}
                                cy={y}
                                r="12"
                                fill={isPositive ? '#10B981' : '#F43F5E'}
                                fillOpacity="0.3"
                                className="animate-ping"
                              />
                            )}

                            {/* Node Circle */}
                            <circle
                              cx={x}
                              cy={y}
                              r={isHovered ? 7 : 5}
                              fill="#171A2B"
                              stroke={isPositive ? '#10B981' : '#F43F5E'}
                              strokeWidth={isHovered ? '3' : '2'}
                              className="transition-all"
                            />
                          </g>
                        );
                      })}
                    </>
                  );
                })()}
              </svg>
            </div>

            {/* Hover Telemetry Card */}
            {activeHoverIndex !== null && summary.timeline[activeHoverIndex] && (
              <div className="mt-3 p-3 rounded-xl bg-[#111321] border border-[#8B5CF6]/40 flex flex-wrap items-center justify-between gap-4 shadow-lg animate-fadeIn">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#A78BFA]" />
                  <span className="text-xs font-bold text-white">
                    {summary.timeline[activeHoverIndex].displayDate} ({summary.timeline[activeHoverIndex].date})
                  </span>
                  <span className="text-[11px] text-[#9296A8]">
                    • {summary.timeline[activeHoverIndex].matchCount} match{summary.timeline[activeHoverIndex].matchCount > 1 ? 'es' : ''}
                  </span>
                </div>

                <div className="flex items-center gap-4 text-xs font-mono">
                  <div>
                    <span className="text-[#9296A8] mr-1">Prize:</span>
                    <span className="text-emerald-400 font-bold">
                      ₹{summary.timeline[activeHoverIndex].prizeMoney}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#9296A8] mr-1">Expenses:</span>
                    <span className="text-amber-400 font-bold">
                      ₹{summary.timeline[activeHoverIndex].expenses}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#9296A8] mr-1">Day Net:</span>
                    <span
                      className={`font-bold ${
                        summary.timeline[activeHoverIndex].netProfitLoss >= 0
                          ? 'text-emerald-400'
                          : 'text-rose-400'
                      }`}
                    >
                      {summary.timeline[activeHoverIndex].netProfitLoss >= 0 ? '+' : ''}
                      ₹{summary.timeline[activeHoverIndex].netProfitLoss}
                    </span>
                  </div>
                  <div className="pl-2 border-l border-[#1f233a]">
                    <span className="text-[#9296A8] mr-1">Cumulative:</span>
                    <span
                      className={`font-bold ${
                        summary.timeline[activeHoverIndex].cumulativeNet >= 0
                          ? 'text-emerald-400'
                          : 'text-rose-400'
                      }`}
                    >
                      ₹{summary.timeline[activeHoverIndex].cumulativeNet}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="py-12 text-center text-[#9296A8]">
            <p className="text-xs font-semibold">No financial telemetry points for the selected range.</p>
          </div>
        )}
      </div>

      {/* Match Financial Ledger Table (Pull each match from Match History) */}
      <div className="card-3d overflow-hidden">
        {/* Table Header Controls */}
        <div className="p-5 border-b border-[#1f233a] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-white font-heading tracking-wide">
              Match History Financial Records ({filteredMatches.length})
            </h2>
            <p className="text-xs text-[#9296A8]">
              Auto-filled match outcomes with editable prize money, entry fees, and receipts
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-[#9296A8]">Type Filter:</span>
            <div className="flex items-center gap-1 bg-[#111321] p-1 rounded-xl border border-[#1f233a]">
              {(['ALL', 'Solo', 'Duo', 'Squad'] as ('ALL' | MatchType)[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setTypeFilter(t)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    typeFilter === t
                      ? 'bg-[#8B5CF6] text-white shadow-sm'
                      : 'text-[#9296A8] hover:text-white'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Matches List */}
        {filteredMatches.length > 0 ? (
          <div className="divide-y divide-[#1f233a]">
            {filteredMatches.map((match) => {
              const net = calculateMatchNet(match);
              const isProfit = net > 0;
              const isLoss = net < 0;

              return (
                <div
                  key={match.id}
                  className="p-5 hover:bg-[#111321]/50 transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                >
                  {/* Left: Match Details & Outcome */}
                  <div className="flex items-start sm:items-center gap-3.5">
                    {/* Outcome Badge */}
                    <div
                      className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border shadow-md ${
                        match.result === 'WIN'
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                          : 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                      }`}
                    >
                      {match.result === 'WIN' ? (
                        <EsportsTrophy className="w-5 h-5" />
                      ) : (
                        <EsportsDefeat className="w-5 h-5" />
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`text-xs font-black uppercase tracking-wider ${
                            match.result === 'WIN' ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {match.result === 'WIN' ? 'BOOYAH!' : 'DEFEAT'}
                        </span>
                        <span className="cyber-tag text-[#A78BFA] border-[#8B5CF6]/30 bg-[#8B5CF6]/10">
                          {match.matchType}
                        </span>
                        {match.placement && (
                          <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-[#111321] text-[#C0C4D0] border border-[#1f233a]">
                            #{match.placement} Place
                          </span>
                        )}
                        {match.kills !== undefined && (
                          <span className="text-[11px] text-[#9296A8] font-mono">
                            {match.kills} Kills
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-xs text-[#9296A8] mt-1 font-mono">
                        <Calendar className="w-3.5 h-3.5 text-[#A78BFA]" />
                        <span>{match.matchDate}</span>
                        {match.matchTime && (
                          <>
                            <span>•</span>
                            <Clock className="w-3.5 h-3.5 text-[#A78BFA]" />
                            <span>{match.matchTime} IST</span>
                          </>
                        )}
                      </div>

                      {match.notes && (
                        <p className="text-xs text-[#C0C4D0] italic mt-1 max-w-md line-clamp-1">
                          "{match.notes}"
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Middle: Financial Auto-Filled Values */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#111321] p-3 rounded-xl border border-[#1f233a] self-stretch lg:self-auto font-mono text-xs">
                    {/* Entry Fee */}
                    <div>
                      <span className="text-[10px] uppercase font-bold text-[#9296A8] block">
                        Entry Fee
                      </span>
                      <span className="text-white font-bold">
                        ₹{match.entryFee !== undefined ? match.entryFee : 0}
                      </span>
                    </div>

                    {/* Prize Money */}
                    <div>
                      <span className="text-[10px] uppercase font-bold text-[#9296A8] block">
                        Prize Won
                      </span>
                      <span className="text-emerald-400 font-bold">
                        ₹{match.prizeMoney !== undefined ? match.prizeMoney : 0}
                      </span>
                    </div>

                    {/* Extra Expenses */}
                    <div>
                      <span className="text-[10px] uppercase font-bold text-[#9296A8] block">
                        Extra Expenses
                      </span>
                      <span className="text-amber-400 font-bold">
                        ₹{match.extraExpenses !== undefined ? match.extraExpenses : 0}
                      </span>
                    </div>

                    {/* Net Match Return */}
                    <div className="border-l border-[#1f233a] pl-2">
                      <span className="text-[10px] uppercase font-bold text-[#9296A8] block">
                        Net Profit
                      </span>
                      <span
                        className={`font-black text-sm ${
                          isProfit
                            ? 'text-emerald-400'
                            : isLoss
                            ? 'text-rose-400'
                            : 'text-[#C0C4D0]'
                        }`}
                      >
                        {isProfit ? `+₹${net}` : isLoss ? `-₹${Math.abs(net)}` : '₹0'}
                      </span>
                    </div>
                  </div>

                  {/* Right: Screenshot Proof & Edit Action */}
                  <div className="flex items-center gap-2.5 self-end lg:self-auto">
                    {/* Scorecard Screenshot if available */}
                    {match.screenshotUrl ? (
                      <button
                        onClick={() => setViewingScreenshot(match.screenshotUrl!)}
                        className="relative w-12 h-10 rounded-lg overflow-hidden border border-[#8B5CF6]/40 hover:border-[#8B5CF6] group cursor-pointer shadow-sm transition-all"
                        title="View Scorecard Screenshot"
                      >
                        <img
                          src={match.screenshotUrl}
                          alt="Proof"
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                        />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Eye className="w-3.5 h-3.5 text-white" />
                        </div>
                      </button>
                    ) : (
                      <div
                        className="w-12 h-10 rounded-lg border border-dashed border-[#1f233a] flex items-center justify-center text-[#9296A8]"
                        title="No screenshot attached"
                      >
                        <span className="text-[9px] font-mono">No Pic</span>
                      </div>
                    )}

                    {/* Edit Financials Button */}
                    <button
                      onClick={() => handleOpenEdit(match)}
                      className="btn-3d-dark px-3 py-2 text-xs flex items-center gap-1.5"
                      title="Edit Prize Money & Expenses"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-[#A78BFA]" />
                      <span>Edit P&L</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16 px-4">
            <EsportsProfit className="w-10 h-10 text-[#9296A8] mx-auto mb-3 opacity-30" />
            <h3 className="text-base font-bold text-white mb-1">No Match Records in Filter</h3>
            <p className="text-xs text-[#9296A8] max-w-sm mx-auto mb-4">
              Matches pulled from Match History will appear here automatically with auto-filled entry fee, outcome, and date.
            </p>
            <button
              onClick={onNavigateToHistory}
              className="btn-3d-purple px-4 py-2 text-xs inline-flex items-center gap-1.5"
            >
              <span>Go to Match History</span>
            </button>
          </div>
        )}
      </div>

      {/* Edit Financial Records Modal */}
      {editingMatch && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="card-3d max-w-md w-full p-6 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setEditingMatch(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-[#9296A8] hover:text-white hover:bg-[#111321] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5 mb-1">
              <div className="icon-badge-3d-purple">
                <EsportsProfit className="w-4 h-4 text-[#A78BFA]" />
              </div>
              <h2 className="text-lg font-bold text-white font-heading tracking-wide">
                Update Match Financials
              </h2>
            </div>
            <p className="text-xs text-[#9296A8] mb-4">
              {editingMatch.matchType} Match on {editingMatch.matchDate} • Result:{' '}
              <span className={editingMatch.result === 'WIN' ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                {editingMatch.result === 'WIN' ? 'BOOYAH!' : 'DEFEAT'}
              </span>
            </p>

            {saveError && (
              <div className="mb-4 p-3 rounded-xl bg-red-950/40 border border-red-500/40 text-red-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{saveError}</span>
              </div>
            )}

            <form onSubmit={handleSaveFinances} className="space-y-4">
              {/* 1. Entry Fee (₹) */}
              <div>
                <label className="block text-xs font-semibold uppercase text-[#C0C4D0] mb-1">
                  Entry Fee (INR ₹)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-sm text-[#9296A8] font-mono">₹</span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={editEntryFee}
                    onChange={(e) => setEditEntryFee(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="0"
                    className="w-full bg-[#111321] border border-[#1f233a] focus:border-[#8B5CF6] rounded-xl pl-8 pr-3 py-2 text-sm text-white font-mono outline-none"
                  />
                </div>
                <span className="text-[10px] text-[#9296A8] mt-0.5 block">
                  Match slot or registration fee paid.
                </span>
              </div>

              {/* 2. Actual Prize Money Received (₹) */}
              <div>
                <label className="block text-xs font-semibold uppercase text-[#C0C4D0] mb-1 flex items-center justify-between">
                  <span>Prize Money Received (INR ₹)</span>
                  {editingMatch.result === 'WIN' && (
                    <span className="text-[10px] text-emerald-400 font-mono">Winner Pool</span>
                  )}
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-sm text-emerald-400 font-mono">₹</span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={editPrizeMoney}
                    onChange={(e) => setEditPrizeMoney(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="0"
                    className="w-full bg-[#111321] border border-[#1f233a] focus:border-emerald-500 rounded-xl pl-8 pr-3 py-2 text-sm text-white font-mono outline-none"
                  />
                </div>
                <span className="text-[10px] text-[#9296A8] mt-0.5 block">
                  Actual prize money received into bank/team fund for this match.
                </span>
              </div>

              {/* 3. Optional Extra Expenses (₹) */}
              <div>
                <label className="block text-xs font-semibold uppercase text-[#C0C4D0] mb-1">
                  Optional Extra Expenses (INR ₹)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-sm text-amber-400 font-mono">₹</span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={editExtraExpenses}
                    onChange={(e) => setEditExtraExpenses(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="0"
                    className="w-full bg-[#111321] border border-[#1f233a] focus:border-amber-500 rounded-xl pl-8 pr-3 py-2 text-sm text-white font-mono outline-none"
                  />
                </div>
              </div>

              {/* 4. Expense Notes */}
              <div>
                <label className="block text-xs font-semibold uppercase text-[#C0C4D0] mb-1">
                  Expense Note <span className="text-[#9296A8] font-normal lowercase">(optional)</span>
                </label>
                <input
                  type="text"
                  value={editExpenseNotes}
                  onChange={(e) => setEditExpenseNotes(e.target.value)}
                  placeholder="e.g. Sub player compensation, custom room pass"
                  className="w-full bg-[#111321] border border-[#1f233a] focus:border-[#8B5CF6] rounded-xl px-3 py-2 text-xs text-white outline-none"
                />
              </div>

              {/* Live Net Calculation Preview */}
              <div className="p-3.5 rounded-xl bg-[#111321] border border-[#1f233a] flex items-center justify-between">
                <div>
                  <span className="text-[11px] uppercase font-bold text-[#9296A8] block">
                    Calculated Net Return
                  </span>
                  <span className="text-[10px] text-[#C0C4D0]">
                    Prize (₹{editPrizeMoney || 0}) - Entry (₹{editEntryFee || 0}) - Extra (₹{editExtraExpenses || 0})
                  </span>
                </div>

                <div className="text-right">
                  <span
                    className={`text-lg font-black font-mono ${
                      modalPreviewNet > 0
                        ? 'text-emerald-400'
                        : modalPreviewNet < 0
                        ? 'text-rose-400'
                        : 'text-white'
                    }`}
                  >
                    {modalPreviewNet > 0
                      ? `+₹${modalPreviewNet}`
                      : modalPreviewNet < 0
                      ? `-₹${Math.abs(modalPreviewNet)}`
                      : '₹0'}
                  </span>
                  <span className="text-[10px] block text-[#9296A8] uppercase font-bold">
                    {modalPreviewNet > 0 ? 'Profit' : modalPreviewNet < 0 ? 'Loss' : 'Even'}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#1f233a]">
                <button
                  type="button"
                  onClick={() => setEditingMatch(null)}
                  className="btn-3d-dark px-4 py-2 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-3d-purple px-5 py-2 text-xs disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Financials'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Screenshot Proof Viewer Modal */}
      {viewingScreenshot && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="card-3d max-w-2xl w-full p-4 relative">
            <button
              onClick={() => setViewingScreenshot(null)}
              className="absolute top-4 right-4 p-2 rounded-xl bg-black/60 text-white hover:bg-black transition-colors z-10"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-sm font-bold text-white mb-2">Verified Scorecard Screenshot Proof</h3>
            <div className="max-h-[75vh] overflow-auto rounded-xl border border-[#1f233a] bg-black flex items-center justify-center">
              <img src={viewingScreenshot} alt="Scorecard proof" className="max-w-full max-h-[70vh] object-contain" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
