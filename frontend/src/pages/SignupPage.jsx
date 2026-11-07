import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import {
  BrainCircuit,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Cpu,
  Lock,
  Mail,
  User,
  ShieldCheck,
  Briefcase
} from 'lucide-react';

export default function SignupPage() {
  const { navigateTo, showToast } = useApp();
  const { signUp } = useAuth();

  const [fullName, setFullName] = useState('');
  const [profession, setProfession] = useState('Site Reliability Engineer (SRE)');
  const [customProfession, setCustomProfession] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Password strength calculation
  const getPasswordStrength = (pass) => {
    if (!pass) return { score: 0, label: '', color: 'bg-transparent', text: '' };

    let points = 0;
    const len = pass.length;

    // 1. Length scoring
    if (len >= 6) points += 20;
    if (len >= 8) points += 20;
    if (len >= 12) points += 25;
    if (len >= 16) points += 25;

    // 2. Character diversity scoring
    const hasLower = /[a-z]/.test(pass);
    const hasUpper = /[A-Z]/.test(pass);
    const hasNumber = /[0-9]/.test(pass);
    const hasSpecial = /[^A-Za-z0-9]/.test(pass);

    const varietyCount = [hasLower, hasUpper, hasNumber, hasSpecial].filter(Boolean).length;
    points += varietyCount * 10;

    // Any password with 14+ chars and at least 2 character types, or any 18+ char password gets 100% full strength
    if ((len >= 14 && varietyCount >= 2) || len >= 18 || points >= 80) {
      points = 100;
    }

    const score = Math.min(100, points);

    if (score < 40) {
      return { score: Math.max(score, 25), label: 'Weak', color: 'bg-rose-500', text: 'text-rose-400' };
    } else if (score < 70) {
      return { score, label: 'Fair', color: 'bg-amber-500', text: 'text-amber-400' };
    } else if (score < 85) {
      return { score, label: 'Good', color: 'bg-cyan-500', text: 'text-cyan-400' };
    } else {
      return { score: 100, label: 'Strong', color: 'bg-emerald-500', text: 'text-emerald-400' };
    }
  };

  const strength = getPasswordStrength(password);

  const validate = () => {
    if (!fullName.trim()) {
      return 'Please enter your full name.';
    }
    if (fullName.trim().length < 2) {
      return 'Full name must be at least 2 characters.';
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim() || !emailRegex.test(email.trim())) {
      return 'Please enter a valid email address.';
    }
    if (!password) {
      return 'Please provide a password.';
    }
    if (password.length < 6) {
      return 'Password must be at least 6 characters.';
    }
    if (profession === 'Other' && !customProfession.trim()) {
      return 'Please specify your profession or engineering role.';
    }
    if (password !== confirmPassword) {
      return 'Passwords do not match.';
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    setErrorMessage('');
    setSuccessMessage('');

    const validationError = validate();
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    setLoading(true);

    const chosenProfession = profession === 'Other'
      ? (customProfession.trim() || 'Site Reliability Engineer')
      : profession;

    try {
      const data = await signUp({
        fullName: fullName.trim(),
        email: email.trim(),
        password,
        profession: chosenProfession,
      });

      // Check if session was granted or email verification is required
      if (data?.session) {
        showToast(`Welcome to SentinelMind, ${fullName.trim()}!`, 'success');
        navigateTo('dashboard');
      } else if (data?.user) {
        setSuccessMessage('Registration successful! Please check your email to verify your account or proceed to sign in.');
        showToast('Registration successful! Verify your email to continue.', 'success');
        setTimeout(() => {
          navigateTo('login');
        }, 3500);
      }
    } catch (err) {
      console.error('Signup error:', err);
      const rawMsg = (err.message || '').toLowerCase();
      if (
        rawMsg.includes('already registered') ||
        rawMsg.includes('already in use') ||
        rawMsg.includes('user already exists') ||
        rawMsg.includes('email address is already')
      ) {
        const msg = 'An account with this email already exists. Please sign in instead.';
        setErrorMessage(msg);
        showToast(msg, 'error');
      } else {
        const msg = err.message || 'Registration failed. Please check your details and try again.';
        setErrorMessage(msg);
        showToast(msg, 'error');
      }
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
          className="text-xs font-mono text-[#8BA8C2] hover:text-[#38BDF8] flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>BACK TO HOMEPAGE</span>
        </button>

        <div className="flex items-center gap-2">
          <BrainCircuit className="w-4 h-4 text-[#38BDF8]" />
          <span className="font-mono text-xs font-bold text-[#E2F3FF]">SENTINELMIND</span>
        </div>
      </div>

      {/* Main Signup Card */}
      <div className="w-full max-w-md hud-bracket bg-[#0A1320] border border-[#168DCE]/40 rounded-sm p-6 sm:p-8 shadow-[0_0_25px_rgba(22,141,206,0.18)] space-y-6 relative z-10">
        <div>
          <span className="text-[10px] font-mono text-[#38BDF8] uppercase tracking-wider font-semibold block">
            AUTHENTICATION // REGISTRATION
          </span>
          <h2 className="text-xl font-mono font-bold text-[#E2F3FF] mt-1">
            Create SRE Operator Account
          </h2>
          <p className="text-xs text-[#8BA8C2] mt-1 font-sans">
            Connect to the autonomous incident response engine and long-term memory store.
          </p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-3 rounded-sm bg-rose-950/40 border border-rose-900/60 text-rose-300 text-xs font-mono flex flex-col gap-2">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
            {errorMessage.includes('already exists') && (
              <button
                type="button"
                onClick={() => navigateTo('login')}
                className="self-start text-[11px] text-[#38BDF8] hover:underline flex items-center gap-1 font-semibold pl-6"
              >
                <span>Click here to Sign In</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>
        )}

        {/* Success Alert */}
        {successMessage && (
          <div className="p-3 rounded-sm bg-emerald-950/40 border border-emerald-900/60 text-emerald-300 text-xs font-mono flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Signup Form */}
        <form onSubmit={handleSubmit} className="space-y-4 font-mono text-xs">
          {/* Full Name */}
          <div className="space-y-1.5">
            <label className="text-[11px] text-[#8BA8C2] uppercase font-medium flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-[#38BDF8]" /> Full Name
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Alex Morgan"
              disabled={loading}
              className="w-full px-3.5 py-2.5 rounded-sm bg-[#070D18] border border-[#168DCE]/35 focus:border-[#38BDF8] focus:ring-1 focus:ring-[#38BDF8] text-[#E2F3FF] placeholder-[#8BA8C2]/40 outline-none transition-all"
            />
          </div>

          {/* Profession / Role */}
          <div className="space-y-1.5">
            <label className="text-[11px] text-[#8BA8C2] uppercase font-medium flex items-center gap-1.5">
              <Briefcase className="w-3.5 h-3.5 text-[#38BDF8]" /> Profession / Engineering Role
            </label>
            <select
              value={profession}
              onChange={(e) => setProfession(e.target.value)}
              disabled={loading}
              className="w-full px-3.5 py-2.5 rounded-sm bg-[#070D18] border border-[#168DCE]/35 focus:border-[#38BDF8] focus:ring-1 focus:ring-[#38BDF8] text-[#E2F3FF] outline-none transition-all cursor-pointer"
            >
              <option value="Site Reliability Engineer (SRE)">Site Reliability Engineer (SRE)</option>
              <option value="DevOps Engineer">DevOps Engineer</option>
              <option value="Cloud Infrastructure Architect">Cloud Infrastructure Architect</option>
              <option value="Platform / Systems Engineer">Platform / Systems Engineer</option>
              <option value="Incident Response Commander">Incident Response Commander</option>
              <option value="Backend / Distributed Systems Engineer">Backend / Distributed Systems Engineer</option>
              <option value="Full Stack Cloud Developer">Full Stack Cloud Developer</option>
              <option value="Other">Other (Custom Profession)</option>
            </select>
            {profession === 'Other' && (
              <input
                type="text"
                required
                value={customProfession}
                onChange={(e) => setCustomProfession(e.target.value)}
                placeholder="e.g. Principal Reliability Architect"
                disabled={loading}
                className="w-full mt-1.5 px-3.5 py-2 rounded-sm bg-[#070D18] border border-[#38BDF8]/60 focus:border-[#38BDF8] text-[#E2F3FF] placeholder-[#8BA8C2]/40 outline-none"
              />
            )}
          </div>

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
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8BA8C2] hover:text-[#38BDF8] transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Password Strength Indicator */}
            {password && (
              <div className="pt-1 space-y-1">
                <div className="h-1.5 w-full bg-[#070D18] rounded-full overflow-hidden border border-[#168DCE]/25">
                  <div
                    className={`h-full transition-all duration-300 ${strength.color}`}
                    style={{ width: `${strength.score}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-[#8BA8C2]">Security Strength:</span>
                  <span className={`font-bold ${strength.text}`}>{strength.label}</span>
                </div>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div className="space-y-1.5">
            <label className="text-[11px] text-[#8BA8C2] uppercase font-medium flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-[#38BDF8]" /> Confirm Password
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••••••"
                disabled={loading}
                className="w-full px-3.5 py-2.5 pr-10 rounded-sm bg-[#070D18] border border-[#168DCE]/35 focus:border-[#38BDF8] focus:ring-1 focus:ring-[#38BDF8] text-[#E2F3FF] placeholder-[#8BA8C2]/40 outline-none transition-all"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8BA8C2] hover:text-[#38BDF8] transition-colors"
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {confirmPassword && password !== confirmPassword && (
              <p className="text-[10px] text-rose-400">Passwords do not match.</p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 rounded-sm bg-gradient-to-b from-[#168DCE] to-[#0D6DA5] hover:from-[#38BDF8] hover:to-[#168DCE] border border-[#38BDF8] text-white font-bold tracking-wider uppercase text-xs flex items-center justify-center gap-2 shadow-[0_0_16px_rgba(56,189,248,0.4)] transition-all disabled:opacity-50"
          >
            {loading ? (
              <>
                <Cpu className="w-4 h-4 animate-spin text-[#38BDF8]" />
                <span>INITIALIZING SRE ACCOUNT...</span>
              </>
            ) : (
              <>
                <span>REGISTER SRE OPERATOR</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Footer Navigation */}
        <div className="pt-4 border-t border-[#168DCE]/25 text-center font-mono text-xs text-[#8BA8C2]">
          Already have an account?{' '}
          <button
            onClick={() => navigateTo('login')}
            className="text-[#38BDF8] hover:underline font-bold"
          >
            Sign In
          </button>
        </div>
      </div>
    </div>
  );
}

