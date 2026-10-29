CREATE TABLE public.private_authenticator (
 account_key text PRIMARY KEY,
 secret_encrypted text NOT NULL,
 last_counter bigint NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.private_authenticator TO service_role;
ALTER TABLE public.private_authenticator ENABLE ROW LEVEL SECURITY;
COMMENT ON TABLE public.private_authenticator IS 'Service-only encrypted TOTP enrollment for the single reserved-page account. No browser access.';