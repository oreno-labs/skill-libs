---
name: oreno-public-strategies
description: Browse and read public tokenized-stock investing strategies on Oreno, with their rules, backtests, paper-trading (forward) results and follower counts, from the free public API. Use when the user wants to find strategy ideas, look up one strategy by id, or see what others are running. No key, no payment.
---

# Oreno public strategies (free)

Every strategy published on Oreno, with its full definition and track record. No authentication, no payment.

Base URL: `https://useoreno.com`

## When to use

- "Show me some strategies people run on Oreno."
- "What's inside the Big Tech Core strategy?"
- "Which public strategies hold NVDA?" (or use `oreno-markets` for one symbol, it lists them too)
- You want a real strategy definition to start from before calling `oreno-backtest`.

If the user wants a ranked leaderboard, `oreno-top-strategies` does the sorting for you (paid, $0.02). You can also sort this free list yourself.

## Endpoints

### All public strategies

```bash
curl -s https://useoreno.com/api/public/strategies
```

| Field | Meaning |
| --- | --- |
| `strategies[]` | `id`, `name`, `description`, `kind`, `owner`, `isExample`, `version`, `publishedAt`, `definition`, `rules`, `usage`, `backtest`, `forward` |
| `strategies[].usage` | `followers`, `copies`, `activePaperRuns` |
| `strategies[].backtest` | `metrics` and `notes` from the latest backtest, or `null` |
| `strategies[].forward` | `startDay`, `days`, `lastDay`, `totalReturn`, `maxDrawdown`, `valueUsd`, `contributedUsd`, or `null` |
| `stats` | `publicStrategies`, `trackedStrategyDays`, `follows`, `copies`, `activePaperRuns`, `latestClose` |

Cached for 5 minutes.

### One strategy

```bash
curl -s https://useoreno.com/api/public/strategies/example-big-tech-core
```

Returns `{ strategy }` with everything above plus `forwardSeries` and `backtestSeries` (`[day, valueUsd, contributedUsd]` rows), `backtestAssumptions`, and `pastVersions`.

Human-readable page for any strategy: `https://useoreno.com/strategies/{id}`

## Strategy kinds

`buy_and_hold`, `dca`, `fixed_weight`, `periodic_rebalance`, `threshold_rebalance`, `trend_filter`.

## Reading the numbers

- `totalReturn` and `maxDrawdown` are fractions (`0.12` = 12%).
- `rules` is a list of plain sentences that describe the definition. Quote these to the user instead of dumping raw JSON.
- `isExample: true` means it is an Oreno template, not a user's live strategy.

## Example: best forward record

```bash
curl -s https://useoreno.com/api/public/strategies \
  | jq '[.strategies[] | select(.forward != null)] | sort_by(-.forward.totalReturn) | .[0:5] | map({id, name, ret: .forward.totalReturn, days: .forward.days})'
```

## Notes for the agent

- Backtests are hypothetical. Forward results are paper simulations from the publish date. Keep those labels when you show results.
- Short forward records (a few days or weeks) say very little. Mention `forward.days` next to any return.
- Never present a strategy as a recommendation.
