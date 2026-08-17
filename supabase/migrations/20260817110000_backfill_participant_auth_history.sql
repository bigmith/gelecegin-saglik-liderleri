-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: Backfill Participant Auth History (PARTICIPANT-ACTIVITY-BACKFILL-01)
-- Geleceğin Dijital Sağlık Liderleri (GDSL)
-- Tarih: 2026-08-17
-- Amaç: Yeni aktivite sistemi kurulmadan önce Supabase Auth üzerinden giriş
--        yapmış olan katılımcıların auth.users.last_sign_in_at bilgisini
--        güvenli ve idempotent şekilde core_katilimci alanlarına ve tekil
--        auth_backfill_login loguna aktarmak.
-- Kural: Gerçek giriş sayısı bilinmiyorsa uydurulmaz; 0 ise 1 yapılır,
--        zaten >0 ise değiştirilmez. Sahte detaylı aktivite logu üretilmez.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.run_participant_auth_backfill(p_dry_run boolean DEFAULT false)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  r RECORD;
  v_inspected_users integer := 0;
  v_with_last_sign_in integer := 0;
  v_backfilled_participants integer := 0;
  v_no_history_participants integer := 0;
  v_already_backfilled integer := 0;
  v_details jsonb := '[]'::jsonb;
BEGIN
  -- Profiles ile auth.users ve core_katilimci eşleşmesini tara
  FOR r IN (
    SELECT 
      k.id AS katilimci_id,
      p.id AS user_id,
      p.email,
      u.last_sign_in_at,
      k.son_giris_tarihi,
      k.ilk_giris_tarihi,
      k.son_aktivite_tarihi,
      k.giris_sayisi
    FROM public.core_katilimci k
    JOIN public.profiles p ON p.core_katilimci_id = k.id
    JOIN auth.users u ON u.id = p.id
  ) LOOP
    v_inspected_users := v_inspected_users + 1;

    IF r.last_sign_in_at IS NOT NULL THEN
      v_with_last_sign_in := v_with_last_sign_in + 1;

      IF NOT p_dry_run THEN
        -- 1. core_katilimci özet alanlarını güncelle
        UPDATE public.core_katilimci
        SET
          son_giris_tarihi = COALESCE(son_giris_tarihi, r.last_sign_in_at),
          son_aktivite_tarihi = COALESCE(son_aktivite_tarihi, r.last_sign_in_at),
          ilk_giris_tarihi = COALESCE(ilk_giris_tarihi, r.last_sign_in_at),
          giris_sayisi = CASE WHEN COALESCE(giris_sayisi, 0) = 0 THEN 1 ELSE giris_sayisi END
        WHERE id = r.katilimci_id;

        -- 2. core_katilimci_oturumlog kaydı ekle (mükerrer kayıt engellenir)
        IF NOT EXISTS (
          SELECT 1 FROM public.core_katilimci_oturumlog
          WHERE katilimci_id = r.katilimci_id AND event_type = 'auth_backfill_login'
        ) THEN
          INSERT INTO public.core_katilimci_oturumlog (
            katilimci_id,
            user_id,
            event_type,
            path,
            user_agent,
            olusturulma_tarihi
          ) VALUES (
            r.katilimci_id,
            r.user_id,
            'auth_backfill_login',
            'supabase-auth-history',
            'Supabase Auth backfill',
            r.last_sign_in_at
          );
          v_backfilled_participants := v_backfilled_participants + 1;
        ELSE
          v_already_backfilled := v_already_backfilled + 1;
        END IF;
      ELSE
        v_backfilled_participants := v_backfilled_participants + 1;
      END IF;

      v_details := v_details || jsonb_build_object(
        'katilimci_id', r.katilimci_id,
        'last_sign_in_at', r.last_sign_in_at,
        'status', 'backfilled'
      );
    ELSE
      v_no_history_participants := v_no_history_participants + 1;
      v_details := v_details || jsonb_build_object(
        'katilimci_id', r.katilimci_id,
        'status', 'no_history'
      );
    END IF;
  END LOOP;

  RETURN jsonb_build_object(
    'ok', true,
    'dry_run', p_dry_run,
    'inspected_auth_users', v_inspected_users,
    'participants_with_last_sign_in', v_with_last_sign_in,
    'participants_backfilled', v_backfilled_participants,
    'participants_without_history', v_no_history_participants,
    'already_backfilled', v_already_backfilled,
    'details', v_details
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.run_participant_auth_backfill(boolean) TO authenticated;

-- Migration anında backfill'i otomatik çalıştır
SELECT public.run_participant_auth_backfill(false);

NOTIFY pgrst, 'reload schema';
