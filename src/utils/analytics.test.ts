import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateWinRate,
  calculatePerformanceMetrics,
  getMatchCountdown,
  isTodayIST,
} from './analytics';
import { MatchResult } from '../types';

test('calculateWinRate handles 0 matches without division by zero', () => {
  assert.equal(calculateWinRate(0, 0), 0);
  assert.equal(calculateWinRate(5, 10), 50);
  assert.equal(calculateWinRate(7, 10), 70);
  assert.equal(calculateWinRate(1, 3), 33);
});

test('calculatePerformanceMetrics handles empty match history', () => {
  const metrics = calculatePerformanceMetrics([]);
  assert.equal(metrics.totalMatches, 0);
  assert.equal(metrics.totalWins, 0);
  assert.equal(metrics.totalLosses, 0);
  assert.equal(metrics.winRate, 0);
  assert.equal(metrics.winStreak, 0);
  assert.deepEqual(metrics.dailyTrend, []);
  assert.equal(metrics.comparison.insight, 'stable');
  assert.equal(metrics.soloStats.matches, 0);
});

test('calculatePerformanceMetrics properly increments win trend (+1) and loss trend (-1)', () => {
  const sampleMatches: MatchResult[] = [
    {
      id: 'm1',
      userId: 'u1',
      matchDate: '2026-11-01',
      matchType: 'Squad',
      result: 'WIN',
      createdAt: '2026-11-01T10:00:00Z',
    },
    {
      id: 'm2',
      userId: 'u1',
      matchDate: '2026-11-01',
      matchType: 'Squad',
      result: 'WIN',
      createdAt: '2026-11-01T11:00:00Z',
    },
    {
      id: 'm3',
      userId: 'u1',
      matchDate: '2026-11-02',
      matchType: 'Solo',
      result: 'LOSS',
      createdAt: '2026-11-02T10:00:00Z',
    },
    {
      id: 'm4',
      userId: 'u1',
      matchDate: '2026-11-03',
      matchType: 'Duo',
      result: 'WIN',
      createdAt: '2026-11-03T10:00:00Z',
    },
  ];

  const metrics = calculatePerformanceMetrics(sampleMatches, 'all');
  assert.equal(metrics.totalMatches, 4);
  assert.equal(metrics.totalWins, 3);
  assert.equal(metrics.totalLosses, 1);
  assert.equal(metrics.winRate, 75);
  assert.equal(metrics.winStreak, 1); // Last match is win
  assert.equal(metrics.squadStats.matches, 2);
  assert.equal(metrics.squadStats.wins, 2);
  assert.equal(metrics.squadStats.winRate, 100);

  // Daily trend check
  assert.equal(metrics.dailyTrend.length, 3);
  // Day 1: 2 wins -> cumulative score = 2
  assert.equal(metrics.dailyTrend[0].cumulativeScore, 2);
  // Day 2: 1 loss -> net -1 -> cumulative score = 1
  assert.equal(metrics.dailyTrend[1].cumulativeScore, 1);
  // Day 3: 1 win -> net +1 -> cumulative score = 2
  assert.equal(metrics.dailyTrend[2].cumulativeScore, 2);
});

test('getMatchCountdown returns correct structure for future and past matches', () => {
  const pastCountdown = getMatchCountdown('2020-01-01', '10:00');
  assert.equal(pastCountdown.isPast, true);
  assert.equal(pastCountdown.totalSeconds, 0);

  const futureCountdown = getMatchCountdown('2030-01-01', '15:00');
  assert.equal(futureCountdown.isPast, false);
  assert.ok(futureCountdown.totalSeconds > 0);
  assert.ok(futureCountdown.formatted.length > 0);
});
