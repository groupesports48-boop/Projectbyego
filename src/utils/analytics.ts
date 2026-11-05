import {
  MatchResult,
  PeriodFilter,
  PerformanceMetrics,
  PerformanceComparison,
  DailyPerformancePoint,
  MatchType,
} from '../types';

/**
 * Calculates percentage safely without division by zero.
 */
export function calculateWinRate(wins: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((wins / total) * 100);
}

/**
 * Formats a Date object or ISO string to IST YYYY-MM-DD
 */
export function getISTDateString(date: Date = new Date()): string {
  // Convert UTC to IST (+5:30)
  const istOffsetMs = 5.5 * 60 * 60 * 1000;
  const istDate = new Date(date.getTime() + istOffsetMs);
  return istDate.toISOString().split('T')[0];
}

/**
 * Returns current IST time string in HH:MM format
 */
export function getISTTimeString(date: Date = new Date()): string {
  const istOffsetMs = 5.5 * 60 * 60 * 1000;
  const istDate = new Date(date.getTime() + istOffsetMs);
  const hours = String(istDate.getUTCHours()).padStart(2, '0');
  const minutes = String(istDate.getUTCMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * Checks if a YYYY-MM-DD is today in IST
 */
export function isTodayIST(dateStr: string): boolean {
  return dateStr === getISTDateString();
}

/**
 * Checks if a YYYY-MM-DD is tomorrow in IST
 */
export function isTomorrowIST(dateStr: string): boolean {
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
  return dateStr === getISTDateString(tomorrow);
}

/**
 * Calculates countdown from now to target match date and time in IST.
 * matchTime format: 'HH:MM' (24-hour IST)
 */
export function getMatchCountdown(matchDate: string, matchTime: string): {
  totalSeconds: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isPast: boolean;
  formatted: string;
} {
  try {
    const [hours, minutes] = (matchTime || '00:00').split(':').map(Number);
    // Parse matchDate as IST (UTC+5:30)
    const [y, m, d] = matchDate.split('-').map(Number);
    // UTC timestamp for the IST target:
    const targetUtcMs = Date.UTC(y, m - 1, d, hours - 5, minutes - 30, 0);
    const nowUtcMs = Date.now();
    const diffMs = targetUtcMs - nowUtcMs;

    if (diffMs <= 0) {
      return {
        totalSeconds: 0,
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
        isPast: true,
        formatted: 'Started / Completed',
      };
    }

    const totalSeconds = Math.floor(diffMs / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const remHours = Math.floor((totalSeconds % 86400) / 3600);
    const remMins = Math.floor((totalSeconds % 3600) / 60);
    const remSecs = totalSeconds % 60;

    let formatted = '';
    if (days > 0) formatted += `${days}d `;
    formatted += `${String(remHours).padStart(2, '0')}h ${String(remMins).padStart(2, '0')}m ${String(remSecs).padStart(2, '0')}s`;

    return {
      totalSeconds,
      days,
      hours: remHours,
      minutes: remMins,
      seconds: remSecs,
      isPast: false,
      formatted: formatted.trim(),
    };
  } catch {
    return {
      totalSeconds: 0,
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      isPast: true,
      formatted: '--:--',
    };
  }
}

/**
 * Returns day count for PeriodFilter
 */
export function getPeriodDays(period: PeriodFilter): number {
  switch (period) {
    case '7d':
      return 7;
    case '15d':
      return 15;
    case '30d':
      return 30;
    case '90d':
      return 90;
    case 'all':
      return 3650; // Large number for all time
  }
}

/**
 * Filters match results into the selected period and previous comparison period.
 * All comparisons are strictly based on actual confirmed match results.
 */
export function segmentResultsByPeriod(
  results: MatchResult[],
  period: PeriodFilter,
  referenceDate: Date = new Date()
): { currentPeriodResults: MatchResult[]; previousPeriodResults: MatchResult[] } {
  if (results.length === 0) {
    return { currentPeriodResults: [], previousPeriodResults: [] };
  }

  // Sort by matchDate ascending, then createdAt ascending
  const sorted = [...results].sort((a, b) => {
    const cmp = a.matchDate.localeCompare(b.matchDate);
    if (cmp !== 0) return cmp;
    return (a.matchTime || '').localeCompare(b.matchTime || '');
  });

  if (period === 'all') {
    // For 'all' time, current period is ALL matches
    const mid = Math.floor(sorted.length / 2);
    return {
      currentPeriodResults: sorted,
      // For comparison baseline in 'all' time, use the first half of matches (if >= 2)
      previousPeriodResults: sorted.length >= 2 ? sorted.slice(0, mid) : [],
    };
  }

  const days = getPeriodDays(period);
  const refMs = referenceDate.getTime();
  const dayMs = 24 * 60 * 60 * 1000;

  const currentCutoffMs = refMs - days * dayMs;
  const prevCutoffMs = refMs - days * 2 * dayMs;

  const currentPeriodResults: MatchResult[] = [];
  const previousPeriodResults: MatchResult[] = [];

  for (const item of sorted) {
    const itemDate = new Date(item.matchDate + 'T00:00:00Z').getTime();
    if (itemDate >= currentCutoffMs && itemDate <= refMs + dayMs) {
      currentPeriodResults.push(item);
    } else if (itemDate >= prevCutoffMs && itemDate < currentCutoffMs) {
      previousPeriodResults.push(item);
    }
  }

  return { currentPeriodResults, previousPeriodResults };
}

/**
 * Computes type-specific stats (Solo / Duo / Squad)
 */
function computeTypeStats(results: MatchResult[], type: MatchType) {
  const filtered = results.filter((r) => r.matchType === type);
  const total = filtered.length;
  const wins = filtered.filter((r) => r.result === 'WIN').length;
  const losses = total - wins;
  return {
    matches: total,
    wins,
    losses,
    winRate: calculateWinRate(wins, total),
  };
}

/**
 * Calculates full performance metrics including:
 * - Current period stats
 * - Previous period comparison
 * - Daily trend with cumulative score (+1 win, -1 loss)
 * - Insights
 */
export function calculatePerformanceMetrics(
  allResults: MatchResult[],
  period: PeriodFilter = 'all',
  referenceDate: Date = new Date()
): PerformanceMetrics {
  const { currentPeriodResults, previousPeriodResults } = segmentResultsByPeriod(
    allResults,
    period,
    referenceDate
  );

  const totalMatches = currentPeriodResults.length;
  const totalWins = currentPeriodResults.filter((r) => r.result === 'WIN').length;
  const totalLosses = totalMatches - totalWins;
  const winRate = calculateWinRate(totalWins, totalMatches);

  // Win Streak (consecutive wins looking backwards from most recent match)
  let winStreak = 0;
  for (let i = currentPeriodResults.length - 1; i >= 0; i--) {
    if (currentPeriodResults[i].result === 'WIN') {
      winStreak++;
    } else {
      break;
    }
  }

  // Current Form: last 5 matches
  const currentForm = currentPeriodResults.slice(-5).map((r) => r.result);

  // Type Stats
  const soloStats = computeTypeStats(currentPeriodResults, 'Solo');
  const duoStats = computeTypeStats(currentPeriodResults, 'Duo');
  const squadStats = computeTypeStats(currentPeriodResults, 'Squad');

  // Previous period stats
  const prevMatches = previousPeriodResults.length;
  const prevWins = previousPeriodResults.filter((r) => r.result === 'WIN').length;
  const prevLosses = prevMatches - prevWins;
  const prevWinRate = calculateWinRate(prevWins, prevMatches);

  const matchesDiff = totalMatches - prevMatches;
  const winsDiff = totalWins - prevWins;
  const lossesDiff = totalLosses - prevLosses;
  const winRateDiff = winRate - prevWinRate;

  // Insight formulation
  let insight: 'improved' | 'declined' | 'stable' = 'stable';
  let insightDetail = 'Performance remained stable.';

  if (totalMatches === 0) {
    insight = 'stable';
    insightDetail = 'No matches recorded in this period.';
  } else if (prevMatches === 0) {
    insight = winRate >= 50 ? 'improved' : 'stable';
    insightDetail = `Initial record: ${totalMatches} match${totalMatches > 1 ? 'es' : ''} with ${winRate}% win rate.`;
  } else {
    if (winRateDiff > 5 || (winRateDiff >= 0 && winsDiff > lossesDiff)) {
      insight = 'improved';
      insightDetail = `Win rate increased by ${Math.abs(winRateDiff)}% compared to the previous period.`;
    } else if (winRateDiff < -5 || (winRateDiff <= 0 && lossesDiff > winsDiff)) {
      insight = 'declined';
      insightDetail = `Win rate decreased by ${Math.abs(winRateDiff)}% compared to the previous period.`;
    } else {
      insight = 'stable';
      insightDetail = `Win rate remained consistent (${winRate}% vs ${prevWinRate}% prior).`;
    }
  }

  const comparison: PerformanceComparison = {
    prevMatches,
    prevWins,
    prevLosses,
    prevWinRate,
    matchesDiff,
    winsDiff,
    lossesDiff,
    winRateDiff,
    insight,
    insightDetail,
  };

  // Group by day for the interactive daily performance graph
  // A WIN positively affects cumulative trend (+1), a LOSS negatively (-1)
  const dailyMap = new Map<string, MatchResult[]>();
  for (const item of currentPeriodResults) {
    const list = dailyMap.get(item.matchDate) || [];
    list.push(item);
    dailyMap.set(item.matchDate, list);
  }

  const sortedDates = Array.from(dailyMap.keys()).sort();
  let runningCumulativeScore = 0;
  let runningWins = 0;
  let runningMatches = 0;

  const dailyTrend: DailyPerformancePoint[] = sortedDates.map((date) => {
    const dayMatches = dailyMap.get(date)!;
    const dayWins = dayMatches.filter((m) => m.result === 'WIN').length;
    const dayLosses = dayMatches.length - dayWins;

    // +1 for WIN, -1 for LOSS
    const dayNet = dayWins - dayLosses;
    runningCumulativeScore += dayNet;
    runningWins += dayWins;
    runningMatches += dayMatches.length;

    // Format display date (e.g., Nov 4)
    const [, m, d] = date.split('-').map(Number);
    const dateObj = new Date(Date.UTC(2026, m - 1, d));
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const displayDate = `${monthNames[m - 1]} ${d}`;

    return {
      date,
      displayDate,
      wins: dayWins,
      losses: dayLosses,
      total: dayMatches.length,
      winRate: calculateWinRate(runningWins, runningMatches),
      cumulativeScore: runningCumulativeScore,
      matches: dayMatches,
    };
  });

  return {
    totalMatches,
    totalWins,
    totalLosses,
    winRate,
    winStreak,
    currentForm,
    soloStats,
    duoStats,
    squadStats,
    dailyTrend,
    comparison,
  };
}
