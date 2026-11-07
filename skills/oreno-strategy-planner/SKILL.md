---
name: oreno-strategy-planner
description: Turn an investing goal written in plain words into a policy-checked, backtested tokenized-stock strategy, using the Oreno Agent through the paid x402 API ($0.25, charged only if it returns a valid strategy). Use when the user describes what they want ("monthly DCA into AI chip stocks, max 25% each") but has no exact basket yet.
---

# Oreno strategy planner (paid, $0.25)

`POST https://useoreno.com/api/x402/plan` with `{ "goal": "..." }`

Payment: see `oreno-x402-pay`. This is the priciest call, so pass `--max-usd 0.25` explicitly:

```bash
node skills/oreno-x402-pay/scripts/pay.mjs https://useoreno.com/api/x402/plan --max-usd 0.25 \
  --body '{"goal":"a monthly DCA into the biggest AI chip stocks, max 25% each, start with $2,000"}'
```

## When to use

- The user has an idea, not a portfolio: "something defensive with a bit of tech", "ride the AI trade but don't go all in".
- You want a ready definition you can tweak and re-run with `oreno-backtest`.

If the user already named the tokens and weights, skip this and call `oreno-backtest` directly. It is 5x cheaper.

## Writing a good goal

10 to 2,000 characters. The more concrete, the better the plan. Include:

- Theme or tokens ("AI chips", "big tech plus some silver")
- Starting amount and any monthly or weekly top-up
- Rebalancing preference
- Any cap per position (the policy maximum is 25% anyway)

Limits the planner must respect: max 25% per position, max $10,000 start, max $1,000 a month recurring, only Robinhood Chain stock tokens with a Chainlink feed.

## Response

| Field | Meaning |
| --- | --- |
| `reply` | The agent's explanation, in plain text |
| `strategy` | `name`, `description`, `rationale`, `definition` (same schema as `oreno-backtest`) |
| `policy[]` | The checks it passed |
| `backtest` | `metrics`, `notes`, `series`, `assumptions` |
| `model` | Model that produced the plan |
| `disclaimer` | Keep this with the result |

## Billing

You are only charged if the agent returns a strategy that passes the policy check and has a backtest. Otherwise you get an error and nothing settles. A `503` means the planner is at today's capacity, try tomorrow.

## Notes for the agent

- Confirm the $0.25 price with the user before calling, unless they already agreed.
- Show `strategy.rationale` and the rules, then the backtest next to its benchmark.
- Offer to adjust: change the `definition` and re-test with `oreno-backtest` instead of paying for a new plan.
- The plan is research, not advice, and Oreno never trades for the caller.
