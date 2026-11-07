import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../services/supabase';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);

  // Fetch or safely initialize profile record
  const fetchProfile = async (userId, userEmail, userMeta) => {
    if (!userId) return null;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (data) {
        setProfile(data);
        return data;
      }

      // If no profile record exists yet, safely create one
      const resolvedName = userMeta?.full_name || userMeta?.name || userEmail?.split('@')[0] || 'SRE Operator';
      const resolvedRole = userMeta?.role || userMeta?.profession || 'Site Reliability Engineer (SRE)';
      const newProfile = {
        id: userId,
        user_id: userId,
        email: userEmail,
        full_name: resolvedName,
        role: resolvedRole,
        created_at: new Date().toISOString(),
      };

      const { data: inserted, error: insertError } = await supabase
        .from('profiles')
        .upsert(newProfile)
        .select()
        .maybeSingle();

      const finalProfile = inserted || newProfile;
      setProfile(finalProfile);
      return finalProfile;
    } catch (err) {
      console.warn('Profile fetch/init warning:', err);
      const fallbackProfile = {
        id: userId,
        email: userEmail,
        full_name: userMeta?.full_name || userEmail?.split('@')[0] || 'SRE Operator',
        role: userMeta?.role || userMeta?.profession || 'Site Reliability Engineer (SRE)',
      };
      setProfile(fallbackProfile);
      return fallbackProfile;
    }
  };

  useEffect(() => {
    // 1. Get initial active session
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      setSession(initialSession);
      setUser(initialSession?.user ?? null);
      if (initialSession?.user) {
        fetchProfile(
          initialSession.user.id,
          initialSession.user.email,
          initialSession.user.user_metadata
        );
      }
      setLoading(false);
    });

    // 2. Listen to real-time auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      setSession(currentSession);
      setUser(currentSession?.user ?? null);

      if (event === 'PASSWORD_RECOVERY') {
        setIsRecoveryMode(true);
      }

      if (currentSession?.user) {
        await fetchProfile(
          currentSession.user.id,
          currentSession.user.email,
          currentSession.user.user_metadata
        );
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Sign up with Supabase Auth & create profile
  const signUp = async ({ fullName, email, password, profession }) => {
    const chosenRole = profession?.trim() || 'Site Reliability Engineer (SRE)';
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role: chosenRole,
          profession: chosenRole,
        },
      },
    });

    if (error) throw error;

    if (data?.user) {
      // Safe creation of profile record
      try {
        await fetchProfile(data.user.id, data.user.email, { full_name: fullName, role: chosenRole });
      } catch (e) {
        console.warn('Profile record creation deferred:', e);
      }
    }

    return data;
  };

  // Sign in with email & password
  const signIn = async ({ email, password }) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    if (data?.user) {
      await fetchProfile(data.user.id, data.user.email, data.user.user_metadata);
    }

    return data;
  };

  // Sign out
  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    if (error) throw error;
  };

  // Send real password reset email
  const resetPassword = async (email) => {
    const redirectUrl = `${window.location.origin}`;
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl,
    });
    if (error) throw error;
    return data;
  };

  // Update profile full name and profession/role
  const updateProfile = async ({ fullName, role }) => {
    if (!user) throw new Error('No authenticated user session');

    const updateMeta = {};
    if (fullName) updateMeta.full_name = fullName;
    if (role) {
      updateMeta.role = role;
      updateMeta.profession = role;
    }

    // 1. Update Supabase Auth user metadata
    const { error: authError } = await supabase.auth.updateUser({
      data: updateMeta,
    });
    if (authError) throw authError;

    // 2. Update profiles table record
    const profileUpdate = { updated_at: new Date().toISOString() };
    if (fullName) profileUpdate.full_name = fullName;
    if (role) profileUpdate.role = role;

    const { data, error: profileError } = await supabase
      .from('profiles')
      .update(profileUpdate)
      .eq('id', user.id)
      .select()
      .maybeSingle();

    if (profileError) {
      console.warn('Could not update profiles table directly, updating local state:', profileError);
    }

    // Immediately reflect new name and role in profile state
    setProfile((prev) => ({
      ...prev,
      ...(fullName ? { full_name: fullName } : {}),
      ...(role ? { role } : {}),
    }));

    return data || { full_name: fullName, role };
  };

  // Update password
  const updatePassword = async (newPassword) => {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    if (error) throw error;
    return data;
  };

  // Verify 6-digit password recovery OTP
  const verifyRecoveryOtp = async ({ email, token }) => {
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'recovery',
    });
    if (error) throw error;
    return data;
  };

  // Permanently delete user account and associated data
  const deleteAccount = async () => {
    if (!user) throw new Error('No authenticated user session');
    const currentUserId = user.id;
    const currentToken = session?.access_token;

    // 1. Delete user profile directly from Supabase
    try {
      await supabase.from('profiles').delete().eq('id', currentUserId);
    } catch (e) {
      console.warn('Profile record delete warning:', e);
    }

    // 2. Delete user incidents from Supabase
    try {
      await supabase.from('incidents').delete().eq('organization_id', currentUserId);
    } catch (e) {
      console.warn('Incidents delete warning:', e);
    }

    // 3. Attempt Postgres RPC delete_user_account (purges auth.users when migration 003 applied)
    try {
      await supabase.rpc('delete_user_account');
    } catch (e) {
      console.warn('Supabase RPC delete_user_account warning:', e);
    }

    // 4. Call backend account purge endpoint
    try {
      await fetch('/api/settings/account', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(currentToken ? { Authorization: `Bearer ${currentToken}` } : {}),
        },
      });
    } catch (e) {
      console.warn('Backend purge warning:', e);
    }

    // 5. Sign out from Supabase Auth
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.warn('Sign out warning:', e);
    }

    // 6. Reset all auth states
    setUser(null);
    setSession(null);
    setProfile(null);
    setIsRecoveryMode(false);
    localStorage.clear();
    sessionStorage.clear();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        loading,
        isRecoveryMode,
        setIsRecoveryMode,
        signUp,
        signIn,
        signOut,
        deleteAccount,
        resetPassword,
        verifyRecoveryOtp,
        updateProfile,
        updatePassword,
        fetchProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}

