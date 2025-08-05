# Launch Page Content

## Header
- **Title**: Token Launch
- **Logo**: NanoLogo

## Hero Section
- **Main Title**: GRAND OPENING (with gradient effect)
- **Contract Address Section**: 
  - DUEL Contract Address: TBA
  - Copy to clipboard button
- **Action Links**:
  - Dexscreener (with logo)
  - Jupiter (with logo)

## Introduction
The DUEL token is launching with improved tokenomics designed for long-term sustainability. New participants can join via the Jupiter Studio bonding curve or Meteora liquidity pool, while legacy holders can migrate their tokens at a 1:0.5 ratio. This launch prioritizes fair distribution, community alignment, and a powerful flywheel over centralization, insiders, or bags for Evelyn.

We're excited to build alongside Jupiter, the trading infrastructure that powers Solana. Their platform has fundamentally shaped how trading works on-chain, and their launch tools provide the fair distribution model that aligns with our vision.

## Tabs

### Legacy Holders Tab

#### Not Logged In State
- **Title**: Connect Wallet to Exchange Your Tokens
- **Description**: Connect your wallet to see your DUEL balance and exchange for the new token
- **Action**: WalletMultiButton + Sign Message to Login button

#### Logged In - Reveal Screen
- **Logo**: MiniLogo (scale 3x)
- **Title**: ELIGIBLE FOR MIGRATION
- **Subtitle**: Your bag is about to get an upgrade.
- **Button**: REVEAL YOUR ALLOCATION
- **Branch Message**: "Thank you for believing in me" - Branch (shown after button click)

#### Logged In - Exchange Screen
- **Airdrop Display**: 
  - Shows animated number of new DUEL tokens
  - Estimated USD value upon bonding
  - Alternate display: "≈ ∞ if you hold hard"

- **Exchange Section**:
  - You Send: [amount] old DUEL
  - You Receive: [amount] new DUEL  
  - Migration Ratio: 1 old DUEL → 0.5 new DUEL
  - Exchange button: "EXCHANGE [logo] NOW"

- **Payment Progress** (if applicable):
  - Progress bar showing sent/remaining/total
  - Status messages for partial/complete payments

- **Exchange Complete State**:
  - Success icon
  - "Exchange Complete!"
  - Shows received amount
  - Note about distribution after bonding
  - Branch quote: "Thank you for believing in me"

#### Confirmation Modal
- **Title**: Confirm Airdrop Allocation
- Shows exchange amounts
- Exchange window deadline: Aug 6 2025 midnight UTC
- Cancel/Confirm buttons
- Note: "Once you send your old DUEL, you'll receive new tokens after bonding completes."

### Learn More Tab

#### Token Launch Announcement
DegenDuel is officially launching its native token, DUEL, under a newly optimized tokenomics framework and enhanced infrastructure using the Jupiter Studio launchpad. This launch positions DUEL for long-term sustainability, ecosystem depth, and maximum community alignment.

#### About DegenDuel
DegenDuel is a competitive portfolio game where players build token portfolios and compete for prizes. With daily revenue sharing for DUEL holders, live leaderboards, and a proven contest infrastructure, it's building a sustainable ecosystem for competitive crypto trading.

#### Tokenomics Section
- **Nested Pie Charts**:
  - Inner pie (Total Supply):
    - Supply Vested: 80%
    - Bonding Supply: 15%  
    - Migrating Supply: 5%
  - Outer donut (80% Breakdown):
    - DUEL DAO Treasury: 20%
    - Airdrop to OG Holders: 20%
    - Exchange Listings Reserve Fund: 10%
    - Jupiter Ecosystem Fund: 5%
    - Seeker Ecosystem Fund: 5%
    - PSG1 Ecosystem Fund: 5%
    - Strategic Yield Pool: 5%
    - Contest Prize Pool: 5%
    - Dev (Vested): 5%

- **Market Cap Info**:
  - Initial Market Cap: 135 SOL (~$60K)
  - Bonding Market Cap: 2,200 SOL (~$350K)
  - Airdrop Time: After Bonding (if user has allocation)

#### What's New?
1. **Jupiter Studio Launch**: Jupiter's community-first launchpad mechanics ensure organic growth and project success. Their track record speaks for itself—just ask Raydium.

2. **Live Infrastructure**: Battle-tested contests are live and fully operational with instant payouts and refunds if unfilled. Daily revenue sharing airdrop system is ready to distribute rewards.

3. **Strengthened Team**: New advisory board established with proven crypto and community leaders. Additional technical talent joining, including more developers, to accelerate execution.

4. **Vastly Improved Tokenomics**: Clear allocation structure with community-first distribution model. All tokenomics publicly visible with a more attractive liquidity ratio.

#### Migration Details
- **Ratio**: 1 old DUEL → 0.5 new DUEL
- **Note**: The migration ratio ensures proper value alignment while creating a more sustainable token economy for long-term growth. Snapshot taken midnight August 4th.

#### Admin Section (Admin/SuperAdmin only)
**🔒 Admin: Bonding Curve Calculator**

**Key Formulas**:
- Required SOL = $17,500 / Current_SOL_Price
- Bonding% = 100% - Vested% - Migrating%
- Efficiency ≈ 0.31 - (0.004 × Bonding%)
- Grad_MC = Initial_MC + (Required_SOL / (Bonding% × Efficiency))
- Public_Entry_MC = Initial_MC + (Vested% × (Grad_MC - Initial_MC))

**Scenarios**:

**75% Vested**:
- Vested: 75% | Bonding: 19.9% | Migrating: 5.1%
- Initial MC: 137.5 SOL
- Graduation MC: 2,050 SOL
- SOL Raised: ~105.43 SOL
- Efficiency: 0.277
- Public Entry: ~1,572 SOL (~$264K)
- 10 SOL buys: 6.32M tokens (0.63%)

**76% Vested**:
- Vested: 76% | Bonding: 19.2% | Migrating: 4.8%
- Initial MC: 137.5 SOL
- Graduation MC: 2,200 SOL
- SOL Raised: ~105.6 SOL
- Efficiency: 0.267
- Public Entry: ~1,706 SOL (~$287K)
- 10 SOL buys: 5.83M tokens (0.58%)

**80% Vested**:
- Vested: 80% | Bonding: 16.4% | Migrating: 3.6%
- Initial MC: 137.5 SOL
- Graduation MC: 2,950 SOL
- SOL Raised: ~104.76 SOL
- Efficiency: 0.227
- Public Entry: ~2,387 SOL (~$401K)
- 10 SOL buys: 4.17M tokens (0.42%)

**Key Insights**:
- Jupiter enforces minimum $17,500 raise requirement
- Developer allocation is "free" - public pays entire raise amount
- Higher vested % = higher public entry price for same tokens
- Jupiter may adjust bonding/migrating ratios to meet constraints
- Constant product AMM means price increases exponentially

**Quick Reference**:
- Current SOL Price: $169-171
- Min SOL to Raise: ~102.2 SOL
- If 5% → LP at $17.5K: $350K Market Cap
- Formula Check: 2,047 SOL @ grad