-- Add status column to projeto_servicos to track service-level workflow
-- Safe to run multiple times (IF NOT EXISTS where possible)

BEGIN;

ALTER TABLE IF EXISTS projeto_servicos
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pendente';

COMMIT;