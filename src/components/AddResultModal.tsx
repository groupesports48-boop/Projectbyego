import React, { useState } from 'react';
import { X, Calendar, Clock, AlertCircle, Upload } from 'lucide-react';
import { MatchType, MatchResultStatus } from '../types';
import { getISTDateString, getISTTimeString } from '../utils/analytics';
import { api } from '../services/api';
import { EsportsTrophy, EsportsDefeat } from './EsportsIcons';

interface AddResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  onResultAdded: () => void;
}

export const AddResultModal: React.FC<AddResultModalProps> = ({
  isOpen,
  onClose,
  onResultAdded,
}) => {
  if (!isOpen) return null;

  const [matchDate, setMatchDate] = useState(getISTDateString());
  const [matchTime, setMatchTime] = useState(getISTTimeString());
  const [matchType, setMatchType] = useState<MatchType>('Squad');
  const [result, setResult] = useState<MatchResultStatus>('WIN');
  const [placement, setPlacement] = useState<number | ''>(1);
  const [kills, setKills] = useState<number | ''>(0);
  const [damage, setDamage] = useState<number | ''>('');
  const [entryFee, setEditEntryFee] = useState<number | ''>('');
  const [prizeMoney, setEditPrizeMoney] = useState<number | ''>('');
  const [notes, setNotes] = useState('');
  const [screenshotUrl, setScreenshotUrl] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert('Image size exceeds 10MB limit.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setScreenshotUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!matchDate || !matchType || !result) {
      setError('Date, Match Type, and Result are required.');
      return;
    }

    setLoading(true);
    try {
      await api.results.create({
        matchDate,
        matchTime: matchTime || undefined,
        matchType,
        result,
        placement: placement !== '' ? Number(placement) : undefined,
        kills: kills !== '' ? Number(kills) : undefined,
        damage: damage !== '' ? Number(damage) : undefined,
        entryFee: entryFee !== '' ? Math.max(0, Number(entryFee)) : 0,
        prizeMoney: prizeMoney !== '' ? Math.max(0, Number(prizeMoney)) : 0,
        notes: notes.trim() || undefined,
        screenshotUrl: screenshotUrl || undefined,
      });

      onResultAdded();
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to record match result');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="card-3d max-w-md w-full p-6 relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-[#9296A8] hover:text-white hover:bg-[#111321] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5 mb-1">
          <div className="icon-badge-3d-emerald">
            <EsportsTrophy className="w-4 h-4 text-emerald-400" />
          </div>
          <h2 className="text-lg font-bold text-white font-heading tracking-wide">Log Match Result</h2>
        </div>
        <p className="text-xs text-[#9296A8] mb-5">
          Record verified Free Fire match outcome. Updates win rate and analytics instantly.
        </p>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-950/40 border border-red-500/40 text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Result: WIN or LOSS */}
          <div>
            <label className="block text-xs font-semibold uppercase text-[#C0C4D0] mb-1.5">
              Match Outcome *
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setResult('WIN');
                  if (placement === '' || placement > 1) setPlacement(1);
                }}
                className={`py-3 rounded-xl text-xs font-bold uppercase flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  result === 'WIN'
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-[0_4px_16px_rgba(16,185,129,0.35)] border border-emerald-400 translate-y-[-1px]'
                    : 'bg-[#111321] text-[#9296A8] border border-[#1f233a] hover:text-white'
                }`}
              >
                <EsportsTrophy className="w-4 h-4" />
                <span>BOOYAH! (WIN)</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setResult('LOSS');
                  if (placement === 1) setPlacement(2);
                }}
                className={`py-3 rounded-xl text-xs font-bold uppercase flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  result === 'LOSS'
                    ? 'bg-gradient-to-r from-rose-600 to-red-600 text-white shadow-[0_4px_16px_rgba(244,63,94,0.35)] border border-rose-400 translate-y-[-1px]'
                    : 'bg-[#111321] text-[#9296A8] border border-[#1f233a] hover:text-white'
                }`}
              >
                <EsportsDefeat className="w-4 h-4" />
                <span>DEFEAT (LOSS)</span>
              </button>
            </div>
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase text-[#C0C4D0] mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-[#A78BFA]" />
                <span>Date *</span>
              </label>
              <input
                type="date"
                required
                value={matchDate}
                onChange={(e) => setMatchDate(e.target.value)}
                className="w-full bg-[#111321] border border-[#1f233a] focus:border-[#8B5CF6] rounded-xl px-3 py-2 text-xs text-white outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-[#C0C4D0] mb-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-[#A78BFA]" />
                <span>Time (IST)</span>
              </label>
              <input
                type="time"
                value={matchTime}
                onChange={(e) => setMatchTime(e.target.value)}
                className="w-full bg-[#111321] border border-[#1f233a] focus:border-[#8B5CF6] rounded-xl px-3 py-2 text-xs text-white outline-none"
              />
            </div>
          </div>

          {/* Match Type */}
          <div>
            <label className="block text-xs font-semibold uppercase text-[#C0C4D0] mb-1">
              Match Type *
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['Solo', 'Duo', 'Squad'] as MatchType[]).map((type) => (
                <button
                  type="button"
                  key={type}
                  onClick={() => setMatchType(type)}
                  className={`py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                    matchType === type
                      ? 'bg-[#8B5CF6] text-white border-[#8B5CF6] shadow-[0_0_12px_rgba(139,92,246,0.3)]'
                      : 'bg-[#111321] text-[#9296A8] border-[#1f233a] hover:text-white'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Stats: Placement, Kills, Damage */}
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-[11px] font-semibold uppercase text-[#9296A8] mb-1">
                Rank/Place
              </label>
              <input
                type="number"
                min="1"
                value={placement}
                onChange={(e) => setPlacement(e.target.value ? Number(e.target.value) : '')}
                placeholder="1"
                className="w-full bg-[#111321] border border-[#1f233a] focus:border-[#8B5CF6] rounded-xl px-3 py-2 text-xs text-white outline-none font-mono"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold uppercase text-[#9296A8] mb-1">
                Kills
              </label>
              <input
                type="number"
                min="0"
                value={kills}
                onChange={(e) => setKills(e.target.value ? Number(e.target.value) : '')}
                placeholder="0"
                className="w-full bg-[#111321] border border-[#1f233a] focus:border-[#8B5CF6] rounded-xl px-3 py-2 text-xs text-white outline-none font-mono"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold uppercase text-[#9296A8] mb-1">
                Damage
              </label>
              <input
                type="number"
                min="0"
                value={damage}
                onChange={(e) => setDamage(e.target.value ? Number(e.target.value) : '')}
                placeholder="0"
                className="w-full bg-[#111321] border border-[#1f233a] focus:border-[#8B5CF6] rounded-xl px-3 py-2 text-xs text-white outline-none font-mono"
              />
            </div>
          </div>

          {/* Optional Financials: Entry Fee & Prize Money */}
          <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-[#111321] border border-[#1f233a]">
            <div>
              <label className="block text-[11px] font-semibold uppercase text-[#9296A8] mb-1">
                Entry Fee (₹)
              </label>
              <input
                type="number"
                min="0"
                value={entryFee}
                onChange={(e) => setEditEntryFee(e.target.value ? Number(e.target.value) : '')}
                placeholder="0"
                className="w-full bg-[#171A2B] border border-[#1f233a] focus:border-[#8B5CF6] rounded-xl px-3 py-2 text-xs text-white outline-none font-mono"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold uppercase text-[#9296A8] mb-1">
                Prize Won (₹)
              </label>
              <input
                type="number"
                min="0"
                value={prizeMoney}
                onChange={(e) => setEditPrizeMoney(e.target.value ? Number(e.target.value) : '')}
                placeholder="0"
                className="w-full bg-[#171A2B] border border-[#1f233a] focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-white outline-none font-mono"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold uppercase text-[#C0C4D0] mb-1">
              Optional Notes
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Scrim vs Team Alpha, clutched 1v3 in Pochinok"
              className="w-full bg-[#111321] border border-[#1f233a] focus:border-[#8B5CF6] rounded-xl px-3 py-2 text-xs text-white outline-none"
            />
          </div>

          {/* Optional Screenshot */}
          <div>
            <label className="block text-xs font-semibold uppercase text-[#C0C4D0] mb-1 flex items-center justify-between">
              <span>Optional Scorecard Screenshot</span>
              {screenshotUrl && (
                <button
                  type="button"
                  onClick={() => setScreenshotUrl('')}
                  className="text-[10px] text-red-400 hover:underline"
                >
                  Remove
                </button>
              )}
            </label>
            {screenshotUrl ? (
              <div className="relative rounded-xl overflow-hidden border border-[#1f233a] h-28 bg-black">
                <img src={screenshotUrl} alt="Preview" className="w-full h-full object-cover" />
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center p-3 rounded-xl border border-dashed border-[#1f233a] hover:border-[#8B5CF6]/50 bg-[#111321] cursor-pointer text-center">
                <Upload className="w-4 h-4 text-[#9296A8] mb-1" />
                <span className="text-xs text-[#C0C4D0]">Attach Screenshot</span>
                <span className="text-[10px] text-[#9296A8]">PNG, JPG up to 10MB</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {/* Submit */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#1f233a]">
            <button
              type="button"
              onClick={onClose}
              className="btn-3d-dark px-4 py-2 text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-3d-purple px-5 py-2 text-xs disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Result'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
