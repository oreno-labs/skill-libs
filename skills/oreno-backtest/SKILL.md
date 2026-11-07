---
name: oreno-backtest
description: Backtest any tokenized-stock portfolio on Robinhood Chain prices through Oreno's paid x402 API ($0.05). Supports buy and hold, DCA, scheduled or drift-band rebalancing, and a trend filter. Returns metrics, an equity curve, an SPY benchmark and policy checks. Use when the user wants to test how a basket or rule set would have performed.
---

# Oreno backtest (paid, $0.05)

`POST https://useoreno.com/api/x402/backtest` with `{ "definition": { ... } }`

Payment: see `oreno-x402-pay`.

```bash
node skills/oreno-x402-pay/scripts/pay.mjs https://useoreno.com/api/x402/backtest --body "$(cat definition.json)"
```

## When to use

- "How would 25% each in NVDA, AMD, TSM and ASML have done?"
- "Backtest $1,000 plus $100 a month into SPY and QQQ."
- "Does rebalancing quarterly beat buy and hold for this basket?"

If the user only has a goal in words and no basket, use `oreno-strategy-planner`. It builds the definition and backtests it in one call.

## The strategy definition

```json
{
  "definition": {
    "allocations": [
      { "symbol": "NVDA", "weightBps": 2500 },
      { "symbol": "AMD",  "weightBps": 2500 },
      { "symbol": "TSM",  "weightBps": 2500 },
      { "symbol": "ASML", "weightBps": 2500 }
    ],
    "initialUsd": 1000,
    "dca": { "amountUsd": 100, "interval": "monthly" },
    "rebalance": { "interval": "quarterly", "bandBps": 0 },
    "maxPositionBps": 2500,
    "trend": null
  }
}
```

| Field | Rules |
| --- | --- |
| `allocations` | 1 to 20 items, `symbol` (1 to 6 uppercase letters) and `weightBps` (integer). Must total exactly `10000`. No duplicates. |
| `initialUsd` | Whole dollars, 0 to 1,000,000 |
| `dca` | `null`, or `{ amountUsd, interval }` with `interval` `weekly` or `monthly` |
| `rebalance` | `null`, or `{ interval, bandBps }`. `interval` is `weekly`, `monthly` or `quarterly`. `bandBps` 0 means always rebalance on schedule, above 0 means only trade when a position drifts that far |
| `maxPositionBps` | 100 to 10000, the per-position cap |
| `trend` | Optional. `{ symbol, lookbackDays (5 to 60), ifBelow: [allocations] }`. Holds `allocations` while `symbol` closes above its SMA, else holds `ifBelow` (empty list means cash). Needs a `rebalance` schedule |

## Policy check (validate before paying)

The API checks the definition against Oreno's default risk limits first. A failure is a free `400`, but you save a round trip by checking yourself:

- Weights total exactly 10000 (and `ifBelow` totals 10000 if not empty).
- No position above **2500 bps (25%)**, and none above your own `maxPositionBps`.
- `initialUsd` at most **10,000**.
- Recurring deposits at most **$1,000 a month** (weekly amount x 52 / 12).
- Every symbol is a priced Robinhood Chain stock token. Check against the free `oreno-markets` list.
- A `trend` filter has a `rebalance` schedule.

So a single-asset portfolio will fail the 25% cap. Use at least 4 names.

## Response

| Field | Meaning |
| --- | --- |
| `definition` | The normalized definition that ran |
| `policy[]` | Each check: `id`, `label`, `ok`, `detail` |
| `metrics` | `startDay`, `endDay`, `tradingDays`, `contributedUsd`, `finalValueUsd`, `profitUsd`, `totalReturn`, `annualizedReturn` (null under a year), `volatility`, `maxDrawdown`, `costsUsd`, `trades`, `benchmark` (`symbol`, `totalReturn`, `maxDrawdown`) |
| `notes` | `effectiveStart` (moved later if an asset had no history yet), `limitingAsset`, `carriedForwardDays`, `trendSwitches` |
| `assumptions` | Fee and slippage used (5 bps fees, 30 bps spread per trade) |
| `series` | Up to 260 equity curve points |
| `disclaimer` | Keep this with any result you show |

Returns, volatility and drawdown are fractions (`0.12` = 12%).

## Notes for the agent

- Always show the result next to the SPY `benchmark`, and mention the `effectiveStart` if it moved. History on Robinhood Chain is short.
- Results are hypothetical. Say so every time.
- For comparing variants (rebalance vs no rebalance), run each one, it is $0.05 per run. Tell the user the total before running many.
