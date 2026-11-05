import React, { useState } from 'react';
import { Eye, EyeOff, Lock, Mail, User as UserIcon, ShieldCheck, ArrowRight } from 'lucide-react';
import { EsportsFlame } from './EsportsIcons';
import { api } from '../services/api';
import { User } from '../types';

interface AuthScreenProps {
  onAuthSuccess: (user: User) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password) {
      setError('Please provide all required fields.');
      return;
    }

    if (!isLogin) {
      if (!fullName.trim()) {
        setError('Full Name is required for registration.');
        return;
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }
    }

    setLoading(true);

    try {
      if (isLogin) {
        const res = await api.auth.login({ email, password });
        onAuthSuccess(res.user);
      } else {
        const res = await api.auth.signup({
          fullName,
          email,
          password,
          confirmPassword,
        });
        onAuthSuccess(res.user);
      }
    } catch (err: any) {
      setError(err?.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemoAccount = () => {
    setEmail('businessesports1@gmail.com');
    setPassword('Destroyer@2026');
    setFullName('Destroyer Captain');
  };

  return (
    <div className="min-h-screen bg-[#08090F] flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background cyber grid & ambient glows */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,#1f1a3a_0%,#08090F_70%)] pointer-events-none" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[550px] h-[350px] bg-[#8B5CF6]/15 blur-[120px] rounded-full pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4">
        {/* Brand header */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[#8B5CF6] via-[#6D28D9] to-[#3B0764] p-0.5 shadow-[0_8px_30px_rgba(139,92,246,0.5)] mb-4 transition-transform hover:scale-105">
            <div className="w-full h-full bg-[#08090F] rounded-[14px] flex items-center justify-center border border-white/10">
              <EsportsFlame className="w-8 h-8 text-[#A78BFA] animate-pulse drop-shadow-[0_0_10px_rgba(167,139,250,0.8)]" />
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-heading tracking-wider text-white">
            DESTROYED <span className="text-[#A78BFA] text-glow">eSPORTS</span>
          </h1>
          <p className="mt-2 text-xs text-[#9296A8] font-sub uppercase tracking-widest font-semibold font-mono">
            Personal Free Fire Management Hub
          </p>
        </div>

        {/* 3D Auth Card */}
        <div className="mt-8 card-3d rounded-3xl p-6 sm:p-8 relative">
          {/* Tabs */}
          <div className="grid grid-cols-2 p-1.5 bg-[#111321] rounded-2xl border border-[#1f233a] shadow-inner mb-6">
            <button
              type="button"
              onClick={() => {
                setIsLogin(true);
                setError(null);
              }}
              className={`py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer font-mono ${
                isLogin
                  ? 'btn-3d-purple text-white'
                  : 'text-[#9296A8] hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setIsLogin(false);
                setError(null);
              }}
              className={`py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer font-mono ${
                !isLogin
                  ? 'btn-3d-purple text-white'
                  : 'text-[#9296A8] hover:text-white'
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-5 p-3 rounded-xl bg-red-950/40 border border-red-500/40 text-red-300 text-xs flex items-start gap-2.5">
              <span className="font-bold text-red-400">Error:</span>
              <span className="flex-1">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name for Signup */}
            {!isLogin && (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#C0C4D0] mb-1.5 font-mono">
                  Full Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#9296A8]">
                    <UserIcon className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Alex Hunter"
                    className="w-full bg-[#111321] border border-[#1f233a] focus:border-[#8B5CF6] focus:ring-1 focus:ring-[#8B5CF6] rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-white placeholder-[#505468] transition-all outline-none shadow-inner"
                  />
                </div>
              </div>
            )}

            {/* Email Address */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#C0C4D0] mb-1.5 font-mono">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#9296A8]">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="player@destroyed-esports.com"
                  className="w-full bg-[#111321] border border-[#1f233a] focus:border-[#8B5CF6] focus:ring-1 focus:ring-[#8B5CF6] rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-white placeholder-[#505468] transition-all outline-none shadow-inner"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#C0C4D0] mb-1.5 font-mono">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#9296A8]">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 6 characters"
                  className="w-full bg-[#111321] border border-[#1f233a] focus:border-[#8B5CF6] focus:ring-1 focus:ring-[#8B5CF6] rounded-xl pl-10 pr-10 py-2.5 text-sm text-white placeholder-[#505468] transition-all outline-none shadow-inner"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#9296A8] hover:text-[#C0C4D0] cursor-pointer"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password for Signup */}
            {!isLogin && (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#C0C4D0] mb-1.5 font-mono">
                  Confirm Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#9296A8]">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat your password"
                    className="w-full bg-[#111321] border border-[#1f233a] focus:border-[#8B5CF6] rounded-xl pl-10 pr-10 py-2.5 text-sm text-white placeholder-[#505468] transition-all outline-none shadow-inner"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#9296A8] hover:text-[#C0C4D0] cursor-pointer"
                    aria-label="Toggle confirm password visibility"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 rounded-xl btn-3d-purple text-white font-semibold text-sm tracking-wide flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>{isLogin ? 'Enter Headquarters' : 'Create Free Fire Profile'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Credentials Helper */}
          <div className="mt-6 pt-5 border-t border-[#1f233a] flex items-center justify-between text-xs text-[#9296A8]">
            <span>Personal Esports Hub</span>
            <button
              type="button"
              onClick={fillDemoAccount}
              className="text-[#A78BFA] hover:text-white transition-colors underline cursor-pointer font-mono"
            >
              Quick Test Fill
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
