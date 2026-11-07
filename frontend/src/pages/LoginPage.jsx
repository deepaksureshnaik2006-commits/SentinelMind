import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import {
  BrainCircuit,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  Cpu,
  Lock,
  Mail
} from 'lucide-react';

export default function LoginPage() {
  const { navigateTo, showToast } = useApp();
  const { signIn } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    if (loading) return;

    setErrorMessage('');

    if (!email.trim() || !password) {
      setErrorMessage('Please provide both your email and password.');
      return;
    }

    setLoading(true);

    try {
      const data = await signIn({
        email: email.trim(),
        password,
      });

      if (data?.session) {
        showToast('Authentication successful. Welcome back!', 'success');
        navigateTo('dashboard');
      }
    } catch (err) {
      console.error('Login error:', err);
      const msg = err.message || 'Invalid email or password. Please verify credentials.';
      setErrorMessage(msg);
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070D18] text-[#E2F3FF] font-sans selection:bg-[#168DCE]/40 selection:text-[#38BDF8] flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      {/* Background glowing effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-[#168DCE]/10 blur-[130px] rounded-full pointer-events-none" />

      {/* Top Navigation Back to Landing */}
      <div className="w-full max-w-md mb-6 flex items-center justify-between">
        <button
          onClick={() => navigateTo('landing')}
          className="text-xs font-mono text-[#8BA8C2] hover:text-[#38BDF8] flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>BACK TO HOMEPAGE</span>
        </button>

        <div className="flex items-center gap-2">
          <BrainCircuit className="w-4 h-4 text-[#38BDF8]" />
          <span className="font-mono text-xs font-bold text-[#E2F3FF]">SENTINELMIND</span>
        </div>
      </div>

      {/* Main Login Card */}
      <div className="w-full max-w-md hud-bracket bg-[#0A1320] border border-[#168DCE]/40 rounded-sm p-6 sm:p-8 shadow-[0_0_25px_rgba(22,141,206,0.18)] space-y-6 relative z-10">
        <div>
          <span className="text-[10px] font-mono text-[#38BDF8] uppercase tracking-wider font-semibold block">
            SECURE ACCESS // SESSION LOGIN
          </span>
          <h2 className="text-xl font-mono font-bold text-[#E2F3FF] mt-1">
            Sign In to SentinelMind
          </h2>
          <p className="text-xs text-[#8BA8C2] mt-1 font-sans">
            Access active incident investigations, telemetry analysis, and Hindsight memory.
          </p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-3 rounded-sm bg-rose-950/40 border border-rose-900/60 text-rose-300 text-xs font-mono flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4 font-mono text-xs">
          {/* Email Address */}
          <div className="space-y-1.5">
            <label className="text-[11px] text-[#8BA8C2] uppercase font-medium flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-[#38BDF8]" /> Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="operator@sentinelmind.ai"
              disabled={loading}
              className="w-full px-3.5 py-2.5 rounded-sm bg-[#070D18] border border-[#168DCE]/35 focus:border-[#38BDF8] focus:ring-1 focus:ring-[#38BDF8] text-[#E2F3FF] placeholder-[#8BA8C2]/40 outline-none transition-all"
            />
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label className="text-[11px] text-[#8BA8C2] uppercase font-medium flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-[#38BDF8]" /> Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                disabled={loading}
                className="w-full px-3.5 py-2.5 pr-10 rounded-sm bg-[#070D18] border border-[#168DCE]/35 focus:border-[#38BDF8] focus:ring-1 focus:ring-[#38BDF8] text-[#E2F3FF] placeholder-[#8BA8C2]/40 outline-none transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8BA8C2] hover:text-[#38BDF8] transition-colors cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-sm bg-gradient-to-b from-[#168DCE] to-[#0D6DA5] hover:from-[#38BDF8] hover:to-[#168DCE] border border-[#38BDF8] text-white font-bold tracking-wider flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(56,189,248,0.35)] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed mt-2"
          >
            {loading ? (
              <>
                <Cpu className="w-4 h-4 animate-spin text-white" />
                <span>AUTHENTICATING OPERATOR...</span>
              </>
            ) : (
              <>
                <span>SIGN IN TO WORKSPACE</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Card Footer: Switch to Signup */}
        <div className="pt-4 border-t border-[#168DCE]/25 text-center font-mono text-xs text-[#8BA8C2]">
          <span>Don't have an operator account? </span>
          <button
            onClick={() => navigateTo('signup')}
            className="text-[#38BDF8] hover:underline font-semibold cursor-pointer"
          >
            Create Account
          </button>
        </div>
      </div>
    </div>
  );
}
