export type MatchType = 'Solo' | 'Duo' | 'Squad';
export type MatchResultStatus = 'WIN' | 'LOSS';
export type PeriodFilter = '7d' | '15d' | '30d' | '90d' | 'all';
export type PlayerRole = 'Rusher' | 'Sniper' | 'IGL' | 'Support' | 'All-Rounder' | 'Flanker';

export interface User {
  id: string;
  fullName: string;
  email: string;
  ign?: string; // In-Game Name
  bio?: string;
  role?: PlayerRole;
  avatarUrl?: string;
  bannerUrl?: string;
  createdAt: string;
}

export interface WhatsAppGroup {
  id: string;
  userId: string;
  name: string;
  url: string;
  note?: string;
  createdAt: string;
}

export interface MatchSchedule {
  id: string;
  userId: string;
  name?: string;
  matchDate: string; // YYYY-MM-DD
  matchTime: string; // HH:MM in IST
  matchType: MatchType;
  whatsappGroupId?: string;
  whatsappUrl?: string;
  notes?: string;
  isCompleted?: boolean;
  createdAt: string;
}

export interface MatchResult {
  id: string;
  userId: string;
  matchDate: string; // YYYY-MM-DD
  matchTime?: string; // HH:MM
  matchType: MatchType;
  result: MatchResultStatus;
  placement?: number; // e.g. 1 for Booyah
  kills?: number;
  damage?: number;
  notes?: string;
  screenshotUrl?: string;
  matchScheduleId?: string;
  entryFee?: number; // In INR (₹)
  prizeMoney?: number; // In INR (₹)
  extraExpenses?: number; // In INR (₹)
  expenseNotes?: string;
  createdAt: string;
}

export type ProfitLossPeriodFilter = '15d' | '20d' | '25d' | '30d' | 'all';

export interface ProfitLossTimelinePoint {
  date: string;
  displayDate: string;
  prizeMoney: number;
  expenses: number;
  netProfitLoss: number;
  cumulativeNet: number;
  matchCount: number;
  matches: MatchResult[];
}

export interface ProfitLossSummary {
  totalMatches: number;
  totalPrizeMoney: number;
  totalEntryFees: number;
  totalExtraExpenses: number;
  totalExpenses: number;
  netProfitLoss: number;
  roi: number; // Percentage
  profitMatchesCount: number;
  lossMatchesCount: number;
  breakEvenMatchesCount: number;
  timeline: ProfitLossTimelinePoint[];
}

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'reminder' | 'schedule' | 'system';
  timestamp: string;
  read: boolean;
  matchId?: string;
}

export interface PerformanceComparison {
  prevMatches: number;
  prevWins: number;
  prevLosses: number;
  prevWinRate: number;
  matchesDiff: number;
  winsDiff: number;
  lossesDiff: number;
  winRateDiff: number;
  insight: 'improved' | 'declined' | 'stable';
  insightDetail: string;
}

export interface DailyPerformancePoint {
  date: string;
  displayDate: string;
  wins: number;
  losses: number;
  total: number;
  winRate: number;
  cumulativeScore: number; // +1 win, -1 loss
  matches: MatchResult[];
}

export interface PerformanceMetrics {
  totalMatches: number;
  totalWins: number;
  totalLosses: number;
  winRate: number;
  winStreak: number;
  currentForm: MatchResultStatus[];
  soloStats: { matches: number; wins: number; losses: number; winRate: number };
  duoStats: { matches: number; wins: number; losses: number; winRate: number };
  squadStats: { matches: number; wins: number; losses: number; winRate: number };
  dailyTrend: DailyPerformancePoint[];
  comparison: PerformanceComparison;
}

export interface ExtractedOcrData {
  result: MatchResultStatus;
  matchType: MatchType;
  placement?: number;
  kills?: number;
  damage?: number;
  matchDate?: string;
  matchTime?: string;
  detectedText?: string;
  confidence: number;
}
