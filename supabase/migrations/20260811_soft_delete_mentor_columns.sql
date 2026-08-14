-- Migration: Add soft delete columns to core_mentor
-- Task: DATA-SOFTDEL-01-SCHEMA-PERSIST
-- Idempotent script for schema persistence

ALTER TABLE public.core_mentor
ADD COLUMN IF NOT EXISTS aktif boolean NOT NULL DEFAULT true;

ALTER TABLE public.core_mentor
ADD COLUMN IF NOT EXISTS silinme_tarihi timestamptz NULL;

UPDATE public.core_mentor
SET aktif = true
WHERE aktif IS NULL;

CREATE INDEX IF NOT EXISTS idx_core_mentor_aktif
ON public.core_mentor (aktif);
