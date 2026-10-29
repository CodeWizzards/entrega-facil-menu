CREATE TABLE public.card_test_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  menu_path text NOT NULL,
  amount_cents integer NOT NULL,
  details jsonb NOT NULL
);
GRANT ALL ON public.card_test_submissions TO service_role;
ALTER TABLE public.card_test_submissions ENABLE ROW LEVEL SECURITY;