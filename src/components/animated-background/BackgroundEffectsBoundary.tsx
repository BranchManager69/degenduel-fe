import React from "react";
import { CyberGrid } from "./CyberGrid";

// A very small error boundary that isolates crashes coming from the heavy
// 3-D / WebGL background components (TokenVerse, MarketVerse, etc.).  If any of
// those throw – for example because WebGL initialisation fails repeatedly when
// the backend is offline – we simply drop the entire animated background layer
// so the rest of the application can continue to work.

export class BackgroundEffectsBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): { hasError: boolean } {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error("[BackgroundEffectsBoundary]", error, info);
  }

  render() {
    if (this.state.hasError) {
      // [NEW FALLBACK 5/5/2025]
      // Do NOT re-render the original background effects to avoid the update loop.
      //   Keep the UI functional by rendering the CyberGrid fallback instead.
      return <CyberGrid>{null}</CyberGrid>;
      //// [OLD FALLBACK]
      //// Do NOT re-render the background effects to avoid the update loop.
      ////   Keep the UI functional by simply omitting the layer.
      ////return null;
    }
    return this.props.children;
  }
}
