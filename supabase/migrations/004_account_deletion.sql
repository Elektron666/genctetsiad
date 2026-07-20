-- ============================================================
-- Hesap silme (Google Play + App Store zorunluluğu)
-- Kullanıcı yalnızca KENDİ hesabını silebilir.
-- profiles → auth.users'a CASCADE bağlı olduğundan tüm veriler
-- (profil, katılımlar, kayıtlar, mentorluk, token) birlikte silinir.
-- ============================================================

CREATE OR REPLACE FUNCTION delete_own_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;
  DELETE FROM auth.users WHERE id = auth.uid();
END;
$$;

REVOKE EXECUTE ON FUNCTION delete_own_account() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION delete_own_account() FROM anon;
GRANT  EXECUTE ON FUNCTION delete_own_account() TO authenticated;
