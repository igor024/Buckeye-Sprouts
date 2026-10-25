-- Add table_id directly to public.study_sessions
ALTER TABLE public.study_sessions ADD COLUMN IF NOT EXISTS table_id text;

-- Backfill table_id from session_private_details
UPDATE public.study_sessions s
SET table_id = p.table_id
FROM public.session_private_details p
WHERE s.id = p.session_id AND (s.table_id IS NULL OR s.table_id = '');

-- Index for table-based lookups
CREATE INDEX IF NOT EXISTS idx_study_sessions_table_id ON public.study_sessions (table_id);
