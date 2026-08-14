-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: Add Program Task Template Columns to core_gorev
-- Geleceğin Dijital Sağlık Liderleri - PROGRAM-TASKS-01
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. core_gorev tablosuna program şablonu eşleştirme kolonları ekleme
ALTER TABLE public.core_gorev
  ADD COLUMN IF NOT EXISTS program_task_key text NULL,
  ADD COLUMN IF NOT EXISTS program_week integer NULL,
  ADD COLUMN IF NOT EXISTS program_task_type text NULL;

-- 2. İndeks ve Duplicate Koruması
CREATE UNIQUE INDEX IF NOT EXISTS idx_core_gorev_program_task_key
  ON public.core_gorev(program_task_key)
  WHERE program_task_key IS NOT NULL;

-- 3. PostgREST schema cache yenileme bildirimi
NOTIFY pgrst, 'reload schema';
