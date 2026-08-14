-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: Add material_file_id to core_gorev
-- Geleceğin Dijital Sağlık Liderleri - PROGRAM-MATERIALS-UX-01
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. core_gorev tablosuna Drive file ID için material_file_id kolonu ekleme
ALTER TABLE public.core_gorev
  ADD COLUMN IF NOT EXISTS material_file_id text NULL;

-- 2. PostgREST schema cache yenileme bildirimi
NOTIFY pgrst, 'reload schema';
