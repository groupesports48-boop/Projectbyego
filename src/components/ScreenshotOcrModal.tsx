import React, { useState } from 'react';
import {
  ScanLine,
  Upload,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Sparkles,
  X,
  Calendar,
  Clock,
  ArrowRight,
  Info,
} from 'lucide-react';
import { MatchType, MatchResultStatus, ExtractedOcrData } from '../types';
import { api } from '../services/api';
import { getISTDateString, getISTTimeString } from '../utils/analytics';
import { EsportsScan } from './EsportsIcons';

interface ScreenshotOcrModalProps {
  isOpen: boolean;
  onClose: () => void;
  onResultSaved: () => void;
}

export const ScreenshotOcrModal: React.FC<ScreenshotOcrModalProps> = ({
  isOpen,
  onClose,
  onResultSaved,
}) => {
  if (!isOpen) return null;

  const [screenshotData, setScreenshotData] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState('image/png');
  const [analyzing, setAnalyzing] = useState(false);
  const [extractedData, setExtractedData] = useState<ExtractedOcrData | null>(null);
  const [ocrNotice, setOcrNotice] = useState<string | null>(null);

  // Editable fields for manual verification before saving
  const [result, setResult] = useState<MatchResultStatus>('WIN');
  const [matchType, setMatchType] = useState<MatchType>('Squad');
  const [placement, setPlacement] = useState<number | ''>(1);
  const [kills, setKills] = useState<number | ''>(0);
  const [damage, setDamage] = useState<number | ''>(0);
  const [matchDate, setMatchDate] = useState(getISTDateString());
  const [matchTime, setMatchTime] = useState(getISTTimeString());
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      alert('File size exceeds 15MB.');
      return;
    }

    setMimeType(file.type || 'image/png');
    const reader = new FileReader();
    reader.onload = () => {
      setScreenshotData(reader.result as string);
      setExtractedData(null);
      setOcrNotice(null);
    };
    reader.readAsDataURL(file);
  };

  const handleAnalyzeScreenshot = async () => {
    if (!screenshotData) return;
    setAnalyzing(true);
    setError(null);
    setOcrNotice(null);

    try {
      const res = await api.ocr.analyze(screenshotData, mimeType);
      if (res.extracted) {
        setExtractedData(res.extracted);
        // Pre-fill editable verification fields
        setResult(res.extracted.result);
        setMatchType(res.extracted.matchType);
        setPlacement(res.extracted.placement !== undefined ? res.extracted.placement : 1);
        setKills(res.extracted.kills !== undefined ? res.extracted.kills : 0);
        setDamage(res.extracted.damage !== undefined ? res.extracted.damage : 0);
        if (res.message) {
          setOcrNotice(res.message);
        }
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to analyze screenshot. You can fill details manually below.');
      // Fallback extracted structure so user can still verify and edit manually
      setExtractedData({
        result: 'WIN',
        matchType: 'Squad',
        placement: 1,
        kills: 0,
        damage: 0,
        confidence: 0,
        detectedText: 'Manual entry required.',
      });
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSaveResult = async () => {
    if (!matchDate || !matchType || !result) {
      setError('Date, Match Type, and Result are required.');
      return;
    }

    setSaving(true);
    try {
      await api.results.create({
        matchDate,
        matchTime: matchTime || undefined,
        matchType,
        result,
        placement: placement !== '' ? Number(placement) : undefined,
        kills: kills !== '' ? Number(kills) : undefined,
        damage: damage !== '' ? Number(damage) : undefined,
        notes: notes.trim()
          ? `${notes.trim()} (Scorecard Verified via OCR)`
          : 'Scorecard Verified via OCR',
        screenshotUrl: screenshotData || undefined,
      });

      onResultSaved();
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to save confirmed result.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#171A2B] border border-[#1f233a] rounded-2xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl relative overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-[#1f233a] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#8B5CF6] via-[#6D28D9] to-[#3B0764] p-0.5 flex items-center justify-center shadow-[0_4px_16px_rgba(139,92,246,0.4)]">
              <div className="w-full h-full bg-[#08090F] rounded-[10px] flex items-center justify-center border border-white/10">
                <EsportsScan className="w-5 h-5 text-[#A78BFA]" />
              </div>
            </div>
            <div>
              <h2 className="text-lg font-bold text-white font-heading">
                Free Fire Scorecard OCR Scanner
              </h2>
              <p className="text-xs text-[#9296A8]">
                Upload match summary or Booyah scoreboard screenshot for smart text extraction.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#9296A8] hover:text-white hover:bg-[#111321]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {error && (
            <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2 shadow-md">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {ocrNotice && (
            <div className="p-3 rounded-xl bg-[#111321] border border-amber-500/40 text-amber-300 text-xs flex items-center gap-2 shadow-md">
              <Info className="w-4 h-4 shrink-0" />
              <span>{ocrNotice}</span>
            </div>
          )}

          {/* STEP 1: Upload and Preview */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#C0C4D0] font-mono">
                Step 1: Upload Scoreboard Screenshot
              </h3>
              {screenshotData && (
                <button
                  onClick={() => {
                    setScreenshotData(null);
                    setExtractedData(null);
                  }}
                  className="text-xs text-rose-400 hover:underline cursor-pointer"
                >
                  Choose another image
                </button>
              )}
            </div>

            {screenshotData ? (
              <div className="rounded-2xl border border-[#1f233a] overflow-hidden bg-black relative max-h-64 flex items-center justify-center shadow-inner">
                <img
                  src={screenshotData}
                  alt="Scorecard preview"
                  className="max-h-64 w-auto object-contain"
                />
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center p-8 rounded-2xl border-2 border-dashed border-[#1f233a] hover:border-[#8B5CF6]/50 bg-[#111321] cursor-pointer text-center transition-all group shadow-inner">
                <div className="w-12 h-12 rounded-xl icon-badge-3d-purple flex items-center justify-center text-[#A78BFA] mb-3 group-hover:scale-105 transition-transform">
                  <Upload className="w-6 h-6" />
                </div>
                <p className="text-sm font-semibold text-white">Click or Drag & Drop Scorecard Screenshot</p>
                <p className="text-xs text-[#9296A8] mt-1 font-mono">Supports PNG, JPG, WebP up to 15MB</p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            )}

            {screenshotData && !extractedData && (
              <button
                onClick={handleAnalyzeScreenshot}
                disabled={analyzing}
                className="w-full py-3 rounded-xl btn-3d-purple text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {analyzing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Analyzing Scoreboard with AI OCR...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Run OCR Text Extraction</span>
                  </>
                )}
              </button>
            )}
          </div>

          {/* STEP 2: Extracted Information & Manual Verification Form */}
          {extractedData && (
            <div className="p-5 rounded-2xl bg-[#111321] border border-[#8B5CF6]/30 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                    Step 2: Review & Verify Extracted Information
                  </h3>
                </div>
                {extractedData.confidence > 0 && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#171A2B] text-[#A78BFA] border border-[#8B5CF6]/30">
                    Confidence: {extractedData.confidence}%
                  </span>
                )}
              </div>

              <div className="p-3 rounded-xl bg-[#171A2B] border border-[#1f233a] text-xs text-[#9296A8] space-y-1">
                <p className="font-semibold text-[#C0C4D0]">Detected Scoreboard Text:</p>
                <p className="font-mono text-[11px] text-[#A78BFA]">{extractedData.detectedText || 'Scorecard data captured.'}</p>
                <p className="text-[10px] text-[#9296A8] italic pt-1">
                  * Verify all fields below before saving. Nothing is auto-saved without your explicit confirmation.
                </p>
              </div>

              {/* Editable Fields for User Correction */}
              <div className="space-y-3 pt-2">
                {/* Result: WIN / LOSS */}
                <div>
                  <label className="block text-xs font-semibold uppercase text-[#C0C4D0] mb-1.5">
                    Verified Outcome *
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setResult('WIN')}
                      className={`py-2.5 rounded-xl text-xs font-bold uppercase transition-all cursor-pointer ${
                        result === 'WIN'
                          ? 'bg-emerald-600 text-white shadow-md'
                          : 'bg-[#171A2B] text-[#9296A8] border border-[#1f233a]'
                      }`}
                    >
                      Booyah! (WIN)
                    </button>
                    <button
                      type="button"
                      onClick={() => setResult('LOSS')}
                      className={`py-2.5 rounded-xl text-xs font-bold uppercase transition-all cursor-pointer ${
                        result === 'LOSS'
                          ? 'bg-rose-600 text-white shadow-md'
                          : 'bg-[#171A2B] text-[#9296A8] border border-[#1f233a]'
                      }`}
                    >
                      Defeat (LOSS)
                    </button>
                  </div>
                </div>

                {/* Match Type */}
                <div>
                  <label className="block text-xs font-semibold uppercase text-[#C0C4D0] mb-1">
                    Match Type *
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['Solo', 'Duo', 'Squad'] as MatchType[]).map((t) => (
                      <button
                        type="button"
                        key={t}
                        onClick={() => setMatchType(t)}
                        className={`py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                          matchType === t
                            ? 'bg-[#8B5CF6] text-white border-[#8B5CF6]'
                            : 'bg-[#171A2B] text-[#9296A8] border-[#1f233a]'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold uppercase text-[#9296A8] mb-1">
                      Placement / Rank
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={placement}
                      onChange={(e) => setPlacement(e.target.value ? Number(e.target.value) : '')}
                      className="w-full bg-[#171A2B] border border-[#1f233a] focus:border-[#8B5CF6] rounded-xl px-3 py-2 text-xs text-white outline-none font-mono"
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
                      className="w-full bg-[#171A2B] border border-[#1f233a] focus:border-[#8B5CF6] rounded-xl px-3 py-2 text-xs text-white outline-none font-mono"
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
                      className="w-full bg-[#171A2B] border border-[#1f233a] focus:border-[#8B5CF6] rounded-xl px-3 py-2 text-xs text-white outline-none font-mono"
                    />
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
                      className="w-full bg-[#171A2B] border border-[#1f233a] focus:border-[#8B5CF6] rounded-xl px-3 py-2 text-xs text-white outline-none"
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
                      className="w-full bg-[#171A2B] border border-[#1f233a] focus:border-[#8B5CF6] rounded-xl px-3 py-2 text-xs text-white outline-none"
                    />
                  </div>
                </div>

                {/* Optional Notes */}
                <div>
                  <label className="block text-xs font-semibold uppercase text-[#C0C4D0] mb-1">
                    Notes
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. Scrims final circle 1v4 clutch"
                    className="w-full bg-[#171A2B] border border-[#1f233a] focus:border-[#8B5CF6] rounded-xl px-3 py-2 text-xs text-white outline-none"
                  />
                </div>
              </div>

              {/* Confirm & Save Button */}
              <button
                onClick={handleSaveResult}
                disabled={saving}
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.35)] transition-all cursor-pointer disabled:opacity-50 mt-4"
              >
                {saving ? (
                  <span>Saving to Match History...</span>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Confirm & Save Verified Result</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#111321] border-t border-[#1f233a] flex items-center justify-between text-xs text-[#9296A8]">
          <span>Free Fire Scorecard OCR Verification</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-[#171A2B] hover:bg-[#1f233a] text-[#C0C4D0] hover:text-white"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
