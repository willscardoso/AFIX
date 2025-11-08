-- Migration: Create projeto_servicos table (normalize services per projeto)
-- Run this in your Supabase SQL editor or psql connected to the DB.

BEGIN;

-- 1) Create table
CREATE TABLE IF NOT EXISTS projeto_servicos (
  id bigserial PRIMARY KEY,
  projeto_id uuid NOT NULL,
  servico text NOT NULL,
  descricao text,
  orcamento_range text,
  urgencia_level text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2) Foreign key -> projetos.id (adjust type if your projetos.id is integer)
-- If your projetos.id is integer, change the reference type accordingly.
ALTER TABLE IF EXISTS projeto_servicos
  ADD CONSTRAINT fk_projeto_servicos_projeto FOREIGN KEY (projeto_id) REFERENCES projetos(id) ON DELETE CASCADE;

-- 3) Indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_projeto_servicos_projeto_id ON projeto_servicos(projeto_id);
CREATE INDEX IF NOT EXISTS idx_projeto_servicos_servico ON projeto_servicos(LOWER(servico));

COMMIT;

-- Backfill script: migrate existing `service` field values from `projetos` into `projeto_servicos`.
-- This block is resilient: it will try to parse JSON arrays and fall back to inserting a single row when parsing fails.

DO $$
DECLARE
  r record;
  arr jsonb;
  elem jsonb;
BEGIN
  FOR r IN SELECT id, service, description, budget, urgency FROM projetos WHERE service IS NOT NULL LOOP
    BEGIN
      BEGIN
        arr := r.service::jsonb;
      EXCEPTION WHEN others THEN
        arr := NULL;
      END;

      IF arr IS NOT NULL AND jsonb_typeof(arr) = 'array' THEN
        FOR elem IN SELECT * FROM jsonb_array_elements(arr) LOOP
          INSERT INTO projeto_servicos(projeto_id, servico, descricao, orcamento_range, urgencia_level, created_at)
          VALUES (r.id, elem->> 'service', elem->> 'description', elem->> 'budget', elem->> 'urgency', now());
        END LOOP;
      ELSE
        -- fallback: existing flat columns
        INSERT INTO projeto_servicos(projeto_id, servico, descricao, orcamento_range, urgencia_level, created_at)
        VALUES (r.id, COALESCE(r.service, ''), r.description, r.budget, r.urgency, now());
      END IF;
    EXCEPTION WHEN others THEN
      -- ignore failures for specific rows; continue
      RAISE NOTICE 'Backfill: skipped projeto id % due to error', r.id;
    END;
  END LOOP;
END$$;

-- Optional: once you have verified data in projeto_servicos, you may remove the old columns or keep them for compatibility.
