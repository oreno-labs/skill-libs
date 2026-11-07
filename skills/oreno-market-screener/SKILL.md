---
name: oreno-market-screener
description: Screen every tokenized stock on Robinhood Chain by 7/30/90-day and YTD returns, volatility, drawdown, distance from high, SMA trend, RSI 14 and beta vs SPY, through Oreno's paid x402 API ($0.02 per call). Use when the user wants to rank, filter or compare stock tokens by momentum, risk or trend.
---

# Oreno market screener (paid, $0.02)

One call returns analytics for every priced stock token, sorted and filtered the way you ask.

`GET https://useoreno.com/api/x402/markets`

Payment: see `oreno-x402-pay`. Use its script:

```bash
node skills/oreno-x402-pay/scripts/pay.mjs "https://useoreno.com/api/x402/markets?sort=return30d&limit=10"
```

## When to use

- "Which stock tokens are up the most this month?"
- "Show me the least volatile names."
- "What's oversold right now?" (sort by `rsi14`, `order=asc`)
- "Which tokens are in an uptrend?" (`trend=up`)
- "Compare NVDA, AMD and TSM on risk."

For a plain price, use the free `oreno-markets` skill instead.

## Query parameters (all optional)

| Param | Values | Default |
| --- | --- | --- |
| `symbols` | Comma-separated, e.g. `NVDA,AAPL` (up to 60) | all |
| `sort` | `return30d`, `return7d`, `return90d`, `change24h`, `volatility30d`, `fromHigh`, `rsi14`, `beta`, `symbol` | `return30d` |
| `order` | `desc`, `asc` | `desc` |
| `trend` | `up`, `down`, `mixed` | none |
| `limit` | 1 to 100 | 100 |

Tokens missing a value sort last.

## Response

```
generatedAt, blockNumber, latestClose, count, sort, order, note,
markets[]: {
  symbol, name, price, change24hPct, priceUpdatedAt, priceAgeSeconds,
  oraclePaused, token, feed, url,
  stats: {
    lastClose, returns { d7, d30, d90, ytd, sinceListing },
    volatility { d30, d90 }, maxDrawdown, fromHigh, high, low,
    sma { d20, d50 }, trend, rsi14, vsSpy { beta, correlation }, historyDays
  }
}
```

## Units, read carefully

- `change24hPct` is in percent.
- Every other return, `volatility`, `maxDrawdown` and `fromHigh` is a fraction. `0.05` means 5%. Multiply by 100 before showing.
- Volatility is annualized.
- `trend` is `up` when the close is above both SMA 20 and SMA 50, `down` when below both, else `mixed`.
- `beta` and `correlation` are vs SPY over the last 90 calendar days.
- Stats are built from weekday daily closes of the Chainlink feeds.

## Recipes

Top 5 momentum, uptrend only:

```bash
node skills/oreno-x402-pay/scripts/pay.mjs "https://useoreno.com/api/x402/markets?sort=return30d&trend=up&limit=5" \
  | jq '.markets[] | {symbol, r30: (.stats.returns.d30*100), rsi: .stats.rsi14}'
```

Low volatility first:

```bash
node skills/oreno-x402-pay/scripts/pay.mjs "https://useoreno.com/api/x402/markets?sort=volatility30d&order=asc&limit=10"
```

## Notes for the agent

- One screener call covers every token. Do not call it once per symbol, use `symbols=` instead.
- Check `priceAgeSeconds` and `oraclePaused` before calling a price live.
- This is market data, not advice. Describe what the numbers show, do not recommend trades.
