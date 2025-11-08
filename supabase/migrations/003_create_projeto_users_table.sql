-- Migration: create projeto_users link table
-- Ensures projects can be associated to users for ownership/visibility
-- Safe to run multiple times: uses IF NOT EXISTS guards

-- Create projetos table if not exists (minimal columns required by current code)
CREATE TABLE IF NOT EXISTS public.projetos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text,
  email text,
  phone text,
  service text,
  description text,
  location text,
  urgency text,
  budget text,
  status text DEFAULT 'pendente',
  responsavel_tecnico text,
  created_at timestamptz DEFAULT now()
);

-- Link table between projetos and users
CREATE TABLE IF NOT EXISTS public.projeto_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  projeto_id uuid NOT NULL REFERENCES public.projetos(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  alias text,
  created_at timestamptz DEFAULT now(),
  UNIQUE (projeto_id, user_id)
);

-- Indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_projeto_users_projeto ON public.projeto_users (projeto_id);
CREATE INDEX IF NOT EXISTS idx_projeto_users_user ON public.projeto_users (user_id);

-- Optional: ensure email lookup is performant
CREATE INDEX IF NOT EXISTS idx_projetos_email_lower ON public.projetos ((lower(email)));
