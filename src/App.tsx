import type { DeckConfig } from "./lib/types";
import { PresentationViewer } from "./components/PresentationViewer";

// Decode URL-safe base64 (- instead of +, _ instead of /, no padding)
function fromBase64Url(str: string): string {
  const base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "==".slice(0, (4 - base64.length % 4) % 4);
  return atob(padded);
}

export default function App() {
  const params = new URLSearchParams(window.location.search);
  const encoded = params.get("deck");

  if (!encoded) {
    return (
      <div className="h-screen w-screen bg-slate-900 flex flex-col items-center justify-center text-white gap-6">
        <div className="text-6xl">⚡</div>
        <h1 className="text-3xl font-bold">FastPitch</h1>
        <p className="text-slate-400 text-lg max-w-md text-center">
          Open a People record in Attio, click ⋯ →{" "}
          <strong>FastPitch — Generate Deck</strong> to launch a presentation.
        </p>
      </div>
    );
  }

  let config: DeckConfig;
  try {
    config = JSON.parse(fromBase64Url(encoded));
  } catch {
    return (
      <div className="h-screen w-screen bg-slate-900 flex items-center justify-center text-red-400 text-xl">
        Invalid presentation link. Please regenerate from Attio.
      </div>
    );
  }

  return <PresentationViewer config={config} />;
}
