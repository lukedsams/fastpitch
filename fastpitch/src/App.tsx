import { useState } from "react";
import type { DeckConfig, ProspectData } from "./lib/types";
import { PresentationViewer } from "./components/PresentationViewer";
import { ConfigScreen } from "./components/ConfigScreen";

export default function App() {
  const params = new URLSearchParams(window.location.search);

  // ── Mode 1: ?prospect= → show config screen first ────────────────────────
  const encodedProspect = params.get("prospect");
  const [config, setConfig] = useState<DeckConfig | null>(null);

  if (encodedProspect) {
    let prospect: ProspectData;
    try {
      prospect = JSON.parse(decodeURIComponent(encodedProspect));
    } catch {
      return <ErrorScreen message="Invalid prospect link. Please regenerate from Attio." />;
    }

    if (config) {
      return <PresentationViewer config={config} />;
    }

    return (
      <ConfigScreen
        prospect={prospect}
        onGenerate={(cfg) => setConfig(cfg)}
      />
    );
  }

  // ── Mode 2: ?deck= → go straight to deck (backwards compat) ──────────────
  const encodedDeck = params.get("deck");

  if (encodedDeck) {
    let deckConfig: DeckConfig;
    try {
      deckConfig = JSON.parse(decodeURIComponent(encodedDeck));
    } catch {
      return <ErrorScreen message="Invalid presentation link. Please regenerate from Attio." />;
    }
    return <PresentationViewer config={deckConfig} />;
  }

  // ── No params → landing page ────────────────────────────────────────────
  return (
    <div style={{
      height: "100vh", width: "100vw", background: "#040812",
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", color: "#e2e8f0", gap: "24px",
      fontFamily: "'DM Sans', sans-serif",
    }}>
      <div style={{ fontSize: "56px" }}>⚡</div>
      <h1 style={{
        fontFamily: "'Syne', sans-serif", fontSize: "40px", fontWeight: 800,
        letterSpacing: "-0.03em",
        background: "linear-gradient(135deg, #e2e8f0, #6366f1)",
        WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
      }}>FastPitch</h1>
      <p style={{ color: "#475569", fontSize: "16px", maxWidth: "420px", textAlign: "center", lineHeight: 1.6 }}>
        Open a People record in Attio, click ⋯ →{" "}
        <strong style={{ color: "#64748b" }}>FastPitch — Generate Deck</strong>{" "}
        to launch a presentation.
      </p>
    </div>
  );
}

function ErrorScreen({ message }: { message: string }) {
  return (
    <div style={{
      height: "100vh", width: "100vw", background: "#040812",
      display: "flex", alignItems: "center", justifyContent: "center",
      color: "#f87171", fontSize: "18px", fontFamily: "'DM Sans', sans-serif",
    }}>
      {message}
    </div>
  );
}
