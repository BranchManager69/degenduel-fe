/**
 * Solana Blinks (Actions) API Routes
 * 
 * These routes handle the Solana Actions protocol for the DegenDuel platform.
 * 
 * @see https://solana.com/developers/guides/advanced/actions
 */

const express = require('express');
const router = express.Router();
const cors = require('cors');
const bs58 = require('bs58');

// Sample contest data for testing
const CONTESTS = {
  'sample-contest-123': {
    id: 'sample-contest-123',
    name: 'Weekly Crypto Challenge',
    description: 'Compete in our weekly trading contest!',
    entryFee: '0.05',
    prize: '2.5',
    startsAt: new Date(Date.now() + 86400000).toISOString(),
    endsAt: new Date(Date.now() + 86400000 * 8).toISOString()
  }
};

// Configure CORS for Actions API
// This is required for compatibility with the Solana Actions protocol
const corsOptions = {
  origin: '*', // In production, you'd want to restrict this
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
  maxAge: 86400 // 24 hours
};

router.options('*', cors(corsOptions));

/**
 * GET handler for blink metadata
 * Returns information about what the action does
 */
router.get('/join-contest', cors(corsOptions), async (req, res) => {
  try {
    const contestId = req.query.contestId || 'sample-contest-123';
    const contest = CONTESTS[contestId] || CONTESTS['sample-contest-123'];
    
    // Return metadata conforming to Solana Actions protocol
    res.status(200).json({
      title: `Join ${contest.name}`,
      description: `Entry fee: ${contest.entryFee} SOL - Prize pool: ${contest.prize} SOL`,
      icon: `${req.protocol}://${req.get('host')}/assets/images/contests/default.png`,
      label: 'Join Contest',
      // You can include multiple actions in a chain, but we'll keep it simple
    });
  } catch (error) {
    console.error('Error generating blink metadata:', error);
    res.status(500).json({ error: 'Failed to generate action metadata' });
  }
});

/**
 * POST handler for blink transaction generation
 * Returns a serialized transaction that can be signed and sent
 */
router.post('/join-contest', cors(corsOptions), async (req, res) => {
  try {
    const { account, params = {} } = req.body;
    
    if (!account) {
      return res.status(400).json({ error: 'Missing account parameter' });
    }
    
    // Get contest information
    const contestId = params.contestId || 'sample-contest-123';
    const contest = CONTESTS[contestId] || CONTESTS['sample-contest-123'];
    
    // In a real implementation, you would:
    // 1. Create a Solana transaction using @solana/web3.js
    // 2. Add instructions for joining the contest (transfer SOL, etc)
    // 3. Serialize the transaction and return it
    
    // For now, we'll return a mock serialized transaction
    const mockSerializedTransaction = bs58.encode(Buffer.from(
      `MockTransaction:JoinContest:${contestId}:${account}:${Date.now()}`
    ));
    
    res.status(200).json({
      transaction: mockSerializedTransaction
    });
  } catch (error) {
    console.error('Error generating blink transaction:', error);
    res.status(500).json({ error: 'Failed to generate transaction' });
  }
});

/**
 * GET handler for place-token-bet blink metadata
 */
router.get('/place-token-bet', cors(corsOptions), async (req, res) => {
  try {
    const tokenSymbol = req.query.tokenSymbol || 'SOL';
    const direction = req.query.direction || 'up';
    
    // Return metadata conforming to Solana Actions protocol
    res.status(200).json({
      title: `Bet ${direction.toUpperCase()} on ${tokenSymbol}`,
      description: `Place a bet that ${tokenSymbol} will go ${direction}`,
      icon: `${req.protocol}://${req.get('host')}/assets/images/tokens/${tokenSymbol.toLowerCase()}.png`,
      label: `Bet ${direction.toUpperCase()}`,
    });
  } catch (error) {
    console.error('Error generating token bet blink metadata:', error);
    res.status(500).json({ error: 'Failed to generate action metadata' });
  }
});

/**
 * POST handler for place-token-bet blink transaction generation
 */
router.post('/place-token-bet', cors(corsOptions), async (req, res) => {
  try {
    const { account, params = {} } = req.body;
    
    if (!account) {
      return res.status(400).json({ error: 'Missing account parameter' });
    }
    
    // Get token betting information
    const tokenSymbol = params.tokenSymbol || 'SOL';
    const direction = params.direction || 'up';
    const amount = params.amount || '0.1';
    
    // Mock serialized transaction
    const mockSerializedTransaction = bs58.encode(Buffer.from(
      `MockTransaction:TokenBet:${tokenSymbol}:${direction}:${amount}:${account}:${Date.now()}`
    ));
    
    res.status(200).json({
      transaction: mockSerializedTransaction
    });
  } catch (error) {
    console.error('Error generating token bet transaction:', error);
    res.status(500).json({ error: 'Failed to generate transaction' });
  }
});

// Export the router
module.exports = router;

/*
 * Integration into Express server:
 * 
 * In your main Express server file, add:
 * 
 * ```js
 * const blinksRoutes = require('./routes/blinks');
 * app.use('/api/blinks', blinksRoutes);
 * ```
 * 
 * This will make the blinks endpoints available at:
 * - GET /api/blinks/join-contest
 * - POST /api/blinks/join-contest
 * - GET /api/blinks/place-token-bet
 * - POST /api/blinks/place-token-bet
 */