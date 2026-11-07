import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import {
  User,
  Mail,
  Calendar,
  Lock,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Save,
  Cpu,
  KeyRound,
  Bell,
  Eye,
  EyeOff,
  Sparkles,
  Sliders,
  Trash2,
  AlertTriangle,
  X
} from 'lucide-react';

export default function ProfileSettingsPage() {
  const { showToast, profileTab, navigateTo } = useApp();
  const { user, profile, updateProfile, updatePassword, resetPassword, deleteAccount } = useAuth();

  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('Site Reliability Engineer (SRE)');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');

  // Password change state
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Delete Account modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmInput, setDeleteConfirmInput] = useState('');
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [deleteError, setDeleteError] = useState('');

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
  const strength = getPasswordStrength(newPassword);

  // Active tab inside settings: 'profile' | 'security' | 'preferences'
  const [activeTab, setActiveTab] = useState(profileTab || 'profile');

  useEffect(() => {
    if (profileTab) {
      setActiveTab(profileTab);
    }
  }, [profileTab]);

  // Notification preferences state
  const [preferences, setPreferences] = useState({
    emailCriticalAlerts: true,
    hindsightAutoRetain: true,
    hudSoundEffects: false,
    telemetryRefreshRate: '30s',
  });

  useEffect(() => {
    if (profile?.full_name) {
      setFullName(profile.full_name);
    } else if (user?.user_metadata?.full_name) {
      setFullName(user.user_metadata.full_name);
    } else if (user?.email) {
      setFullName(user.email.split('@')[0]);
    }

    if (profile?.role) {
      setRole(profile.role);
    } else if (user?.user_metadata?.role || user?.user_metadata?.profession) {
      setRole(user.user_metadata.role || user.user_metadata.profession);
    }
  }, [profile, user]);

  // Derive initials for avatar
  const getInitials = (name) => {
    if (!name) return 'SO';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (savingProfile) return;

    setProfileError('');
    setProfileSuccess('');

    if (!fullName.trim() || fullName.trim().length < 2) {
      setProfileError('Full name must be at least 2 characters.');
      return;
    }

    setSavingProfile(true);

    try {
      await updateProfile({ fullName: fullName.trim(), role: role.trim() });
      showToast('Profile saved successfully.', 'success');
    } catch (err) {
      console.error('Update profile error:', err);
      const msg = err.message || 'Failed to update profile. Please try again.';
      setProfileError(msg);
      showToast(msg, 'error');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (savingPassword) return;

    setPasswordError('');
    setPasswordSuccess('');

    if (!newPassword || newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setPasswordError('Passwords do not match.');
      return;
    }

    setSavingPassword(true);

    try {
      await updatePassword(newPassword);
      showToast('Account password updated securely.', 'success');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (err) {
      console.error('Update password error:', err);
      const msg = err.message || 'Failed to update password.';
      setPasswordError(msg);
      showToast(msg, 'error');
    } finally {
      setSavingPassword(false);
    }
  };

  const handleDeleteAccount = async (e) => {
    if (e) e.preventDefault();
    if (isDeletingAccount) return;

    if (deleteConfirmInput.trim().toUpperCase() !== 'DELETE') {
      setDeleteError('Please type DELETE to confirm permanent account purge.');
      return;
    }

    setDeleteError('');
    setIsDeletingAccount(true);

    try {
      await deleteAccount();
      showToast('Account and all operator records permanently deleted.', 'success');
      navigateTo('landing');
    } catch (err) {
      console.error('Delete account error:', err);
      const msg = err.message || 'Failed to delete account. Please try again.';
      setDeleteError(msg);
      showToast(msg, 'error');
      setIsDeletingAccount(false);
    }
  };

  const formattedDate = user?.created_at
    ? new Date(user.created_at).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'Active Since 2026';

  const userInitials = getInitials(fullName || profile?.full_name || user?.email);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#168DCE]/25">
        <div>
          <span className="text-[10px] font-mono text-[#38BDF8] uppercase tracking-wider font-semibold block">
            USER CONFIGURATION // OPERATOR IDENTITY
          </span>
          <h1 className="text-xl font-mono font-bold text-[#E2F3FF]">
            Profile & Account Settings
          </h1>
          <p className="text-xs text-[#8BA8C2] font-mono mt-0.5">
            Manage your authenticated SRE credentials, profile metadata, and interface preferences
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 text-xs font-mono">
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-3 py-1.5 rounded-sm border transition-all ${
              activeTab === 'profile'
                ? 'bg-[#168DCE]/30 border-[#38BDF8] text-[#E2F3FF]'
                : 'bg-[#0A1320] border-[#168DCE]/30 text-[#8BA8C2] hover:text-[#E2F3FF]'
            }`}
          >
            My Profile
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`px-3 py-1.5 rounded-sm border transition-all ${
              activeTab === 'security'
                ? 'bg-[#168DCE]/30 border-[#38BDF8] text-[#E2F3FF]'
                : 'bg-[#0A1320] border-[#168DCE]/30 text-[#8BA8C2] hover:text-[#E2F3FF]'
            }`}
          >
            Security
          </button>
          <button
            onClick={() => setActiveTab('preferences')}
            className={`px-3 py-1.5 rounded-sm border transition-all ${
              activeTab === 'preferences'
                ? 'bg-[#168DCE]/30 border-[#38BDF8] text-[#E2F3FF]'
                : 'bg-[#0A1320] border-[#168DCE]/30 text-[#8BA8C2] hover:text-[#E2F3FF]'
            }`}
          >
            Preferences
          </button>
        </div>
      </div>

      {/* Main Settings Body */}
      {activeTab === 'profile' && (
        <div className="space-y-6">
          {/* Identity Overview Card */}
          <div className="hud-bracket bg-[#0A1320] border border-[#168DCE]/35 rounded-sm p-6 shadow-[0_0_20px_rgba(22,141,206,0.12)]">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
              {/* Circular Avatar */}
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#168DCE] via-[#0D6DA5] to-[#070D18] border-2 border-[#38BDF8] flex items-center justify-center text-[#E2F3FF] font-mono text-2xl font-bold shrink-0 shadow-[0_0_20px_rgba(56,189,248,0.4)]">
                {userInitials}
              </div>

              <div className="flex-1 text-center sm:text-left space-y-1 font-mono">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <h2 className="text-lg font-bold text-[#E2F3FF]">
                    {fullName || profile?.full_name || 'SRE Operator'}
                  </h2>
                  <span className="text-[10px] px-2 py-0.5 rounded-sm bg-[#168DCE]/20 border border-[#38BDF8]/40 text-[#38BDF8] font-bold inline-block">
                    {profile?.role || 'Lead DevOps / SRE'}
                  </span>
                </div>
                <p className="text-xs text-[#8BA8C2] flex items-center justify-center sm:justify-start gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-[#38BDF8]" />
                  <span>{user?.email || 'operator@sentinelmind.ai'}</span>
                </p>
                <p className="text-[11px] text-[#8BA8C2] flex items-center justify-center sm:justify-start gap-1.5 pt-1">
                  <Calendar className="w-3.5 h-3.5 text-[#38BDF8]" />
                  <span>Member Since: {formattedDate}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Edit Profile Form */}
          <div className="hud-bracket bg-[#0A1320] border border-[#168DCE]/35 rounded-sm p-6 shadow-[0_0_15px_rgba(22,141,206,0.1)] space-y-4">
            <div className="border-b border-[#168DCE]/25 pb-3">
              <h3 className="text-xs font-mono font-bold text-[#E2F3FF] uppercase tracking-wide flex items-center gap-2">
                <User className="w-3.5 h-3.5 text-[#38BDF8]" />
                <span>Edit Operator Profile</span>
              </h3>
            </div>

            {profileError && (
              <div className="p-3 rounded-sm bg-rose-950/40 border border-rose-900/60 text-rose-300 text-xs font-mono flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{profileError}</span>
              </div>
            )}

            <form onSubmit={handleUpdateProfile} className="space-y-4 font-mono text-xs">
              <div className="space-y-1.5">
                <label className="text-[11px] text-[#8BA8C2] uppercase font-medium">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter full name"
                  disabled={savingProfile}
                  className="w-full px-3.5 py-2.5 rounded-sm bg-[#070D18] border border-[#168DCE]/35 focus:border-[#38BDF8] text-[#E2F3FF] outline-none transition-all"
                />
                <p className="text-[10px] text-[#8BA8C2] mt-1">
                  Updates your display name across the application and in the sidebar profile badge.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] text-[#8BA8C2] uppercase font-medium">
                  Profession / Engineering Role
                </label>
                <input
                  type="text"
                  required
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder="e.g. Site Reliability Engineer (SRE)"
                  disabled={savingProfile}
                  className="w-full px-3.5 py-2.5 rounded-sm bg-[#070D18] border border-[#168DCE]/35 focus:border-[#38BDF8] text-[#E2F3FF] outline-none transition-all"
                />
                <p className="text-[10px] text-[#8BA8C2] mt-1">
                  Your primary role in incident response and infrastructure management.
                </p>
              </div>

              <div className="space-y-1.5 opacity-75">
                <label className="text-[11px] text-[#8BA8C2] uppercase font-medium">
                  Registered Email Address (Read Only)
                </label>
                <input
                  type="email"
                  disabled
                  value={user?.email || ''}
                  className="w-full px-3.5 py-2.5 rounded-sm bg-[#070D18]/70 border border-[#168DCE]/20 text-[#8BA8C2] cursor-not-allowed outline-none font-mono"
                />
                <p className="text-[10px] text-[#8BA8C2] mt-1">
                  Managed via Supabase Authentication identity provider.
                </p>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="px-5 py-2.5 rounded-sm bg-gradient-to-b from-[#168DCE] to-[#0D6DA5] hover:from-[#38BDF8] hover:to-[#168DCE] border border-[#38BDF8] text-white font-bold tracking-wider text-xs flex items-center gap-2 shadow-[0_0_12px_rgba(56,189,248,0.35)] transition-all disabled:opacity-50"
                >
                  {savingProfile ? (
                    <>
                      <Cpu className="w-3.5 h-3.5 animate-spin" />
                      <span>SAVING CHANGES...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      <span>SAVE CHANGES</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Security Tab */}
      {activeTab === 'security' && (
        <div className="space-y-6">
          <div className="hud-bracket bg-[#0A1320] border border-[#168DCE]/35 rounded-sm p-6 shadow-[0_0_15px_rgba(22,141,206,0.1)] space-y-4">
            <div className="border-b border-[#168DCE]/25 pb-3">
              <h3 className="text-xs font-mono font-bold text-[#E2F3FF] uppercase tracking-wide flex items-center gap-2">
                <KeyRound className="w-3.5 h-3.5 text-[#38BDF8]" />
                <span>Update Account Password</span>
              </h3>
            </div>

            {passwordError && (
              <div className="p-3 rounded-sm bg-rose-950/40 border border-rose-900/60 text-rose-300 text-xs font-mono flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{passwordError}</span>
              </div>
            )}

            <form onSubmit={handleUpdatePassword} className="space-y-4 font-mono text-xs">
              <div className="space-y-1.5">
                <label className="text-[11px] text-[#8BA8C2] uppercase font-medium">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter at least 6 characters"
                    disabled={savingPassword}
                    className="w-full px-3.5 py-2.5 pr-10 rounded-sm bg-[#070D18] border border-[#168DCE]/35 focus:border-[#38BDF8] text-[#E2F3FF] outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8BA8C2] hover:text-[#38BDF8]"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Password Strength Indicator */}
                {newPassword && (
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

              <div className="space-y-1.5">
                <label className="text-[11px] text-[#8BA8C2] uppercase font-medium">
                  Confirm New Password
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  placeholder="Repeat new password"
                  disabled={savingPassword}
                  className="w-full px-3.5 py-2.5 rounded-sm bg-[#070D18] border border-[#168DCE]/35 focus:border-[#38BDF8] text-[#E2F3FF] outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={savingPassword}
                  className="px-5 py-2.5 rounded-sm bg-gradient-to-b from-[#168DCE] to-[#0D6DA5] hover:from-[#38BDF8] border border-[#38BDF8] text-white font-bold text-xs flex items-center gap-2 disabled:opacity-50"
                >
                  {savingPassword ? 'UPDATING CREDENTIALS...' : 'UPDATE PASSWORD'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Preferences Tab */}
      {activeTab === 'preferences' && (
        <div className="hud-bracket bg-[#0A1320] border border-[#168DCE]/35 rounded-sm p-6 shadow-[0_0_15px_rgba(22,141,206,0.1)] space-y-5 font-mono text-xs">
          <div className="border-b border-[#168DCE]/25 pb-3">
            <h3 className="text-xs font-bold text-[#E2F3FF] uppercase tracking-wide flex items-center gap-2">
              <Sliders className="w-3.5 h-3.5 text-[#38BDF8]" />
              <span>SRE Interface & Alerting Preferences</span>
            </h3>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-3.5 rounded-sm bg-[#070D18] border border-[#168DCE]/25">
              <div>
                <span className="text-[#E2F3FF] font-bold block">Email Critical Outage Alerts</span>
                <span className="text-[11px] text-[#8BA8C2]">Dispatches notifications when severity reaches CRITICAL</span>
              </div>
              <input
                type="checkbox"
                checked={preferences.emailCriticalAlerts}
                onChange={(e) => setPreferences({ ...preferences, emailCriticalAlerts: e.target.checked })}
                className="w-4 h-4 accent-[#38BDF8]"
              />
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-sm bg-[#070D18] border border-[#168DCE]/25">
              <div>
                <span className="text-[#E2F3FF] font-bold block">Hindsight Auto-Retain Experiences</span>
                <span className="text-[11px] text-[#8BA8C2]">Automatically commits verified fixes into the vector memory store</span>
              </div>
              <input
                type="checkbox"
                checked={preferences.hindsightAutoRetain}
                onChange={(e) => setPreferences({ ...preferences, hindsightAutoRetain: e.target.checked })}
                className="w-4 h-4 accent-[#38BDF8]"
              />
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-sm bg-[#070D18] border border-[#168DCE]/25">
              <div>
                <span className="text-[#E2F3FF] font-bold block">Telemetry Polling Rate</span>
                <span className="text-[11px] text-[#8BA8C2]">Frequency of background metric synchronization</span>
              </div>
              <select
                value={preferences.telemetryRefreshRate}
                onChange={(e) => setPreferences({ ...preferences, telemetryRefreshRate: e.target.value })}
                className="px-3 py-1.5 rounded-sm bg-[#0A1320] border border-[#168DCE]/35 text-[#38BDF8] outline-none"
              >
                <option value="10s">10 seconds (High Precision)</option>
                <option value="30s">30 seconds (Standard)</option>
                <option value="60s">60 seconds (Consolidated)</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Danger Zone: Permanent Account Deletion */}
      <div className="hud-bracket bg-[#14080E] border border-rose-900/60 rounded-sm p-6 shadow-[0_0_25px_rgba(244,63,94,0.18)] space-y-4 font-mono">
        <div className="border-b border-rose-900/40 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <span className="text-[10px] text-rose-400 uppercase tracking-wider font-semibold block">
              DANGER ZONE // PERMANENT OPERATOR PURGE
            </span>
            <h3 className="text-xs font-bold text-rose-200 uppercase tracking-wide flex items-center gap-2 mt-0.5">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
              <span>Delete Operator Account</span>
            </h3>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded-sm bg-rose-950/60 border border-rose-800/60 text-rose-400 w-fit">
            PERMANENT ACTION
          </span>
        </div>

        <p className="text-xs text-[#8BA8C2] leading-relaxed font-sans">
          Permanently delete your SentinelMind account, all registered profile details, active and past incidents, telemetry logs, and dedicated Hindsight vector memories. This action is irreversible.
        </p>

        <div className="pt-2 flex justify-end">
          <button
            type="button"
            onClick={() => {
              setDeleteConfirmInput('');
              setDeleteError('');
              setIsDeleteModalOpen(true);
            }}
            className="px-4 py-2.5 rounded-sm bg-rose-950/70 hover:bg-rose-900 border border-rose-600/70 text-rose-200 hover:text-white font-bold text-xs flex items-center gap-2 shadow-[0_0_15px_rgba(244,63,94,0.3)] transition-all cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-400" />
            <span>DELETE ACCOUNT PERMANENTLY</span>
          </button>
        </div>
      </div>

      {/* PERMANENT ACCOUNT DELETION CONFIRMATION MODAL */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="w-full max-w-md hud-bracket bg-[#0D0509] border-2 border-rose-600/80 rounded-sm p-6 sm:p-7 shadow-[0_0_40px_rgba(244,63,94,0.4)] space-y-4 font-mono text-xs relative">
            {/* Close button */}
            <button
              onClick={() => setIsDeleteModalOpen(false)}
              disabled={isDeletingAccount}
              className="absolute right-4 top-4 text-[#8BA8C2] hover:text-[#E2F3FF] p-1 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header */}
            <div className="flex items-center gap-2.5 text-rose-400">
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 animate-pulse" />
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-rose-200">
                  Confirm Permanent Account Purge
                </h3>
                <span className="text-[10px] text-rose-400/80 font-mono">
                  ALL OPERATOR DETAILS WILL BE PERMANENTLY ERASED
                </span>
              </div>
            </div>

            {deleteError && (
              <div className="p-2.5 rounded-sm bg-rose-950/80 border border-rose-700 text-rose-200 text-[11px] flex items-start gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                <span>{deleteError}</span>
              </div>
            )}

            <div className="p-3 rounded-sm bg-[#180910] border border-rose-900/50 space-y-2 text-[#8BA8C2] text-[11px]">
              <p className="text-rose-300 font-semibold">
                You are about to permanently purge the following:
              </p>
              <ul className="list-disc list-inside space-y-1 text-[10px] text-[#8BA8C2]">
                <li>Authenticated Supabase operator profile (<strong className="text-white">{user?.email}</strong>)</li>
                <li>All incident investigations, RCAs, and resolution logs</li>
                <li>Isolated Hindsight memory bank (<strong className="text-cyan-400">{profile?.role || 'SRE'} workspace</strong>)</li>
                <li>All telemetry records and diagnostic assistant history</li>
              </ul>
            </div>

            <form onSubmit={handleDeleteAccount} className="space-y-3.5 pt-1">
              <div className="space-y-1.5">
                <label className="text-[10px] text-rose-300 uppercase font-bold block">
                  Type <span className="underline text-white font-bold">DELETE</span> to confirm:
                </label>
                <input
                  type="text"
                  required
                  value={deleteConfirmInput}
                  onChange={(e) => setDeleteConfirmInput(e.target.value)}
                  placeholder="DELETE"
                  disabled={isDeletingAccount}
                  className="w-full px-3 py-2.5 rounded-sm bg-[#070D18] border-2 border-rose-700/60 focus:border-rose-500 text-rose-100 placeholder-rose-900/50 font-mono text-center tracking-widest text-sm outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-rose-900/40">
                <button
                  type="button"
                  onClick={() => setIsDeleteModalOpen(false)}
                  disabled={isDeletingAccount}
                  className="px-3.5 py-2 rounded-sm bg-[#070D18] border border-[#168DCE]/30 text-[#8BA8C2] hover:text-[#E2F3FF] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isDeletingAccount || deleteConfirmInput.trim().toUpperCase() !== 'DELETE'}
                  className="px-4 py-2 rounded-sm bg-gradient-to-b from-rose-600 to-rose-900 hover:from-rose-500 hover:to-rose-800 border border-rose-400 text-white font-bold flex items-center gap-1.5 shadow-[0_0_15px_rgba(244,63,94,0.4)] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  {isDeletingAccount ? (
                    <>
                      <Cpu className="w-3.5 h-3.5 animate-spin" />
                      <span>PURGING ACCOUNT...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>PERMANENTLY PURGE MY ACCOUNT</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
