import { MatchResult, ProfitLossPeriodFilter, ProfitLossSummary, ProfitLossTimelinePoint } from '../types';

/**
 * Calculates net profit or loss for an individual match.
 * Formula: Net = Prize Money - Entry Fee - Extra Expenses
 */
export function calculateMatchNet(match: {
  prizeMoney?: number;
  entryFee?: number;
  extraExpenses?: number;
}): number {
  const prize = Math.max(0, Number(match.prizeMoney) || 0);
  const entry = Math.max(0, Number(match.entryFee) || 0);
  const extra = Math.max(0, Number(match.extraExpenses) || 0);
  return prize - (entry + extra);
}

/**
 * Filters match history by the requested profit & loss time horizon:
 * 15 days, 20 days, 25 days, 30 days, or all time.
 */
export function filterMatchesByProfitLossPeriod(
  matches: MatchResult[],
  period: ProfitLossPeriodFilter,
  referenceDate: Date = new Date()
): MatchResult[] {
  if (period === 'all') {
    return [...matches].sort((a, b) => (b.matchDate > a.matchDate ? 1 : -1));
  }

  const daysMap: Record<'15d' | '20d' | '25d' | '30d', number> = {
    '15d': 15,
    '20d': 20,
    '25d': 25,
    '30d': 30,
  };

  const days = daysMap[period] ?? 30;
  const cutoff = new Date(referenceDate);
  cutoff.setHours(0, 0, 0, 0);
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffStr = cutoff.toISOString().slice(0, 10);

  return matches
    .filter((m) => m.matchDate >= cutoffStr)
    .sort((a, b) => (b.matchDate > a.matchDate ? 1 : -1));
}

/**
 * Computes aggregated financial metrics, ROI, and chronological timeline points
 * for accurate P&L graph rendering.
 */
export function calculateProfitLossSummary(matches: MatchResult[]): ProfitLossSummary {
  let totalPrizeMoney = 0;
  let totalEntryFees = 0;
  let totalExtraExpenses = 0;
  let profitMatchesCount = 0;
  let lossMatchesCount = 0;
  let breakEvenMatchesCount = 0;

  for (const m of matches) {
    const prize = Math.max(0, Number(m.prizeMoney) || 0);
    const entry = Math.max(0, Number(m.entryFee) || 0);
    const extra = Math.max(0, Number(m.extraExpenses) || 0);
    const net = prize - (entry + extra);

    totalPrizeMoney += prize;
    totalEntryFees += entry;
    totalExtraExpenses += extra;

    if (net > 0) {
      profitMatchesCount++;
    } else if (net < 0) {
      lossMatchesCount++;
    } else {
      breakEvenMatchesCount++;
    }
  }

  const totalExpenses = totalEntryFees + totalExtraExpenses;
  const netProfitLoss = totalPrizeMoney - totalExpenses;
  const roi = totalExpenses > 0 ? (netProfitLoss / totalExpenses) * 100 : 0;

  // Build chronological timeline points (sorted ascending by date)
  const sortedAsc = [...matches].sort((a, b) => {
    if (a.matchDate !== b.matchDate) {
      return a.matchDate.localeCompare(b.matchDate);
    }
    return (a.matchTime || '').localeCompare(b.matchTime || '');
  });

  const dateGroups: Record<string, MatchResult[]> = {};
  for (const m of sortedAsc) {
    if (!dateGroups[m.matchDate]) {
      dateGroups[m.matchDate] = [];
    }
    dateGroups[m.matchDate].push(m);
  }

  let runningCumulativeNet = 0;
  const timeline: ProfitLossTimelinePoint[] = [];

  for (const [date, dayMatches] of Object.entries(dateGroups)) {
    let dayPrize = 0;
    let dayExpenses = 0;

    for (const dm of dayMatches) {
      const p = Math.max(0, Number(dm.prizeMoney) || 0);
      const e = (Math.max(0, Number(dm.entryFee) || 0)) + (Math.max(0, Number(dm.extraExpenses) || 0));
      dayPrize += p;
      dayExpenses += e;
    }

    const dayNet = dayPrize - dayExpenses;
    runningCumulativeNet += dayNet;

    // e.g. "Nov 5"
    let displayDate = date;
    try {
      const parsed = new Date(date + 'T00:00:00');
      displayDate = parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch {
      displayDate = date;
    }

    timeline.push({
      date,
      displayDate,
      prizeMoney: dayPrize,
      expenses: dayExpenses,
      netProfitLoss: dayNet,
      cumulativeNet: runningCumulativeNet,
      matchCount: dayMatches.length,
      matches: dayMatches,
    });
  }

  return {
    totalMatches: matches.length,
    totalPrizeMoney,
    totalEntryFees,
    totalExtraExpenses,
    totalExpenses,
    netProfitLoss,
    roi: Number(roi.toFixed(1)),
    profitMatchesCount,
    lossMatchesCount,
    breakEvenMatchesCount,
    timeline,
  };
}
