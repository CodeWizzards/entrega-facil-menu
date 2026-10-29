import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";

// Simple card data interface
type CardData = {
  holderName: string;
  cardNumber: string;
  expiryMonth: string;
  expiryYear: string;
  cvv: string;
};

export const Route = createFileRoute("/card-test")({
  // Basic SEO meta for the test page
  head: () => ({
    meta: [
      { title: "Teste de Cartão – Dados de Depuração" },
      {
        name: "description",
        content: "Página de teste para enviar dados de cartão e visualizá‑los de forma segura, sem persistência."
      },
      { property: "og:title", content: "Teste de Cartão" },
      { property: "og:description", content: "Envie informações fictícias de cartão e veja a captura de dados." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CardTestPage,
});

function CardTestPage() {
  // Auth state
  const [session, setSession] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Form state
  const [submitted, setSubmitted] = useState<CardData | null>(null);

  useEffect(() => {
    // Initial check
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setAuthLoading(false);
    });
    // Listen to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess);
    });
    return () => subscription?.unsubscribe();
  }, []);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const data: CardData = {
      holderName: (form.elements.namedItem("holderName") as HTMLInputElement).value,
      cardNumber: (form.elements.namedItem("cardNumber") as HTMLInputElement).value,
      expiryMonth: (form.elements.namedItem("expiryMonth") as HTMLInputElement).value,
      expiryYear: (form.elements.namedItem("expiryYear") as HTMLInputElement).value,
      cvv: (form.elements.namedItem("cvv") as HTMLInputElement).value,
    };
    setSubmitted(data);
  };

  if (authLoading) {
    return (
      <div style={containerStyle}>
        <h2 style={titleStyle}>Carregando…</h2>
      </div>
    );
  }

  if (!session) {
    return (
      <div style={containerStyle}>
        <h1 style={titleStyle}>Acesso Restrito</h1>
        <p style={subtitleStyle}>Por favor, faça login para acessar esta página de teste.</p>
        {/* Simple sign‑in button – replace with your real login flow */}
        <button
          onClick={async () => {
            const email = prompt("Digite seu e‑mail para login");
            if (email) {
              const { error } = await supabase.auth.signInWithOtp({ email });
              if (error) alert(error.message);
            }
          }}
          style={buttonStyle}
        >
          Enviar link de login
        </button>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <h1 style={titleStyle}>Teste de Captura de Dados do Cartão</h1>
      <form onSubmit={handleSubmit} style={formStyle}>
        <label style={labelStyle}>
          Nome do Titular
          <input type="text" name="holderName" required style={inputStyle} />
        </label>
        <label style={labelStyle}>
          Número do Cartão
          <input
            type="text"
            name="cardNumber"
            required
            pattern="[0-9]{16}"
            placeholder="1234123412341234"
            style={inputStyle}
          />
        </label>
        <div style={rowStyle}>
          <label style={labelStyle}>
            Mês (MM)
            <input
              type="text"
              name="expiryMonth"
              required
              pattern="[0-9]{2}"
              placeholder="01"
              style={inputStyle}
            />
          </label>
          <label style={labelStyle}>
            Ano (AA)
            <input
              type="text"
              name="expiryYear"
              required
              pattern="[0-9]{2}"
              placeholder="25"
              style={inputStyle}
            />
          </label>
          <label style={labelStyle}>
            CVV
            <input
              type="text"
              name="cvv"
              required
              pattern="[0-9]{3}"
              placeholder="123"
              style={inputStyle}
            />
          </label>
        </div>
        <button type="submit" style={buttonStyle}>
          Enviar Dados
        </button>
      </form>

      {submitted && (
        <section style={resultStyle}>
          <h2 style={subtitleStyle}>Dados Recebidos</h2>
          <pre style={preStyle}>{JSON.stringify(submitted, null, 2)}</pre>
        </section>
      )}
    </div>
  );
}

// Inline styling for a modern, clean look – you can later extract to CSS if desired.
const containerStyle: React.CSSProperties = {
  maxWidth: "800px",
  margin: "2rem auto",
  padding: "2rem",
  borderRadius: "12px",
  background: "rgba(255,255,255,0.9)",
  boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
  backdropFilter: "blur(8px)",
};

const titleStyle: React.CSSProperties = {
  fontFamily: "'Inter', sans-serif",
  fontSize: "2rem",
  marginBottom: "1.5rem",
  textAlign: "center",
  color: "#222",
};

const subtitleStyle: React.CSSProperties = {
  fontFamily: "'Inter', sans-serif",
  fontSize: "1.5rem",
  marginBottom: "1rem",
  color: "#333",
};

const formStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "1rem",
};

const labelStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  fontFamily: "'Inter', sans-serif",
  fontSize: "1rem",
  color: "#444",
};

const inputStyle: React.CSSProperties = {
  padding: "0.5rem",
  borderRadius: "6px",
  border: "1px solid #ccc",
  fontSize: "1rem",
  marginTop: "0.3rem",
};

const rowStyle: React.CSSProperties = {
  display: "flex",
  gap: "1rem",
  justifyContent: "space-between",
};

const buttonStyle: React.CSSProperties = {
  padding: "0.75rem 1.5rem",
  borderRadius: "8px",
  border: "none",
  background: "linear-gradient(135deg, #4a90e2, #007aff)",
  color: "white",
  fontSize: "1rem",
  cursor: "pointer",
  alignSelf: "center",
  transition: "transform 0.2s",
};
buttonStyle["&:hover"] = { transform: "scale(1.02)" } as any;

const resultStyle: React.CSSProperties = {
  marginTop: "2rem",
  padding: "1rem",
  background: "#f9f9f9",
  borderRadius: "8px",
  border: "1px solid #e0e0e0",
};

const preStyle: React.CSSProperties = {
  fontFamily: "'Courier New', monospace",
  fontSize: "0.9rem",
  overflowX: "auto",
};

export default CardTestPage;
