# DegenDuel — Whitepaper

---

## 1. Executive Summary

DegenDuel is a Solana-native PvP trading arena where players stake SOL, lock in token portfolios, and battle for the highest percentage gain over a set period. **Ten percent of every duel or contest’s revenue is airdropped daily to DUEL holders in SOL.** At launch this distribution is handled by a proprietary off-chain engine; a migration to on-chain smart-contract settlement is slated for a later roadmap phase. There is no inflation, no hidden token buckets, and no complicated emissions—just a transparent, daily yield tied directly to real gameplay volume.

---

## 2. Problem & Vision

**The problem:** Most play-to-earn schemes rely on inflationary tokens and collapse once hype fades, leaving holders underwater.
**Our vision:** Create a skill-based arena where set-and-forget portfolios determine winners, daily yield flows to holders from genuine fee revenue, and the entire economy ultimately runs on immutable smart contracts. Over time, DegenDuel expands beyond crypto into tokenized equities, while opening the door for player-built agents to compete head-to-head.

---

## 3. Product Overview

* **Contest Engine (current)** – Server-side logic escrows entry fees, matches players, and settles performance using Jupiter + Meteora price feeds. Full on-chain escrow and settlement will arrive in a future phase.
* **Holder Yield Pipeline (current)** – A nightly task slices 10 % of the previous 24 hours of duel/contest revenue and airdrops SOL to DUEL holders pro-rata. This pipeline will also migrate on-chain.
* **AI Analyst “Didi”** – Provides real-time portfolio insights and onboarding guidance, laying the groundwork for richer coaching tools.
* **Live Updating Leaderboard** – A public page that refreshes continuously, showing active wallets, contest/duel volume, fee flows, and (once activated) daily airdrop totals.
* **Future Multi-Asset Support** – Tokenized equities and stock indices will be added, letting players build hybrid crypto–equity portfolios.
* **Future BYOA (Bring-Your-Own-Agent) Support** – Players will be able to connect custom trading agents that draft portfolios and compete autonomously.

---

## 4. Token Economics (DUEL)

* **Launch Method:** One stealth tweet kicked off a Believe launch; the community—including the dev—minted and traded from zero.
* **Total Supply:** Fixed at genesis; no future minting or burns.
* **Transaction Fee:** Every DUEL transfer carries a hard-coded 2 % fee—1 % to Believe, 1 % to the dev wallet.
* **Holder Airdrop:** Independent of the transfer fee, 10 % of all arena revenue is distributed daily in SOL (off-chain for now, on-chain later).
* **No presale, no emissions schedule, no reserved stash.**

---

## 5. Contest Mechanics & Scheduling

### Season One Gameplay (Set-and-Forget)

Players draft a token portfolio before the contest clock starts. Once locked, no in-game trades are allowed; final standings are based purely on percentage appreciation from start to finish.

### Core Contest Formats

1. **50/50 Contests** – The top half of the field doubles their stake; the bottom half busts. Low variance, grinder-friendly.
2. **Tournament Contests (GPP-style)** – Roughly the top 10–15 % finish “in the money,” with most of the pot flowing to 1st–3rd. High variance, jackpot upside.

### Scheduling & Customisation

* **Scheduled Contests** launch at fixed times each day.
* **Custom Contests** let any wallet spin up a lobby (public or allow-list), choose format, entry fee, and prize split.
* **Sponsored Contests** add an optional 10 % creator fee—80 % to winners, 10 % to DUEL holders, 10 % to the sponsor—without touching baseline holder yield.

*(Season Two will explore mid-contest portfolio tweaks; Season One remains pure set-and-forget.)*

---

## 6. Launch Recap

* **When:** Stealth launch—tweet went live, minting started instantly.
* **Where:** Believe platform.
* **Liquidity:** Seeded organically by early buyers (dev included).
* **Current Status (July 2025):** Actively traded; contest engine rolling out.

---

## 7. 12-Week Roadmap

*(Two-week sprints, Week 0 = July 5 2025)*

### Week 0 – 2 (Jul 5 – Jul 18)

• Launch free scheduled **50/50 contests**
• Live Updating Leaderboard online
• Didi analysis overlays live

### Week 2 – 4 (Jul 19 – Aug 1)

• Launch **paid scheduled 50/50 contests**
• **Paid duels (1-v-1) go live**
• Expand token universe beyond the Jupiter-verified list

### Week 4 – 6 (Aug 2 – Aug 15)

• Launch **free Tournament contests**
• Free duels for onboarding
• Sponsored contests go live

### Week 6 – 8 (Aug 16 – Aug 29)

• **Paid Tournament contests**
• **Bring-Your-Own-Agent (BYOA) support** — players connect custom trading agents to draft portfolios

### Week 8 – 10 (Aug 30 – Sep 12)

• Begin **multi-asset support** — tokenized equities/stock indices added to contest asset list
• Holder airdrop continues (off-chain) alongside stats API
• Draft specification for smart-contract payout migration

### Week 10 – 12 (Sep 13 – Sep 26)

• Seasonal leagues with badge rewards
• Kick-off phased **on-chain payout migration**
• Prepare next white-paper revision

---

## 8. Closing Note

Season One delivers set-and-forget portfolio combat through 50/50 and Tournament formats, with paid duels live by Week 2–4 and daily SOL yield streamed to DUEL holders. Mid-Q3 unlocks agent-driven strategies and multi-asset contests, followed by the march toward fully on-chain, trust-minimised payouts. No gimmicks—just relentless shipping.
