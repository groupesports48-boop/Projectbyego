import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateMatchNet,
  filterMatchesByProfitLossPeriod,
  calculateProfitLossSummary,
} from './profitLoss.ts';
import { MatchResult } from '../types/index.ts';

test('calculateMatchNet calculates net profit and loss accurately', () => {
  // Win with 500 prize, 100 entry, 50 extra expenses
  const net1 = calculateMatchNet({ prizeMoney: 500, entryFee: 100, extraExpenses: 50 });
  assert.strictEqual(net1, 350);

  // Loss with 0 prize, 150 entry, 20 extra expenses
  const net2 = calculateMatchNet({ prizeMoney: 0, entryFee: 150, extraExpenses: 20 });
  assert.strictEqual(net2, -170);

  // Break-even
  const net3 = calculateMatchNet({ prizeMoney: 100, entryFee: 100 });
  assert.strictEqual(net3, 0);

  // Missing or undefined fields
  const net4 = calculateMatchNet({});
  assert.strictEqual(net4, 0);
});

test('filterMatchesByProfitLossPeriod filters correctly for 15d, 20d, 25d, 30d, and all', () => {
  const refDate = new Date('2026-11-05T12:00:00Z');

  const matches: MatchResult[] = [
    {
      id: 'm1',
      userId: 'u1',
      matchDate: '2026-11-04',
      matchType: 'Squad',
      result: 'WIN',
      entryFee: 100,
      prizeMoney: 400,
      createdAt: '2026-11-04T10:00:00Z',
    },
    {
      id: 'm2',
      userId: 'u1',
      matchDate: '2026-10-20', // ~16 days ago
      matchType: 'Duo',
      result: 'LOSS',
      entryFee: 50,
      createdAt: '2026-10-20T10:00:00Z',
    },
    {
      id: 'm3',
      userId: 'u1',
      matchDate: '2026-10-14', // ~22 days ago
      matchType: 'Solo',
      result: 'WIN',
      entryFee: 30,
      prizeMoney: 100,
      createdAt: '2026-10-14T10:00:00Z',
    },
    {
      id: 'm4',
      userId: 'u1',
      matchDate: '2026-10-08', // ~28 days ago
      matchType: 'Squad',
      result: 'LOSS',
      entryFee: 100,
      createdAt: '2026-10-08T10:00:00Z',
    },
    {
      id: 'm5',
      userId: 'u1',
      matchDate: '2026-09-01', // > 60 days ago
      matchType: 'Squad',
      result: 'WIN',
      entryFee: 200,
      prizeMoney: 1000,
      createdAt: '2026-09-01T10:00:00Z',
    },
  ];

  // 15 days filter should include m1 (Nov 4)
  const res15 = filterMatchesByProfitLossPeriod(matches, '15d', refDate);
  assert.strictEqual(res15.length, 1);
  assert.strictEqual(res15[0].id, 'm1');

  // 20 days filter should include m1 and m2 (Oct 20)
  const res20 = filterMatchesByProfitLossPeriod(matches, '20d', refDate);
  assert.strictEqual(res20.length, 2);

  // 25 days filter should include m1, m2, m3 (Oct 14)
  const res25 = filterMatchesByProfitLossPeriod(matches, '25d', refDate);
  assert.strictEqual(res25.length, 3);

  // 30 days filter should include m1, m2, m3, m4 (Oct 8)
  const res30 = filterMatchesByProfitLossPeriod(matches, '30d', refDate);
  assert.strictEqual(res30.length, 4);

  // All time filter should include all 5 matches
  const resAll = filterMatchesByProfitLossPeriod(matches, 'all', refDate);
  assert.strictEqual(resAll.length, 5);
});

test('calculateProfitLossSummary calculates totals, ROI, and timeline correctly', () => {
  const matches: MatchResult[] = [
    {
      id: 'm1',
      userId: 'u1',
      matchDate: '2026-11-01',
      matchType: 'Squad',
      result: 'WIN',
      entryFee: 100,
      prizeMoney: 500,
      extraExpenses: 50,
      createdAt: '2026-11-01T10:00:00Z',
    },
    {
      id: 'm2',
      userId: 'u1',
      matchDate: '2026-11-02',
      matchType: 'Duo',
      result: 'LOSS',
      entryFee: 100,
      prizeMoney: 0,
      extraExpenses: 0,
      createdAt: '2026-11-02T10:00:00Z',
    },
  ];

  const summary = calculateProfitLossSummary(matches);

  // Total Prize = 500
  assert.strictEqual(summary.totalPrizeMoney, 500);
  // Total Entry = 200, Extra = 50 -> Total Expenses = 250
  assert.strictEqual(summary.totalExpenses, 250);
  // Net = 500 - 250 = 250
  assert.strictEqual(summary.netProfitLoss, 250);
  // ROI = (250 / 250) * 100 = 100%
  assert.strictEqual(summary.roi, 100);
  // Profit matches: 1, Loss matches: 1
  assert.strictEqual(summary.profitMatchesCount, 1);
  assert.strictEqual(summary.lossMatchesCount, 1);
  assert.strictEqual(summary.breakEvenMatchesCount, 0);

  // Timeline points should have 2 days
  assert.strictEqual(summary.timeline.length, 2);
  // Day 1 cumulative net = +350 (500 - 150)
  assert.strictEqual(summary.timeline[0].cumulativeNet, 350);
  // Day 2 cumulative net = 350 - 100 = 250
  assert.strictEqual(summary.timeline[1].cumulativeNet, 250);
});
