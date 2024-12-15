// tests/price-apis.test.ts
import { DexScreenerService, TokenWithMarketData } from '../src/services/dexscreener.ts';

interface CoinGeckoData {
    id: string;
    symbol: string;
    name: string;
    market_data?: {
        current_price?: {
            usd?: number;
        };
        total_volume?: {
            usd?: number;
        };
        market_cap?: {
            usd?: number;
        };
        price_change_percentage_24h?: number;
    };
    market_cap_rank?: number;
    developer_data?: {
        repos_count?: number;
    };
    community_data?: {
        twitter_followers?: number;
        reddit_subscribers?: number;
        telegram_channel_user_count?: number;
    };
    tickers?: any[];
}

// dexscreener interface is imported from services/dexscreener.ts

interface PriceComparison {
    token: string;
    dexscreener?: TokenWithMarketData | null;
    coingecko?: CoinGeckoData;
    difference?: {
        price: number;
        volume: number;
        marketCap: number;
    };
}

async function comparePriceAPIs() {
    console.log('Comparing DexScreener vs CoinGecko Data\n');

    const tokens = [
        {
            address: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263', // BONK
            geckoId: 'bonk'
        },
        {
            address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC
            geckoId: 'usd-coin'
        },
        {
            address: 'So11111111111111111111111111111111111111111', // SOL
            geckoId: 'solana'
        }
    ];

    const comparisons: PriceComparison[] = [];

    for (const token of tokens) {
        console.log(`\nComparing ${token.geckoId.toUpperCase()}:`);
        
        const comparison: PriceComparison = {
            token: token.geckoId,
            dexscreener: await DexScreenerService.fetchTokenInfo(token.address),
            coingecko: await fetch(
                `https://api.coingecko.com/api/v3/coins/${token.geckoId}?localization=false&tickers=true&market_data=true&community_data=true&developer_data=true`
            ).then(res => res.json())
        };

        // Calculate differences if both data sources are available
        if (comparison.dexscreener?.currentPrice && comparison.coingecko?.market_data?.current_price?.usd) {
            comparison.difference = {
                price: ((comparison.dexscreener.currentPrice - comparison.coingecko.market_data.current_price.usd) / 
                        comparison.coingecko.market_data.current_price.usd * 100),
                volume: ((comparison.dexscreener.volume24h || 0) - (comparison.coingecko.market_data?.total_volume?.usd || 0)) / 
                        (comparison.coingecko.market_data?.total_volume?.usd || 1) * 100,
                marketCap: ((comparison.dexscreener.marketCap || 0) - (comparison.coingecko.market_data?.market_cap?.usd || 0)) /
                          (comparison.coingecko.market_data?.market_cap?.usd || 1) * 100
            };
        }

        comparisons.push(comparison);

        // Display DexScreener Data
        console.log('\nDexScreener Data:');
        if (comparison.dexscreener) {
            console.log(`  Price: $${comparison.dexscreener.currentPrice?.toFixed(8) || 'N/A'}`);
            console.log(`  24h Volume: $${comparison.dexscreener.volume24h?.toLocaleString() || 'N/A'}`);
            console.log(`  Market Cap: $${comparison.dexscreener.marketCap?.toLocaleString() || 'N/A'}`);
            console.log(`  Social Links: ${comparison.dexscreener.socials?.length || 0}`);
            console.log(`  Website Links: ${comparison.dexscreener.websites?.length || 0}`);
        } else {
            console.log('  No data available');
        }

        // Display CoinGecko Data
        console.log('\nCoinGecko Data:');
        if (comparison.coingecko) {
            console.log(`  Price: $${comparison.coingecko.market_data?.current_price?.usd?.toFixed(8) || 'N/A'}`);
            console.log(`  24h Volume: $${comparison.coingecko.market_data?.total_volume?.usd?.toLocaleString() || 'N/A'}`);
            console.log(`  Market Cap: $${comparison.coingecko.market_data?.market_cap?.usd?.toLocaleString() || 'N/A'}`);
            console.log(`  Market Cap Rank: #${comparison.coingecko.market_cap_rank || 'N/A'}`);
            console.log('\n  Additional CoinGecko Data:');
            console.log(`  • Github Repos: ${comparison.coingecko.developer_data?.repos_count || 0}`);
            console.log(`  • Reddit Subscribers: ${comparison.coingecko.community_data?.reddit_subscribers?.toLocaleString() || 0}`);
            console.log(`  • Twitter Followers: ${comparison.coingecko.community_data?.twitter_followers?.toLocaleString() || 0}`);
            console.log(`  • Telegram Users: ${comparison.coingecko.community_data?.telegram_channel_user_count?.toLocaleString() || 0}`);
            console.log(`  • Exchange Listings: ${comparison.coingecko.tickers?.length || 0}`);
        } else {
            console.log('  No data available');
        }

        // Display Differences
        if (comparison.difference) {
            console.log('\nDifferences (DexScreener vs CoinGecko):');
            console.log(`  Price: ${comparison.difference.price.toFixed(2)}%`);
            console.log(`  Volume: ${comparison.difference.volume.toFixed(2)}%`);
            console.log(`  Market Cap: ${comparison.difference.marketCap.toFixed(2)}%`);
        }

        // Rate limit delay
        await new Promise(resolve => setTimeout(resolve, 6000));
    }

    return comparisons; // Return the comparison data for potential further analysis
}

// Run the comparison
comparePriceAPIs().then(() => {
    console.log('\nComparison completed');
}).catch(error => {
    console.error('Comparison failed:', error);
});