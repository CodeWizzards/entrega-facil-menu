CREATE TABLE public.pix_orders (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 access_hash text NOT NULL UNIQUE,
 menu_path text NOT NULL,
 amount_cents integer NOT NULL,
 checkout jsonb NOT NULL,
 status text NOT NULL DEFAULT 'CREATING',
 transaction_id text UNIQUE,
 pix_code text,
 created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.pix_orders TO service_role;
ALTER TABLE public.pix_orders ENABLE ROW LEVEL SECURITY;
COMMENT ON TABLE public.pix_orders IS 'Private guest checkout records: no browser grants; server access requires an unguessable order capability. Unknown creation outcomes must not be retried automatically.';