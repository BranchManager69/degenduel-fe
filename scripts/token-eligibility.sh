#!/bin/bash

# Token Eligibility Analysis Script
# Analyzes token eligibility breakdown for DegenDuel

echo "🔍 Running Token Eligibility Analysis..."
echo "========================================"

sudo -u postgres psql -d degenduel -c "
WITH token_analysis AS (
    SELECT DISTINCT ON (t.symbol)
        t.symbol,
        t.name,
        t.is_active,
        t.image_url IS NOT NULL AND t.image_url != '' as has_logo,
        tp.market_cap::numeric as market_cap,
        tp.volume_24h::numeric as volume_24h,
        COALESCE(tp.liquidity::numeric, 0) as liquidity,
        tp.updated_at,
        NOW() - tp.updated_at as data_age,
        CASE
            WHEN NOT t.is_active THEN 'inactive'
            WHEN tp.updated_at < NOW() - INTERVAL '5 minutes' THEN 'stale_data'
            WHEN COALESCE(tp.liquidity::numeric, 0) < 10000 THEN 'low_liquidity'
            WHEN tp.volume_24h::numeric < 50000 THEN 'low_volume'
            WHEN tp.market_cap::numeric < 50000 THEN 'low_market_cap'
            ELSE 'qualified'
        END as status
    FROM tokens t
    LEFT JOIN token_prices tp ON t.id = tp.token_id
    WHERE
        t.name IS NOT NULL AND t.name != ''
        AND t.symbol IS NOT NULL AND t.symbol != ''
        AND tp.market_cap IS NOT NULL
        AND tp.volume_24h IS NOT NULL
    ORDER BY t.symbol, tp.updated_at DESC
)
SELECT
    status,
    COUNT(*) as count,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM token_analysis
GROUP BY status
ORDER BY count DESC;
"

echo ""
echo "✅ Analysis complete!"