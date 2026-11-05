import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  Plus,
  ArrowUpRight,
  ExternalLink,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Sparkles,
} from 'lucide-react';
import {
  EsportsTrophy,
  EsportsSwords,
  EsportsTelemetry,
  EsportsDefeat,
  EsportsScan,
  EsportsWhatsApp,
  EsportsProfit,
} from './EsportsIcons';
import { User, MatchSchedule, MatchResult, PerformanceMetrics } from '../types';
import { getMatchCountdown, calculatePerformanceMetrics } from '../utils/analytics';

interface DashboardViewProps {
  user: User;
  matches: MatchSchedule[];
  results: MatchResult[];
  onNavigate: (tab: string) => void;
  onOpenCreateMatch: () => void;
  onOpenAddResult: () => void;
  onOpenOcr: () => void;
  onSelectMatch: (match: MatchSchedule) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  user,
  matches,
  results,
  onNavigate,
  onOpenCreateMatch,
  onOpenAddResult,
  onOpenOcr,
  onSelectMatch,
}) => {
  // Real-time ticking timer for countdown
  const [, setTicker] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setTicker((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Compute actual metrics from real saved results
  const metrics: PerformanceMetrics = calculatePerformanceMetrics(results, 'all');

  // Find next upcoming match
  const upcomingMatches = matches
    .filter((m) => !m.isCompleted)
    .sort((a, b) => {
      const cmp = a.matchDate.localeCompare(b.matchDate);
      if (cmp !== 0) return cmp;
      return a.matchTime.localeCompare(b.matchTime);
    });

  const nextMatch = upcomingMatches.length > 0 ? upcomingMatches[0] : null;
  const nextMatchCountdown = nextMatch
    ? getMatchCountdown(nextMatch.matchDate, nextMatch.matchTime)
    : null;

  // Recent 4 results
  const recentResults = [...results]
    .sort((a, b) => {
      const cmp = b.matchDate.localeCompare(a.matchDate);
      if (cmp !== 0) return cmp;
      return (b.matchTime || '').localeCompare(a.matchTime || '');
    })
    .slice(0, 4);

  return (
    <div className="space-y-6 pb-12">
      {/* 3D Hero Welcome Banner */}
      <div className="relative rounded-2xl overflow-hidden card-3d p-6 sm:p-8 relative">
        {/* Ambient background graphics */}
        <div className="absolute right-0 top-0 bottom-0 w-1/2 bg-[radial-gradient(ellipse_at_top_right,rgba(139,92,246,0.18),transparent_70%)] pointer-events-none" />
        <div className="absolute -right-8 -bottom-8 w-56 h-56 bg-[#8B5CF6]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#8B5CF6]/40 to-transparent pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#8B5CF6]/15 border border-[#8B5CF6]/30 text-xs font-semibold text-[#A78BFA] shadow-[0_0_12px_rgba(139,92,246,0.2)]">
              <Sparkles className="w-3.5 h-3.5 text-[#A78BFA]" />
              <span className="font-sub tracking-wider uppercase">Free Fire Command Center</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold font-heading text-white tracking-wide drop-shadow-md">
              WELCOME BACK,{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-[#C0C4D0] to-[#A78BFA] text-glow">
                {user.ign ? user.ign.toUpperCase() : user.fullName.toUpperCase()}
              </span>
            </h1>
            <p className="text-sm text-[#9296A8] max-w-xl font-sub">
              Your personal combat telemetry, upcoming scrims schedule, and live performance tracking.
              Current combat role:{' '}
              <span className="text-white font-semibold tracking-wide px-2 py-0.5 rounded bg-[#111321] border border-[#1f233a] inline-block ml-1">
                {user.role || 'Rusher'}
              </span>
            </p>
          </div>

          {/* 3D Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
            <button
              onClick={onOpenCreateMatch}
              className="px-4 py-2.5 rounded-xl btn-3d-purple text-white font-semibold text-xs sm:text-sm flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Schedule Match</span>
            </button>
            <button
              onClick={onOpenOcr}
              className="px-4 py-2.5 rounded-xl btn-3d-dark border border-[#8B5CF6]/40 text-[#A78BFA] hover:text-white font-semibold text-xs sm:text-sm flex items-center gap-2 cursor-pointer"
            >
              <EsportsScan className="w-4 h-4 text-[#A78BFA]" />
              <span>Scan Screenshot</span>
            </button>
            <button
              onClick={onOpenAddResult}
              className="px-4 py-2.5 rounded-xl btn-3d-dark text-[#C0C4D0] hover:text-white font-semibold text-xs sm:text-sm flex items-center gap-2 cursor-pointer"
            >
              <EsportsTrophy className="w-4 h-4 text-amber-400" />
              <span>Log Result</span>
            </button>
            <button
              onClick={() => onNavigate('profit-loss')}
              className="px-4 py-2.5 rounded-xl btn-3d-dark border border-emerald-500/40 text-emerald-400 hover:text-white font-semibold text-xs sm:text-sm flex items-center gap-2 cursor-pointer"
            >
              <EsportsProfit className="w-4 h-4 text-emerald-400" />
              <span>Profit & Loss</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main 3D KPI Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
        {/* Total Matches */}
        <div className="card-3d rounded-2xl p-4 sm:p-5 group relative overflow-hidden">
          <div className="flex items-center justify-between text-[#9296A8] mb-2.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#C0C4D0]">Total Matches</span>
            <div className="w-9 h-9 rounded-xl icon-badge-3d-purple flex items-center justify-center text-[#A78BFA] group-hover:scale-105 transition-transform">
              <EsportsSwords className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold font-heading text-white tracking-tight">
              {metrics.totalMatches}
            </span>
            <span className="text-xs text-[#9296A8] font-mono">played</span>
          </div>
          <div className="mt-3 text-[11px] text-[#9296A8] flex items-center justify-between pt-2.5 border-t border-[#1f233a]">
            <span className="font-mono">Solo: <strong className="text-white">{metrics.soloStats.matches}</strong></span>
            <span className="font-mono">Duo: <strong className="text-white">{metrics.duoStats.matches}</strong></span>
            <span className="font-mono">Squad: <strong className="text-white">{metrics.squadStats.matches}</strong></span>
          </div>
        </div>

        {/* Total Wins */}
        <div className="card-3d rounded-2xl p-4 sm:p-5 group relative overflow-hidden">
          <div className="flex items-center justify-between text-[#9296A8] mb-2.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">Total Wins</span>
            <div className="w-9 h-9 rounded-xl icon-badge-3d-emerald flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
              <EsportsTrophy className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold font-heading text-emerald-400 tracking-tight">
              {metrics.totalWins}
            </span>
            <span className="text-xs text-[#9296A8] font-mono">victories</span>
          </div>
          <div className="mt-3 text-[11px] text-[#9296A8] flex items-center gap-1.5 pt-2.5 border-t border-[#1f233a]">
            <span className="text-emerald-400 font-semibold font-mono">{metrics.winStreak} streak</span>
            <span>current winning run</span>
          </div>
        </div>

        {/* Total Losses */}
        <div className="card-3d rounded-2xl p-4 sm:p-5 group relative overflow-hidden">
          <div className="flex items-center justify-between text-[#9296A8] mb-2.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-rose-400">Total Losses</span>
            <div className="w-9 h-9 rounded-xl icon-badge-3d-rose flex items-center justify-center text-rose-400 group-hover:scale-105 transition-transform">
              <EsportsDefeat className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold font-heading text-rose-400 tracking-tight">
              {metrics.totalLosses}
            </span>
            <span className="text-xs text-[#9296A8] font-mono">defeats</span>
          </div>
          <div className="mt-3 text-[11px] text-[#9296A8] flex items-center gap-1.5 pt-2.5 border-t border-[#1f233a]">
            <span>Defeat ratio:</span>
            <span className="text-white font-medium font-mono">
              {metrics.totalMatches > 0 ? 100 - metrics.winRate : 0}%
            </span>
          </div>
        </div>

        {/* Win Rate */}
        <div className="card-3d rounded-2xl p-4 sm:p-5 group relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#8B5CF6]/15 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between text-[#9296A8] mb-2.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#A78BFA]">Win Rate</span>
            <div className="w-9 h-9 rounded-xl icon-badge-3d-purple flex items-center justify-center text-[#A78BFA] group-hover:scale-105 transition-transform">
              <EsportsTelemetry className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl sm:text-3xl font-extrabold font-heading text-white tracking-tight">
              {metrics.winRate}%
            </span>
          </div>
          <div className="mt-3 pt-2.5 border-t border-[#1f233a]">
            <div className="w-full bg-[#111321] rounded-full h-2 overflow-hidden p-0.5 border border-[#1f233a]">
              <div
                className="bg-gradient-to-r from-[#8B5CF6] via-[#A78BFA] to-white h-full rounded-full transition-all duration-500 shadow-[0_0_10px_#8B5CF6]"
                style={{ width: `${metrics.winRate}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Center Section: Next Match Countdown + Performance Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Next Match Live Countdown (1 col on large screens) */}
        <div className="card-3d rounded-2xl p-6 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#8B5CF6]/12 rounded-full blur-2xl pointer-events-none" />

          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#A78BFA]" />
                <h3 className="text-xs uppercase tracking-wider font-bold text-[#C0C4D0]">
                  Next Match Countdown
                </h3>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#111321] border border-[#1f233a] text-[#9296A8] font-mono">
                IST Time
              </span>
            </div>

            {nextMatch ? (
              <div className="space-y-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-[#8B5CF6]/20 text-[#A78BFA] border border-[#8B5CF6]/30">
                      {nextMatch.matchType}
                    </span>
                    <h4 className="text-base font-bold text-white truncate">
                      {nextMatch.name || `${nextMatch.matchType} Esports Match`}
                    </h4>
                  </div>
                  <p className="text-xs text-[#9296A8] mt-1.5 flex items-center gap-1.5 font-mono">
                    <Calendar className="w-3.5 h-3.5 text-[#A78BFA]" />
                    <span>{nextMatch.matchDate}</span>
                    <span>•</span>
                    <Clock className="w-3.5 h-3.5 text-[#A78BFA]" />
                    <span>{nextMatch.matchTime} IST</span>
                  </p>
                </div>

                {/* 3D Segmented Countdown Display */}
                <div className="p-4 rounded-xl bg-[#111321]/90 border border-[#1f233a] shadow-inner">
                  <p className="text-[10px] text-[#9296A8] uppercase tracking-wider font-semibold mb-2 flex items-center justify-between">
                    <span>Starts In</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  </p>
                  <div className="grid grid-cols-3 gap-2.5 text-center font-mono">
                    <div className="bg-[#171A2B] p-2.5 rounded-xl border border-[#1f233a] shadow-sm">
                      <span className="block text-xl font-extrabold text-white">
                        {String((nextMatchCountdown?.days || 0) * 24 + (nextMatchCountdown?.hours || 0)).padStart(2, '0')}
                      </span>
                      <span className="text-[10px] text-[#9296A8] uppercase tracking-wider">Hours</span>
                    </div>
                    <div className="bg-[#171A2B] p-2.5 rounded-xl border border-[#1f233a] shadow-sm">
                      <span className="block text-xl font-extrabold text-white">
                        {String(nextMatchCountdown?.minutes || 0).padStart(2, '0')}
                      </span>
                      <span className="text-[10px] text-[#9296A8] uppercase tracking-wider">Mins</span>
                    </div>
                    <div className="bg-[#171A2B] p-2.5 rounded-xl border border-[#8B5CF6]/30 shadow-sm bg-[#8B5CF6]/10">
                      <span className="block text-xl font-extrabold text-[#A78BFA] text-glow">
                        {String(nextMatchCountdown?.seconds || 0).padStart(2, '0')}
                      </span>
                      <span className="text-[10px] text-[#A78BFA] uppercase tracking-wider">Secs</span>
                    </div>
                  </div>
                </div>

                {/* WhatsApp Group Link if assigned */}
                {nextMatch.whatsappUrl && (
                  <a
                    href={nextMatch.whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2.5 px-3 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 font-semibold text-xs flex items-center justify-center gap-2 transition-all shadow-sm"
                  >
                    <EsportsWhatsApp className="w-4 h-4 text-emerald-400" />
                    <span>Join WhatsApp Group</span>
                    <ExternalLink className="w-3.5 h-3.5 ml-auto opacity-70" />
                  </a>
                )}
              </div>
            ) : (
              <div className="text-center py-8 space-y-3">
                <div className="w-12 h-12 mx-auto rounded-xl icon-badge-3d flex items-center justify-center text-[#9296A8]">
                  <Calendar className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">No upcoming matches</p>
                  <p className="text-xs text-[#9296A8] mt-0.5">Plan your next scrim or tournament round.</p>
                </div>
                <button
                  onClick={onOpenCreateMatch}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl btn-3d-dark text-[#A78BFA] text-xs font-semibold cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create Schedule</span>
                </button>
              </div>
            )}
          </div>

          <div className="mt-4 pt-4 border-t border-[#1f233a] flex items-center justify-between text-xs">
            <span className="text-[#9296A8]">Active Schedules: {upcomingMatches.length}</span>
            <button
              onClick={() => onNavigate('planner')}
              className="text-[#A78BFA] hover:text-white font-semibold flex items-center gap-1 cursor-pointer transition-colors"
            >
              <span>View Planner</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Performance Overview & Recent Matches (2 cols on large screens) */}
        <div className="lg:col-span-2 card-3d rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xs uppercase tracking-wider font-bold text-[#C0C4D0]">
                  Performance Overview
                </h3>
                <p className="text-xs text-[#9296A8] mt-0.5">
                  Actual results tracking with verified Booyah record
                </p>
              </div>
              <button
                onClick={() => onNavigate('analytics')}
                className="text-xs text-[#A78BFA] hover:text-white font-semibold flex items-center gap-1 cursor-pointer transition-colors"
              >
                <span>Full Analytics</span>
                <ArrowUpRight className="w-4 h-4" />
              </button>
            </div>

            {/* Recent Form Pills */}
            <div className="p-3.5 rounded-xl bg-[#111321] border border-[#1f233a] mb-5 flex flex-wrap items-center justify-between gap-3 shadow-inner">
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#9296A8] font-medium">Recent Form (Last 5):</span>
                {metrics.currentForm.length > 0 ? (
                  <div className="flex items-center gap-1.5">
                    {metrics.currentForm.map((res, i) => (
                      <span
                        key={i}
                        className={`w-6 h-6 rounded-lg text-[10px] font-bold flex items-center justify-center font-mono shadow-sm ${
                          res === 'WIN'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                        }`}
                      >
                        {res === 'WIN' ? 'W' : 'L'}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-xs text-[#9296A8] italic">No matches logged yet</span>
                )}
              </div>
              <div className="text-xs text-[#C0C4D0]">
                Insight:{' '}
                <span className="text-[#A78BFA] font-medium">
                  {metrics.comparison.insightDetail}
                </span>
              </div>
            </div>

            {/* Recent Match Records List */}
            <h4 className="text-xs uppercase tracking-wider font-bold text-[#9296A8] mb-3">
              Recent Match Results
            </h4>

            {recentResults.length > 0 ? (
              <div className="space-y-2.5">
                {recentResults.map((item) => (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-xl bg-[#111321]/80 border border-[#1f233a] hover:border-[#8B5CF6]/40 hover:bg-[#111321] flex items-center justify-between transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                          item.result === 'WIN'
                            ? 'icon-badge-3d-emerald text-emerald-400'
                            : 'icon-badge-3d-rose text-rose-400'
                        }`}
                      >
                        {item.result === 'WIN' ? (
                          <EsportsTrophy className="w-4 h-4" />
                        ) : (
                          <EsportsDefeat className="w-4 h-4" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-xs font-bold font-heading ${
                              item.result === 'WIN' ? 'text-emerald-400' : 'text-rose-400'
                            }`}
                          >
                            {item.result === 'WIN' ? 'BOOYAH! (WIN)' : 'DEFEAT (LOSS)'}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded-md bg-[#171A2B] text-[#C0C4D0] border border-[#1f233a] font-mono">
                            {item.matchType}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#9296A8] font-mono mt-0.5">
                          {item.matchDate} {item.matchTime ? `• ${item.matchTime} IST` : ''}
                          {item.kills !== undefined && item.kills !== null ? ` • ${item.kills} Kills` : ''}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      {item.placement ? (
                        <span className="text-xs font-mono font-bold text-white px-2 py-1 rounded bg-[#171A2B] border border-[#1f233a]">
                          #{item.placement} Place
                        </span>
                      ) : (
                        <span className="text-xs text-[#9296A8]">Verified</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 rounded-xl bg-[#111321] border border-dashed border-[#1f233a] space-y-2">
                <EsportsTrophy className="w-8 h-8 text-[#9296A8]/40 mx-auto" />
                <p className="text-xs font-semibold text-white">No match results yet</p>
                <p className="text-[11px] text-[#9296A8] max-w-sm mx-auto">
                  Add your Free Fire match results manually or scan a scorecard screenshot to begin tracking.
                </p>
                <div className="pt-2 flex justify-center gap-2">
                  <button
                    onClick={onOpenAddResult}
                    className="px-3.5 py-1.5 rounded-xl btn-3d-purple text-white text-xs font-medium cursor-pointer"
                  >
                    Add Result
                  </button>
                  <button
                    onClick={onOpenOcr}
                    className="px-3.5 py-1.5 rounded-xl btn-3d-dark text-[#C0C4D0] hover:text-white text-xs font-medium cursor-pointer"
                  >
                    Scan Screenshot
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="mt-4 pt-4 border-t border-[#1f233a] flex items-center justify-between text-xs text-[#9296A8]">
            <span>Total recorded matches: {results.length}</span>
            <button
              onClick={() => onNavigate('history')}
              className="text-[#A78BFA] hover:text-white font-semibold flex items-center gap-1 cursor-pointer transition-colors"
            >
              <span>Manage Match History</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
