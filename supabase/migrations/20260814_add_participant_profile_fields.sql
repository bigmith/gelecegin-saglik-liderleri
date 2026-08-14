-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: Add Detailed Participant Profile Fields & RLS
-- Geleceğin Dijital Sağlık Liderleri - PARTICIPANT-PROFILE-01
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. core_katilimci tablosuna detaylı profil kolonları ekleme
ALTER TABLE public.core_katilimci
  ADD COLUMN IF NOT EXISTS telefon text NULL,
  ADD COLUMN IF NOT EXISTS adres text NULL,
  ADD COLUMN IF NOT EXISTS okul_bilgisi text NULL,
  ADD COLUMN IF NOT EXISTS egitim_durumu varchar(100) NULL,
  ADD COLUMN IF NOT EXISTS is_durumu varchar(100) NULL,
  ADD COLUMN IF NOT EXISTS calistigi_kurum text NULL,
  ADD COLUMN IF NOT EXISTS pozisyon text NULL,
  ADD COLUMN IF NOT EXISTS is_aciklamasi text NULL,
  ADD COLUMN IF NOT EXISTS profil_fotografi_url text NULL,
  ADD COLUMN IF NOT EXISTS profil_fotografi_file_id text NULL,
  ADD COLUMN IF NOT EXISTS profil_guncelleme_tarihi timestamptz NULL;

-- 2. profiles tablosuna avatar_url ve telefon desteği
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS avatar_url text NULL,
  ADD COLUMN IF NOT EXISTS telefon text NULL;

-- 3. İndeksler (Performans için)
CREATE INDEX IF NOT EXISTS idx_core_katilimci_egitim ON public.core_katilimci(egitim_durumu);
CREATE INDEX IF NOT EXISTS idx_core_katilimci_is ON public.core_katilimci(is_durumu);

-- 4. RLS: Katılımcının kendi profilini güncelleyebilme politikası
DROP POLICY IF EXISTS "SEC02 Katilimci Kendi Profilini Gunceller" ON public.core_katilimci;
CREATE POLICY "SEC02 Katilimci Kendi Profilini Gunceller"
ON public.core_katilimci FOR UPDATE
USING (
  public.is_admin()
  OR id = public.current_katilimci_id()
  OR (user_id IS NOT NULL AND user_id = auth.uid())
)
WITH CHECK (
  public.is_admin()
  OR id = public.current_katilimci_id()
  OR (user_id IS NOT NULL AND user_id = auth.uid())
);
