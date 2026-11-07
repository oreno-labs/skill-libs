---
name: oreno-top-strategies
description: Get public tokenized-stock strategies on Oreno ranked by forward (paper trading) or backtested return, with full rules and definitions, through the paid x402 API ($0.02). Use when the user asks for the best performing, top, or leaderboard strategies.
---

# Oreno top strategies (paid, $0.02)

`GET https://useoreno.com/api/x402/strategies/top`

Payment: see `oreno-x402-pay`.

```bash
node skills/oreno-x402-pay/scripts/pay.mjs "https://useoreno.com/api/x402/strategies/top?sort=forward&limit=5"
```

## When to use

- "What are the top strategies on Oreno right now?"
- "Best DCA strategies by backtest."
- "Show me the leaderboard."

For browsing without ranking, or reading one strategy in full, the free `oreno-public-strategies` skill is enough.

## Query parameters

| Param | Values | Default |
| --- | --- | --- |
| `sort` | `forward` (paper return since publish) or `backtest` | `forward` |
| `kind` | Optional filter: `buy_and_hold`, `dca`, `fixed_weight`, `periodic_rebalance`, `threshold_rebalance`, `trend_filter` | none |
| `limit` | 1 to 20 | 10 |

Strategies with no score for the chosen sort are left out.

## Response

```
sort, latestClose, disclaimer,
strategies[]: {
  rank, id, name, description, kind, owner, isExample, url,
  definition, rules, forward, backtest, usage
}
```

`forward` has `startDay`, `days`, `totalReturn`, `maxDrawdown`, `valueUsd`, `contributedUsd`. `backtest` is the metrics block from `oreno-backtest`. Returns are fractions.

## Notes for the agent

- A strategy with 5 days of forward data can top the list by luck. Always show `forward.days` next to the return.
- Show `rules` as sentences and link `url` so the user can open the strategy page.
- Want to test a variation? Take its `definition`, edit it, and run `oreno-backtest`.
- Forward results are paper simulations and backtests are hypothetical. Neither is advice.
