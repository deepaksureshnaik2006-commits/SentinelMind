-- ============================================================================
-- Migration 003: Delete User Account Procedure (Self-Service Purge)
-- Allows an authenticated user to permanently delete their own account and
-- all associated incidents, logs, and profile records from Supabase.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.delete_user_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_uid UUID;
BEGIN
  current_uid := auth.uid();
  IF current_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- 1. Delete user-owned profile
  DELETE FROM public.profiles WHERE id = current_uid;

  -- 2. Delete user-owned incidents
  DELETE FROM public.incidents WHERE organization_id = current_uid;

  -- 3. Delete user feedback
  DELETE FROM public.feedback WHERE user_id = current_uid;

  -- 4. Delete user credentials from auth.users (requires SECURITY DEFINER)
  DELETE FROM auth.users WHERE id = current_uid;
END;
$$;

-- Grant execution to all authenticated operators
GRANT EXECUTE ON FUNCTION public.delete_user_account() TO authenticated;

