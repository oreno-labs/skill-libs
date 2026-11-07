---
name: oreno-token-deep-dive
description: Deep dive on one Robinhood Chain stock token through Oreno's paid x402 API ($0.03): full stats, daily price history, most and least correlated tokens, live Uniswap v3 buy quotes vs Chainlink, strategies holding it, and news. Use when the user wants a full report on a single symbol, its liquidity or price impact, or what it moves with.
---

# Oreno token deep dive (paid, $0.03)

Everything Oreno knows about one stock token, in one call.

`GET https://useoreno.com/api/x402/markets/detail?symbol=NVDA`

Payment: see `oreno-x402-pay`.

```bash
node skills/oreno-x402-pay/scripts/pay.mjs "https://useoreno.com/api/x402/markets/detail?symbol=NVDA&days=180"
```

## When to use

- "Give me a full rundown on TSLA."
- "How liquid is PLTR on chain? What would a $1,000 buy cost me?"
- "What does NVDA move with?"
- "Which strategies hold MSTR?"

## Query parameters

| Param | Values | Default |
| --- | --- | --- |
| `symbol` | Required. 1 to 6 letters, e.g. `NVDA` | none |
| `days` | Price history length, 5 to 1000 | 365 |

An unknown symbol returns a free `400`. Get valid symbols from the free `oreno-markets` skill first if you are not sure.

## Response

| Field | Meaning |
| --- | --- |
| `market` | Same row as the screener: price, `change24hPct`, freshness, and full `stats` |
| `history` | `[day, close]` weekday rows for the requested window |
| `correlations90d` | `mostCorrelated` and `leastCorrelated`, top 5 each, `{ symbol, name, correlation }` |
| `liquidity` | `venue`, `pools[]` (`pool`, `feeTier`), `buyQuotes[]` for $100 and $1,000 |
| `liquidity.buyQuotes[]` | `buyUsd`, `fillable`, `effectivePrice`, `deviationBpsVsChainlink`, `feeTier`, `pool` |
| `strategies` | Public strategies that hold this token, each with a `url` |
| `news` | Recent headlines |
| `availability` | Jurisdiction note for Robinhood stock tokens |

## Reading the liquidity block

- `deviationBpsVsChainlink` positive means a buy pays above the Chainlink price. 100 bps is 1%.
- `fillable: false` means no route could fill that size right now.
- `liquidity` can be `null` if the chain read failed. Say liquidity is unknown, do not guess.
- Quotes are live simulations and can move before a real trade lands.

## Units

Same as the screener: `change24hPct` is percent, every other return and volatility is a fraction (`0.05` = 5%), volatility annualized.

## Notes for the agent

- Present the price impact in plain words, e.g. "a $1,000 buy fills about 0.4% above the oracle price".
- Always pass along the `availability` note if the user talks about buying.
- Not investment advice. Report, do not recommend.
