import type { DeckConfig } from "./lib/types";
import { PresentationViewer } from "./components/PresentationViewer";

/**
 * The Attio app encodes the full DeckConfig as base64 JSON in the URL:
 *   https://your-viewer.com/?deck=<base64>
 *
 * This component decodes it and renders the presentation.
 */
export default function App() {
  const params = new URLSearchParams(window.location.search);
  const encoded = params.get("deck");

  if (!encoded) {
    return (
      <div className="h-screen w-screen bg-slate-900 flex flex-col items-center justify-center text-white gap-6">
        <div className="text-6xl">📊</div>
        <h1 className="text-3xl font-bold">Pitch Deck Viewer</h1>
        <p className="text-slate-400 text-lg max-w-md text-center">
          This page is launched automatically from Attio. Open a People record,
          click ⋯ → <strong>Generate Pitch Deck</strong>, configure your deck,
          then click <strong>Open Full Presentation</strong>.
        </p>
      </div>
    );
  }

  let config: DeckConfig;
  try {
    config = JSON.parse(atob(encoded));
  } catch {
    return (
      <div className="h-screen w-screen bg-slate-900 flex items-center justify-center text-red-400 text-xl">
        Invalid presentation link. Please regenerate from Attio.
      </div>
    );
  }

  return <PresentationViewer config={config} />;
}
