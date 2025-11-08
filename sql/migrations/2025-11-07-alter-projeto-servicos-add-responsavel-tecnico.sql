-- Add responsavel_tecnico column to projeto_servicos to record who claimed the service
-- Safe to run multiple times (IF NOT EXISTS where possible)

BEGIN;

ALTER TABLE IF EXISTS projeto_servicos
  ADD COLUMN IF NOT EXISTS responsavel_tecnico text NULL;

-- Optional index for filtering by responsible
CREATE INDEX IF NOT EXISTS idx_projeto_servicos_responsavel_tecnico ON projeto_servicos(LOWER(responsavel_tecnico));

COMMIT;
