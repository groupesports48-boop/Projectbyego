import React, { useState } from 'react';
import { X, Calendar, Clock, AlertCircle } from 'lucide-react';
import { MatchType, WhatsAppGroup } from '../types';
import { getISTDateString, getISTTimeString } from '../utils/analytics';
import { api } from '../services/api';
import { EsportsSwords, EsportsWhatsApp } from './EsportsIcons';

interface CreateMatchModalProps {
  groups: WhatsAppGroup[];
  isOpen: boolean;
  onClose: () => void;
  onMatchCreated: () => void;
}

export const CreateMatchModal: React.FC<CreateMatchModalProps> = ({
  groups,
  isOpen,
  onClose,
  onMatchCreated,
}) => {
  if (!isOpen) return null;

  // Defaults to today in IST
  const [name, setName] = useState('');
  const [matchDate, setMatchDate] = useState(getISTDateString());
  const [matchTime, setMatchTime] = useState(getISTTimeString());
  const [matchType, setMatchType] = useState<MatchType>('Squad');
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [customUrl, setCustomUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!matchDate || !matchTime) {
      setError('Match Date and Time (IST) are required.');
      return;
    }

    let finalUrl = customUrl.trim();
    if (selectedGroupId) {
      const g = groups.find((grp) => grp.id === selectedGroupId);
      if (g) finalUrl = g.url;
    }

    if (finalUrl && !finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
      finalUrl = 'https://' + finalUrl;
    }

    setLoading(true);
    try {
      await api.matches.create({
        name: name.trim() || undefined,
        matchDate,
        matchTime,
        matchType,
        whatsappGroupId: selectedGroupId || undefined,
        whatsappUrl: finalUrl || undefined,
        notes: notes.trim() || undefined,
      });

      onMatchCreated();
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to schedule match');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="card-3d max-w-md w-full p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-[#9296A8] hover:text-white hover:bg-[#111321] transition-colors"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5 mb-1">
          <div className="icon-badge-3d-purple">
            <EsportsSwords className="w-4 h-4 text-[#A78BFA]" />
          </div>
          <h2 className="text-lg font-bold text-white font-heading tracking-wide">Schedule Free Fire Match</h2>
        </div>
        <p className="text-xs text-[#9296A8] mb-5">
          Add a scheduled match with countdown timer and WhatsApp group link.
        </p>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-950/40 border border-red-500/40 text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 1. Match Name (Optional) */}
          <div>
            <label className="block text-xs font-semibold uppercase text-[#C0C4D0] mb-1">
              Match Name <span className="text-[#9296A8] font-normal lowercase">(optional)</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Scrims vs Elite Guild"
              className="w-full bg-[#111321] border border-[#1f233a] focus:border-[#8B5CF6] rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-[#505468] outline-none transition-colors"
            />
          </div>

          {/* 2. Match Date & 3. Match Time (IST) */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase text-[#C0C4D0] mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-[#A78BFA]" />
                <span>Date (IST) *</span>
              </label>
              <input
                type="date"
                required
                value={matchDate}
                onChange={(e) => setMatchDate(e.target.value)}
                className="w-full bg-[#111321] border border-[#1f233a] focus:border-[#8B5CF6] rounded-xl px-3 py-2 text-sm text-white outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-[#C0C4D0] mb-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-[#A78BFA]" />
                <span>Time (IST) *</span>
              </label>
              <input
                type="time"
                required
                value={matchTime}
                onChange={(e) => setMatchTime(e.target.value)}
                className="w-full bg-[#111321] border border-[#1f233a] focus:border-[#8B5CF6] rounded-xl px-3 py-2 text-sm text-white outline-none transition-colors"
              />
            </div>
          </div>

          {/* 4. Match Type: Solo / Duo / Squad */}
          <div>
            <label className="block text-xs font-semibold uppercase text-[#C0C4D0] mb-1.5">
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
                      ? 'bg-[#8B5CF6] text-white border-[#8B5CF6] shadow-[0_4px_14px_rgba(139,92,246,0.4)] translate-y-[-1px]'
                      : 'bg-[#111321] text-[#9296A8] border-[#1f233a] hover:text-white'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Optional WhatsApp Group Link */}
          <div>
            <label className="block text-xs font-semibold uppercase text-[#C0C4D0] mb-1 flex items-center gap-1.5">
              <EsportsWhatsApp className="w-3.5 h-3.5 text-emerald-400" />
              <span>WhatsApp Group Link <span className="text-[#9296A8] font-normal lowercase">(optional)</span></span>
            </label>
            {groups.length > 0 && (
              <select
                value={selectedGroupId}
                onChange={(e) => {
                  setSelectedGroupId(e.target.value);
                  if (e.target.value) {
                    const g = groups.find((grp) => grp.id === e.target.value);
                    if (g) setCustomUrl(g.url);
                  }
                }}
                className="w-full bg-[#111321] border border-[#1f233a] focus:border-[#8B5CF6] rounded-xl px-3 py-2 text-xs text-white outline-none mb-2"
              >
                <option value="">-- Choose from saved WhatsApp Groups --</option>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            )}
            <input
              type="url"
              value={customUrl}
              onChange={(e) => setCustomUrl(e.target.value)}
              placeholder="https://chat.whatsapp.com/..."
              className="w-full bg-[#111321] border border-[#1f233a] focus:border-[#8B5CF6] rounded-xl px-3.5 py-2 text-xs text-white placeholder-[#505468] outline-none font-mono"
            />
          </div>

          {/* Action Buttons */}
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
              {loading ? 'Creating...' : 'Confirm Schedule'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
