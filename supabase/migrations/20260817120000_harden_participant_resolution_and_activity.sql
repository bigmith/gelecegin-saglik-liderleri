-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: Harden Participant Resolution, Activity Tracking & DB Integrity
-- Task: PARTICIPANT-E2E-DEFNE-FIX-01
-- Tarih: 2026-08-17
-- Amaç: profiles.core_katilimci_id ve core_katilimciperformans ilişkilerini
--        kalıcı olarak onaran ve self-healing yeteneğine sahip
--        güncellenmiş record_participant_activity fonksiyonu.
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Mevcut tüm katılımcılar için profiles.core_katilimci_id onarımı
DO $$
DECLARE
  r RECORD;
BEGIN
  -- Email üzerinden core_aday -> core_katilimci eşleşmesi olan ama profiles.core_katilimci_id'si boş olan profilleri bağla
  FOR r IN (
    SELECT 
      p.id AS profile_user_id,
      p.email AS profile_email,
      k.id AS katilimci_id,
      a.id AS aday_id
    FROM public.profiles p
    JOIN public.core_aday a ON LOWER(a.eposta) = LOWER(p.email) AND a.basvuru_durumu = 'ONAYLANDI'
    JOIN public.core_katilimci k ON k.aday_id = a.id
    WHERE p.core_katilimci_id IS NULL OR p.core_katilimci_id != k.id
  ) LOOP
    UPDATE public.profiles
    SET 
      core_katilimci_id = r.katilimci_id,
      role = 'katilimci',
      updated_at = now()
    WHERE id = r.profile_user_id;
  END LOOP;

  -- Eksik core_katilimciperformans satırlarını oluştur
  INSERT INTO public.core_katilimciperformans (
    katilimci_id,
    bireysel_puan,
    gorev_puani,
    toplanti_katilim_puani,
    etkilesim_bonus_puani,
    manuel_puan,
    admin_ici_not,
    katilimciya_gorunen_not,
    olusturulma_tarihi,
    guncellenme_tarihi
  )
  SELECT 
    k.id,
    0, 0, 0, 0, 0,
    '', '',
    now(), now()
  FROM public.core_katilimci k
  WHERE NOT EXISTS (
    SELECT 1 FROM public.core_katilimciperformans p WHERE p.katilimci_id = k.id
  );

  -- Defne Tufan ve diğer katılımcılar için auth.users.last_sign_in_at backfill'ini tekrar çalıştır
  FOR r IN (
    SELECT 
      k.id AS katilimci_id,
      p.id AS user_id,
      u.last_sign_in_at
    FROM public.core_katilimci k
    JOIN public.profiles p ON p.core_katilimci_id = k.id
    JOIN auth.users u ON u.id = p.id
    WHERE u.last_sign_in_at IS NOT NULL
  ) LOOP
    UPDATE public.core_katilimci
    SET
      son_giris_tarihi = COALESCE(son_giris_tarihi, r.last_sign_in_at),
      son_aktivite_tarihi = COALESCE(son_aktivite_tarihi, r.last_sign_in_at),
      ilk_giris_tarihi = COALESCE(ilk_giris_tarihi, r.last_sign_in_at),
      giris_sayisi = CASE WHEN COALESCE(giris_sayisi, 0) = 0 THEN 1 ELSE giris_sayisi END
    WHERE id = r.katilimci_id;

    IF NOT EXISTS (
      SELECT 1 FROM public.core_katilimci_oturumlog
      WHERE katilimci_id = r.katilimci_id
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
    END IF;
  END LOOP;
END;
$$;

-- 2. Self-Healing record_participant_activity fonksiyonu
CREATE OR REPLACE FUNCTION public.record_participant_activity(
  p_event_type text,
  p_path text DEFAULT NULL,
  p_user_agent text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_role text;
  v_katilimci_id bigint;
  v_user_email text;
  v_now timestamptz := now();
BEGIN
  -- 1. Oturum kontrolü
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Aktif oturum bulunamadı');
  END IF;

  -- 2. Profiles tablosundan rol, core_katilimci_id ve email çek
  SELECT role, core_katilimci_id, email INTO v_role, v_katilimci_id, v_user_email
  FROM public.profiles
  WHERE id = v_user_id;

  IF v_user_email IS NULL THEN
    SELECT email INTO v_user_email FROM auth.users WHERE id = v_user_id;
  END IF;

  -- 3. Self-Healing: Eğer core_katilimci_id profiles tablosunda yoksa otomatik bağla
  IF v_katilimci_id IS NULL AND v_user_email IS NOT NULL THEN
    -- email -> core_aday (ONAYLANDI) -> core_katilimci
    SELECT k.id INTO v_katilimci_id
    FROM public.core_katilimci k
    JOIN public.core_aday a ON a.id = k.aday_id
    WHERE LOWER(a.eposta) = LOWER(v_user_email) AND a.basvuru_durumu = 'ONAYLANDI'
    ORDER BY k.id DESC
    LIMIT 1;

    -- Onarım: profiles tablosuna core_katilimci_id ve rol yaz
    IF v_katilimci_id IS NOT NULL THEN
      UPDATE public.profiles
      SET core_katilimci_id = v_katilimci_id, role = 'katilimci', updated_at = v_now
      WHERE id = v_user_id;
    END IF;
  END IF;

  -- Katılımcı bulunamadıysa veya admin/mentor ise sessizce atla
  IF v_katilimci_id IS NULL OR LOWER(COALESCE(v_role, 'katilimci')) != 'katilimci' THEN
    RETURN jsonb_build_object('ok', true, 'skipped', true, 'reason', 'Not a participant or unlinked');
  END IF;

  -- 4. Oturum log kaydı ekle
  INSERT INTO public.core_katilimci_oturumlog (
    katilimci_id,
    user_id,
    event_type,
    path,
    user_agent,
    olusturulma_tarihi
  ) VALUES (
    v_katilimci_id,
    v_user_id,
    COALESCE(p_event_type, 'activity_ping'),
    p_path,
    p_user_agent,
    v_now
  );

  -- 5. core_katilimci özet alanlarını güncelle
  IF p_event_type IN ('login', 'password_recovery_login') THEN
    UPDATE public.core_katilimci
    SET
      son_aktivite_tarihi = v_now,
      son_giris_tarihi = v_now,
      ilk_giris_tarihi = COALESCE(ilk_giris_tarihi, v_now),
      giris_sayisi = COALESCE(giris_sayisi, 0) + 1
    WHERE id = v_katilimci_id;
  ELSE
    UPDATE public.core_katilimci
    SET son_aktivite_tarihi = v_now
    WHERE id = v_katilimci_id;
  END IF;

  RETURN jsonb_build_object(
    'ok', true,
    'katilimci_id', v_katilimci_id,
    'event_type', p_event_type,
    'recorded_at', v_now
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.record_participant_activity(text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.record_participant_activity(text, text, text) TO anon;

NOTIFY pgrst, 'reload schema';
