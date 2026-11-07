---
name: oreno-markets
description: Get live prices, 24h and 30d changes, sparklines and news for tokenized stocks on Robinhood Chain from the free Oreno public API. Use when the user asks for a stock token price, the list of available symbols, a quick market overview, or one token's daily price history. No key, no payment.
---

# Oreno markets (free)

Read-only market data for every priced stock token on Robinhood Chain (chain id 4663). Prices come from Chainlink feeds. No authentication, no payment.

Base URL: `https://useoreno.com`

## When to use

- "What's NVDA trading at?"
- "Which stock tokens can I get on Robinhood Chain?"
- "Show me the price history for TSLA."
- You need a valid symbol list before calling another Oreno skill.

If the user wants screener stats (RSI, volatility, beta, trend) or liquidity quotes, use `oreno-market-screener` or `oreno-token-deep-dive` instead. Those are paid.

## Endpoints

### All markets

```bash
curl -s https://useoreno.com/api/public/markets
```

Returns:

| Field | Meaning |
| --- | --- |
| `markets[]` | `symbol`, `name`, `token` (contract), `feed` (Chainlink), `logoUrl`, `price`, `change24h`, `change30d`, `spark` (about 30 recent closes), `updatedAt` (unix seconds), `oraclePaused` |
| `deployedTokens` | Count of stock tokens deployed by the StockFactory |
| `latestClose` | Most recent stored daily close (`YYYY-MM-DD`) |
| `news[]` | `title`, `url`, `source`, `publishedAt` |

Cached for 60 seconds. Do not poll faster than that.

### One token

```bash
curl -s https://useoreno.com/api/public/markets/NVDA
```

Returns `market` (same fields as above), `history` as `[day, close]` rows, `range` (`high`, `low`, `first`, `last`), public `strategies` that hold the token, and `news`. Unknown or unpriced symbols return `404`.

### Raw on-chain snapshot

```bash
curl -s https://useoreno.com/api/markets
```

`chainId`, `blockNumber`, `generatedAt`, `deployedTokens`, and `tokens[]`. Use this when you need the block number the prices were read at.

## Reading the numbers

- `price` is a decimal string in USD. Parse it before doing math.
- `change24h` and `change30d` are already in percent (`-2.5` means down 2.5%).
- If `oraclePaused` is `true`, the price is stale. Say so instead of quoting it as live.
- Symbols are uppercase, 1 to 6 letters (`SPY`, `GOOGL`, `TSM`).

## Example: quick price answer

```bash
curl -s https://useoreno.com/api/public/markets \
  | jq '.markets[] | select(.symbol=="NVDA") | {symbol, price, change24h, oraclePaused}'
```

## Notes for the agent

- This is market data, not investment advice. Do not tell the user to buy or sell.
- Robinhood stock tokens may not be available to US persons or in some jurisdictions. Mention it if the user asks how to buy.
- Show the `updatedAt` time when the user cares about freshness.
