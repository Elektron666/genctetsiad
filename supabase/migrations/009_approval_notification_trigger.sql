-- ============================================================
-- DB trigger: üye onaylandığında otomatik bildirim gönder
-- ============================================================
--
-- Sorun: useAdmin.ts approveMember() fonksiyonu direkt
-- notifications tablosuna INSERT yapmaya çalışıyordu, ancak
-- notifications tablosunda INSERT RLS politikası bulunmuyor
-- (yalnızca SECURITY DEFINER fonksiyonlar insert edebilir).
-- Bu yüzden bildirim hiçbir zaman gönderilmiyordu.
--
-- Çözüm: profiles UPDATE tetikleyicisi role 'pending' → onaylı
-- olduğunda SECURITY DEFINER context içinde otomatik bildirim oluşturur.

CREATE OR REPLACE FUNCTION notify_member_approval()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.role = 'pending' AND NEW.role NOT IN ('pending', 'rejected') THEN
    INSERT INTO notifications (user_id, title, body, type)
    VALUES (
      NEW.id,
      'Üyeliğiniz Onaylandı',
      'Genç TETSİAD üyesi olarak kabul edildiniz. Platformun tüm özelliklerine erişebilirsiniz.',
      'system'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_notify_member_approval
  AFTER UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION notify_member_approval();
