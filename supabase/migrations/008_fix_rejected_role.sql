-- ============================================================
-- Fix: 'rejected' role should be excluded everywhere 'pending' is
-- ============================================================

-- 1. Prevent member_code from being assigned to rejected users.
--    The assign_member_code trigger fires when role changes from
--    'pending' to any other value, including 'rejected'.
CREATE OR REPLACE FUNCTION assign_member_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role NOT IN ('pending', 'rejected') AND OLD.role = 'pending' AND NEW.member_code IS NULL THEN
    NEW.member_code := generate_member_code();
  END IF;
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. get_push_recipients: exclude rejected users from push targets
CREATE OR REPLACE FUNCTION get_push_recipients(roles_filter member_role[] DEFAULT NULL)
RETURNS TABLE (user_id UUID, token TEXT) AS $$
  SELECT id, expo_push_token
  FROM profiles
  WHERE expo_push_token IS NOT NULL
    AND push_enabled = TRUE
    AND role NOT IN ('pending', 'rejected')
    AND (roles_filter IS NULL OR role = ANY(roles_filter));
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 3. insert_broadcast_notifications: exclude rejected users from inbox
CREATE OR REPLACE FUNCTION insert_broadcast_notifications(
  p_title TEXT,
  p_body TEXT,
  p_type notif_type,
  p_related_id UUID,
  p_roles_filter member_role[] DEFAULT NULL
)
RETURNS INT AS $$
DECLARE
  inserted_count INT;
BEGIN
  INSERT INTO notifications (user_id, title, body, type, related_id)
  SELECT id, p_title, p_body, p_type, p_related_id
  FROM profiles
  WHERE role NOT IN ('pending', 'rejected')
    AND (p_roles_filter IS NULL OR role = ANY(p_roles_filter));

  GET DIAGNOSTICS inserted_count = ROW_COUNT;
  RETURN inserted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
