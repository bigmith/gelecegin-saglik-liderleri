-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: Add Material Columns to core_gorev
-- Geleceğin Dijital Sağlık Liderleri - PROGRAM-UX-FIX-02
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. core_gorev tablosuna materyal yönetimi kolonları ekleme
ALTER TABLE public.core_gorev
  ADD COLUMN IF NOT EXISTS material_url text NULL,
  ADD COLUMN IF NOT EXISTS material_title text NULL,
  ADD COLUMN IF NOT EXISTS material_type text NULL;

-- 2. PostgREST schema cache yenileme bildirimi
NOTIFY pgrst, 'reload schema';
