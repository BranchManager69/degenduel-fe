// tests/price-apis.test.ts
// Main test file for token price and metrics analysis
import { join } from 'path';
import { writeFileSync } from 'fs';
import { DexScreenerService } from '../src/services/dexscreener';
import { formatMarketCap } from '../src/lib/utils';

const SECONDS_DELAY = 3;
const MAX_TOKENS_PROCESSED = 18;

// Data structure interfaces
interface TokenMetrics {
    volumeToMcap?: number;
    liquidityScore?: number;
}

interface CoinGeckoData {
    id: string;
    symbol: string;
    name: string;
    market_data?: {
        current_price?: { usd?: number };
        total_volume?: { usd?: number };
        market_cap?: { usd?: number };
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

interface EnhancedTokenData {
    address: string;
    name: string;
    symbol: string;
    price: number | null;
    marketCap: number | null;
    volume24h: number | null;
    circulatingSupply?: number | null;
    totalSupply?: number | null;
    socials: {
        telegram?: { url: string; memberCount?: number };
        twitter?: { url: string; followerCount?: number };
        discord?: { url: string; memberCount?: number };
        reddit?: { url: string; memberCount?: number };
        website?: string;
    };
    metrics: {
        volumeToMcap?: number;
        liquidityScore?: number;
    };
}

// Calculate and collect token metrics
const tokenMetrics: EnhancedTokenData[] = [];

// Color codes for console output
const colors = {
    dex: '\x1b[34m',      // Blue
    gecko: '\x1b[32m',    // Green
    diff: '\x1b[33m',     // Yellow
    white: '\x1b[37m',    // White
    bold: '\x1b[1m',      // Bold
    italic: '\x1b[3m',    // Italic
    underline: '\x1b[4m', // Underline
    whitebg: '\x1b[7m',   // whitebg
    reset: '\x1b[0m',     // RESET
    positive: '\x1b[32m', // Green
    negative: '\x1b[31m', // Red
    metric: '\x1b[34m',   // Blue
    black: '\x1b[30m',   // Black
    inverted: '\x1b[43m\x1b[1m\x1b[30m', // White background with bold black text
    inverted_blue: '\x1b[46m\x1b[1m\x1b[30m', // Cyan background with bold black text
    inverted_green: '\x1b[42m\x1b[1m\x1b[30m', // Green background with bold black text
    inverted_red: '\x1b[41m\x1b[1m\x1b[30m', // Red background with bold black text
    inverted_yellow: '\x1b[43m\x1b[1m\x1b[30m', // Yellow background with bold black text
    inverted_white: '\x1b[47m\x1b[1m\x1b[30m', // White background with bold black text
    inverted_black: '\x1b[40m\x1b[1m\x1b[37m', // Black background with bold white text
    inverted_cyan: '\x1b[46m\x1b[1m\x1b[30m', // Cyan background with bold black text
    inverted_magenta: '\x1b[45m\x1b[1m\x1b[30m', // Magenta background with bold black text
    header_blue: '\x1b[46m\x1b[1m\x1b[30m',    // Cyan bg with black text
    header_green: '\x1b[42m\x1b[1m\x1b[30m',   // Green bg with black text
    header_purple: '\x1b[45m\x1b[1m\x1b[30m',  // Purple bg with black text
    header_yellow: '\x1b[43m\x1b[1m\x1b[30m',  // Yellow bg with black text
    header_white: '\x1b[47m\x1b[1m\x1b[30m',  // White bg with black text
    header_black: '\x1b[40m\x1b[1m\x1b[37m',  // Black bg with white text
    header_cyan: '\x1b[46m\x1b[1m\x1b[30m',    // Cyan bg with black text
    header_magenta: '\x1b[45m\x1b[1m\x1b[30m',  // Magenta bg with black text
    header_red: '\x1b[41m\x1b[1m\x1b[30m',    // Red bg with black text
    blue: '\x1b[34m',     // Blue
    social: '\x1b[35m',   // Magenta
    title: '\x1b[32m\x1b[1m',  // Green BOLD
    header: '\x1b[1m',    // BOLD
    warning: '\x1b[33m',  // Yellow/Orange if single source missing
    error: '\x1b[31m',    // Red if both sources missing
};

// Token metrics calculation function
function calculateMetrics(data: {
    marketCap: number | null;
    volume24h: number | null;
    price: number | null;
    socials: any;
    liquidity: number | null;
}): TokenMetrics {
    const metrics: TokenMetrics = {};

    if (data.marketCap && data.volume24h) {
        metrics.volumeToMcap = (data.volume24h / data.marketCap) * 100;
    }

    if (data.marketCap && data.liquidity) {
        metrics.liquidityScore = (data.liquidity / data.marketCap) * 100;
    }

    return metrics;
}

function buildSocialLinks(socials: any[] = []): EnhancedTokenData['socials'] {
    const links: EnhancedTokenData['socials'] = {};
    
    socials.forEach(social => {
        if (social.url) {
            if (social.url.includes('t.me')) {
                links.telegram = { url: social.url };
            } else if (social.url.includes('twitter.com')) {
                links.twitter = { url: social.url };
            } else if (social.url.includes('discord')) {
                links.discord = { url: social.url };
            } else if (social.url.includes('reddit.com')) {
                links.reddit = { url: social.url };
            } else if (!social.url.includes('dexscreener')) {
                links.website = social.url;
            }
        }
    });

    return links;
}

function formatMetric(value: number | null | undefined, suffix: string = ''): string {
    if (value === undefined || value === null) return 'N/A';
    return `${value.toFixed(2)}${suffix}`;
}

function isCoinGeckoData(data: any): data is CoinGeckoData {
    return data && typeof data === 'object' && 'id' in data && 'symbol' in data;
}

function generateASCIIChart(data: EnhancedTokenData[]) {
    const validData = data.filter(t => t.marketCap && t.volume24h);
    const maxMarketCap = Math.min(1.5e9, Math.max(...validData.map(t => t.marketCap || 0)));
    const minMarketCap = Math.min(...validData.map(t => t.marketCap || 0));
    const maxVolume = Math.max(...validData.map(t => t.volume24h || 0));
    
    const rows = 20;
    const cols = 60;
    const chart = Array(rows).fill(null).map(() => Array(cols).fill(' '));
    
    function getVolatilityColor(volatility: number): string {
        const volatilities = validData.map(t => t.metrics.volumeToMcap || 0);
        const maxVol = Math.max(...volatilities);
        const minVol = Math.min(...volatilities);
        const normalizedVol = (volatility - minVol) / (maxVol - minVol);
        
        if (normalizedVol > 0.66) return colors.positive;
        if (normalizedVol > 0.33) return colors.diff;
        return colors.negative;
    }
    
    validData.forEach(token => {
        // Use log scale with 0.9 compression
        const x = Math.floor((logScale(token.volume24h || 1) / logScale(maxVolume)) * (cols - 1) * 0.9);
        const y = Math.floor(((logScale(token.marketCap || 0) - logScale(minMarketCap)) / 
                            (logScale(maxMarketCap) - logScale(minMarketCap))) * (rows - 1));
        
        if (y >= 0 && y < rows && x >= 0 && x < cols) {
            const symbol = token.symbol.substring(0, 4);
            const volatilityColor = getVolatilityColor(token.metrics.volumeToMcap || 0);
            chart[rows - 1 - y][x] = `${volatilityColor}${symbol}${colors.reset}`;
        }
    });
    
    console.log('\n');
    console.log(`${colors.header_black}══════════════════════════════════ Market Analysis - NORMAL ══════════════════════════════════${colors.reset}`);
    chart.forEach((row, i) => {
        const mcapValue = (maxMarketCap * (rows - i) / rows) / 1e6;
        console.log(`${colors.header_green}$${colors.reset}${mcapValue.toFixed(0).padStart(6)}M ${colors.header_black}|${colors.reset}${row.join('')}`);
    });
    console.log(`${colors.header_black}══════════════════════════════════════════════════════════════════════════════════════════════${colors.reset}`);
}

function logScale(value: number): number {
    return Math.log10(value + 1);
}

function generateASCIILogChart(data: EnhancedTokenData[]) {
    const validData = data.filter(t => t.marketCap && t.volume24h);
    const maxMarketCap = Math.min(1.5e9, Math.max(...validData.map(t => t.marketCap || 0)));
    const minMarketCap = Math.min(...validData.map(t => t.marketCap || 0));
    const maxVolume = Math.max(...validData.map(t => t.volume24h || 0));
    
    const rows = 20;
    const cols = 60;
    const chart = Array(rows).fill(null).map(() => Array(cols).fill(' '));
    
    function getVolatilityColor(volatility: number): string {
        const volatilities = validData.map(t => t.metrics.volumeToMcap || 0);
        const maxVol = Math.max(...volatilities);
        const minVol = Math.min(...volatilities);
        const normalizedVol = (volatility - minVol) / (maxVol - minVol);
        
        if (normalizedVol > 0.66) return colors.positive;
        if (normalizedVol > 0.33) return colors.diff;
        return colors.negative;
    }
    
    validData.forEach(token => {
        // Use log scale with 0.9 compression
        const x = Math.floor((logScale(token.volume24h || 1) / logScale(maxVolume)) * (cols - 1) * 0.9);
        const y = Math.floor(((logScale(token.marketCap || 0) - logScale(minMarketCap)) / 
                            (logScale(maxMarketCap) - logScale(minMarketCap))) * (rows - 1));
        
        if (y >= 0 && y < rows && x >= 0 && x < cols) {
            const symbol = token.symbol.substring(0, 4);
            const volatilityColor = getVolatilityColor(token.metrics.volumeToMcap || 0);
            chart[rows - 1 - y][x] = `${volatilityColor}${symbol}${colors.reset}`;
        }
    });
    
    console.log('\n');
    console.log(`${colors.header_black}══════════════════════════════════ Market Analysis - LOG(n) ══════════════════════════════════${colors.reset}`);
    chart.forEach((row, i) => {
        const mcapValue = (maxMarketCap * (rows - i) / rows) / 1e6;
        console.log(`${colors.header_green}$${colors.reset}${mcapValue.toFixed(0).padStart(6)}M ${colors.header_black}|${colors.reset}${row.join('')}`);
    });
    console.log(`${colors.header_black}══════════════════════════════════════════════════════════════════════════════════════════════${colors.reset}`);
}


function generateHTMLReport(data: EnhancedTokenData[]) {
    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Token Metrics Analysis</title>
            <script src="https://cdn.plot.ly/plotly-latest.min.js"></script>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                .chart { height: 600px; margin-bottom: 30px; }
                .metrics { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px; }
                .metric-card { 
                    padding: 20px;
                    border: 1px solid #ddd;
                    border-radius: 8px;
                    background: #f9f9f9;
                }
            </style>
        </head>
        <body>
            <h1>Token Metrics Analysis</h1>
            
            <div id="scatterPlot" class="chart"></div>
            <div id="supplyChart" class="chart"></div>
            <div id="metrics" class="metrics"></div>

            <script>
                const data = ${JSON.stringify(data)};
                
                const scatter = {
                    x: data.map(t => t.volume24h),
                    y: data.map(t => t.marketCap),
                    text: data.map(t => t.symbol),
                    mode: 'markers+text',
                    type: 'scatter',
                    textposition: 'top center'
                };
                
                Plotly.newPlot('scatterPlot', [scatter], {
                    title: 'Market Cap vs 24h Volume',
                    xaxis: { title: '24h Volume ($)' },
                    yaxis: { title: 'Market Cap ($)' }
                });

                const supply = {
                    x: data.map(t => t.symbol),
                    y: data.map(t => t.circulatingSupply),
                    name: 'Circulating Supply',
                    type: 'bar'
                };
                
                const totalSupply = {
                    x: data.map(t => t.symbol),
                    y: data.map(t => t.totalSupply),
                    name: 'Total Supply',
                    type: 'bar'
                };
                
                Plotly.newPlot('supplyChart', [supply, totalSupply], {
                    title: 'Token Supply Comparison',
                    barmode: 'group'
                });
            </script>
        </body>
        </html>
    `;
    // Write the Token Analysis report to an HTML file
    const publicPath = join(process.cwd(), 'public', 'token-analysis.html');
    writeFileSync(publicPath, html);
    console.log('\nHTML report generated: /token-analysis.html');
    console.log('Access at: https://degenduel.me/token-analysis.html');
    // const response = await fetch('https://degenduel.me/api/upload', {
    //     method: 'POST',
    //     body: html
    // });
    // console.log('Upload response:', response);
    // console.log('Link: https://degenduel.me/tokens-analysis.html');
}

console.log(`${colors.inverted_white}═══════════════════════════════════════════════ START FULL TEST ═══════════════════════════════════════════════${colors.reset}`);

async function comparePriceAPIs() {
    console.log(`${colors.italic}Starting comparison...${colors.reset}`);

    try {
        console.log(`  ${colors.italic}Fetching tokens...${colors.reset}`);
        const response = await fetch('https://degenduel.me/api/tokens');
        console.log(`  ${colors.bold}API Response:${colors.reset}`, `${colors.white}${response.status}${colors.reset}`);
        
        const allTokens = await response.json();
        console.log(`  ${colors.bold}Found ${allTokens.length} ${colors.white}tokens${colors.reset}`);
        
        const tokens = allTokens.slice(0, MAX_TOKENS_PROCESSED);
        console.log(`  ${colors.italic}Analyzing first${colors.reset} ${colors.underline}${tokens.length}${colors.reset} ${colors.italic}tokens...${colors.reset}`);

        for (const token of tokens) {
            console.log(`\n\n\n${colors.inverted_black}======================== ${token.symbol} =========================${colors.reset}`);

            const dexData = await DexScreenerService.fetchTokenInfo(token.address).catch(() => null); // my edit
            const geckoData = await fetch(
                `https://api.coingecko.com/api/v3/coins/${token.symbol.toLowerCase()}?localization=false&tickers=true&market_data=true&community_data=true&developer_data=true`
            ).then(async res => {
                const data = await res.json();
                return isCoinGeckoData(data) ? data : null;
            }).catch(() => null);

            // Process and store token metrics
            tokenMetrics.push({
                address: token.address,
                name: token.name,
                symbol: token.symbol,
                price: dexData?.currentPrice || null,
                marketCap: dexData?.marketCap || null,
                volume24h: dexData?.volume24h || null,
                circulatingSupply: dexData?.circulatingSupply || null,
                totalSupply: dexData?.totalSupply || null,
                socials: buildSocialLinks(dexData?.socials),
                metrics: calculateMetrics({
                    marketCap: dexData?.marketCap || null,
                    volume24h: dexData?.volume24h || null,
                    price: dexData?.currentPrice || null,
                    socials: buildSocialLinks(dexData?.socials),
                    liquidity: dexData?.liquidity || null
                })
            });

            // Display DexScreener Data
            if (!dexData && !geckoData) {
                console.log(`\n${colors.error}⛔  ${token.symbol} is not listed on CoinGecko OR Dexscreener!${colors.reset}`);
            } else {
                console.log(`\n${colors.dex}DexScreener:${colors.reset}`);
                if (!dexData) {
                    console.log(`  ${colors.warning}⚠️  ${token.symbol} is not listed on Dexscreener!${colors.reset}`);
                } else {
                    // Format price without trailing zeros (up to 8 digits)
                    const price = dexData.currentPrice?.toFixed(8).replace(/\.?0+$/, '') || 'N/A';
                    console.log(`  Price: $${price}`);
                    
                    // Use formatMarketCap for both volume and market cap
                    console.log(`  24h Volume: ${formatMarketCap(dexData.volume24h || 0)}`);
                    console.log(`  Market Cap: ${formatMarketCap(dexData.marketCap || 0)}`);
                }
                
                const socials = buildSocialLinks(dexData?.socials);
                Object.entries(socials).forEach(([platform, data]) => {
                    console.log(`  >>  ${colors.diff}${platform}:${colors.reset} ${colors.blue}${typeof data === 'string' ? data : data.url}${colors.reset}`);
                });
            }

            // Display CoinGecko Data
            if (!geckoData && dexData) {
                console.log(`\n${colors.warning}  ⚠️ ${token.symbol} is not listed on CoinGecko! ⚠️${colors.reset}`);
            } else if (geckoData && !dexData) {
                console.log(`\n${colors.warning}  ⚠️ ${token.symbol} is not listed on Dexscreener! ⚠️${colors.reset}`);
            } else if (!geckoData && !dexData) {
                ////console.log(`\n${colors.error}⛔  ${token.symbol} is not listed on CoinGecko OR Dexscreener!${colors.reset}`);
            } else {
                console.log(`\n${colors.gecko}CoinGecko:${colors.reset}`);
                console.log(`  ${colors.bold}Price:      ${colors.reset}$${colors.white}${geckoData?.market_data?.current_price?.usd?.toFixed(8) || 'N/A'}${colors.reset}`);
                console.log(`  ${colors.bold}24h Volume: ${colors.reset}$${colors.white}${geckoData?.market_data?.total_volume?.usd?.toLocaleString() || 'N/A'}${colors.reset}`);
                console.log(`  ${colors.bold}Market Cap: ${colors.reset}$${colors.white}${geckoData?.market_data?.market_cap?.usd?.toLocaleString() || 'N/A'}${colors.reset}`);
                console.log(`  ${colors.bold}Rank:       ${colors.reset}#${colors.white}${geckoData?.market_cap_rank || 'N/A'}${colors.reset}`);
                
                // Social Links
                //console.log(`\n${colors.positive}Social Media:${colors.reset}`);
                const socialLinks = new Map();

                // Add DexScreener socials with proper platform detection
                if (dexData && dexData.socials) {
                    dexData.socials.forEach(social => {
                        if (social.url) {
                            // Properly identify platforms
                            if (social.url.includes('t.me')) {
                                socialLinks.set('telegram', social.url);
                            } 
                            if (social.url.includes('twitter.com')) {
                                socialLinks.set('twitter ', social.url);
                            } 
                            if (social.url.includes('discord')) {
                                socialLinks.set('discord ', social.url);
                            } 
                            if (social.url.includes('reddit.com')) {
                                socialLinks.set('reddit  ', social.url);
                            } 
                            if (!social.url.includes('dexscreener')) {
                                socialLinks.set('website ', social.url);
                            }
                        }
                    });
                }

                if (geckoData?.community_data) {
                    const twitterFollowers = geckoData?.community_data?.twitter_followers;
                    if (twitterFollowers && twitterFollowers > 0) {
                        console.log(`   ${colors.underline}Twitter${colors.reset} Followers:  ${colors.bold}${twitterFollowers?.toLocaleString()}${colors.reset}`);
                    }
                    const telegramUsers = geckoData?.community_data?.telegram_channel_user_count;
                    if (telegramUsers && telegramUsers > 0) {
                        console.log(`    ${colors.underline}Telegram${colors.reset} Members:   ${colors.bold}${telegramUsers?.toLocaleString()}${colors.reset}`);
                    }

                    const redditSubs = geckoData?.community_data?.reddit_subscribers;
                    if (redditSubs && redditSubs > 0) {
                        console.log(`  ${colors.underline}Reddit${colors.reset} Subscribers: ${colors.bold}${redditSubs?.toLocaleString()}${colors.reset}`);
                    }
                }
            }

            // Display calculated metrics (unless all data sources are missing)
            if (dexData || geckoData) {
                console.log(`\n${colors.metric}Metrics:${colors.reset} `);
                console.log(`  ${colors.underline}Liquidity:${colors.reset}   ${formatMetric(tokenMetrics[tokenMetrics.length-1].metrics.liquidityScore, '%')}`);
                console.log(`  ${colors.underline}Volatility:${colors.reset}  ${formatMetric(tokenMetrics[tokenMetrics.length-1].metrics.volumeToMcap, '%')}`);
            }

            // Rate limit delay
            await new Promise(resolve => setTimeout(resolve, SECONDS_DELAY * 1000));
        }

        // Generate visualizations after all data is collected
        generateASCIIChart(tokenMetrics);
        generateASCIILogChart(tokenMetrics);
        generateHTMLReport(tokenMetrics);
        console.log(`${colors.inverted_white}════════════════════════════════════════════════ END FULL TEST ════════════════════════════════════════════════${colors.reset}`);

    } catch (error) {
        console.error('ERROR in main function:', error);
        throw error;
    }
}

// Execute the analysis
console.log('About to start comparison...');
comparePriceAPIs()
    .then(() => console.log('Comparison completed'))
    .catch(e => console.error('Comparison failed:', e));

