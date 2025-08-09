/**
 * Influencer/KOL presets
 * Structure is intentionally simple so you can edit/replace easily.
 * - handle: Twitter/X username WITHOUT the leading @
 * - displayName: Human-readable name to show in the UI
 * - active (optional): mark if you want to temporarily hide/show
 * - notes (optional): any internal note
 */

export interface InfluencerPreset {
  handle: string; // no leading @
  displayName: string;
  active?: boolean;
  notes?: string;
}

export const INFLUENCER_PRESETS: InfluencerPreset[] = [
  // Replace these with your authoritative list
  { handle: "AltcoinPsycho", displayName: "Altcoin Psycho", active: true },
  { handle: "SalsaTekila", displayName: "Salsa Tekila", active: true },
  { handle: "cobie", displayName: "Cobie", active: true },
  { handle: "HsakaTrades", displayName: "Hsaka", active: true },
  { handle: "GiganticRebirth", displayName: "GCR", active: true },
  { handle: "Pentosh1", displayName: "Pentoshi", active: true },
  { handle: "TheCryptoDog", displayName: "The Crypto Dog", active: true },
  { handle: "AnsemXO", displayName: "Ansem", active: true },
];

export const toSelectOptions = (
  presets: InfluencerPreset[],
): { value: string; label: string }[] =>
  presets
    .filter((p) => p.active !== false)
    .map((p) => ({ value: p.handle, label: `${p.displayName} (@${p.handle})` }));
