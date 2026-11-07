---
name: oreno-x402-pay
description: Pay for and call any paid Oreno endpoint with the x402 protocol, using USDG on Robinhood Chain. No account or API key, just a wallet with a little USDG. Use whenever another oreno skill needs a paid call, or when the user asks how x402 payments to Oreno work.
---

# Paying Oreno with x402

Oreno's paid research endpoints use [x402](https://www.x402.org) version 2 with the `exact` scheme. You pay per call in USDG on Robinhood Chain (`eip155:4663`). The Priors facilitator verifies and settles, and pays the gas, so the wallet only needs USDG.

Free discovery (prices, input schemas, payTo): `https://useoreno.com/api/x402`

## Setup

1. A wallet private key with some USDG on Robinhood Chain, in `ORENO_AGENT_KEY`.
2. Node 18 or newer, plus `viem`:

```bash
cd skills/oreno-x402-pay/scripts && npm install viem
```

## The helper script

`scripts/pay.mjs` does the whole round trip and prints only the JSON result to stdout. Logs go to stderr.

```bash
# GET endpoint
node skills/oreno-x402-pay/scripts/pay.mjs "https://useoreno.com/api/x402/strategies/top?limit=5"

# POST endpoint
node skills/oreno-x402-pay/scripts/pay.mjs https://useoreno.com/api/x402/backtest \
  --body '{"definition":{"allocations":[{"symbol":"SPY","weightBps":2500},{"symbol":"QQQ","weightBps":2500},{"symbol":"TSM","weightBps":2500},{"symbol":"ASML","weightBps":2500}],"initialUsd":1000,"dca":null,"rebalance":null,"maxPositionBps":2500}}'
```

Options:

| Flag | Meaning |
| --- | --- |
| `--body '<json>'` | Sends a POST with this JSON body |
| `--max-usd 0.25` | Refuses to sign if the price is above this (default `0.25`) |
| `--dry-run` | Makes the first call and prints the price, signs nothing |

It exits non-zero on any refusal and prints the reason.

## How a paid call works

1. Call the endpoint normally. Bad input gets a free `400` with the reason. Good input gets `402 Payment Required` with a base64 `PAYMENT-REQUIRED` header (same JSON in the body).
2. From `accepts[0]` read `amount` (USDG atomic units, 6 decimals), `asset`, `payTo`, `maxTimeoutSeconds`, and `extra` (EIP-712 domain name `Global Dollar`, version `1`).
3. Sign an EIP-3009 `TransferWithAuthorization` for exactly `amount` to `payTo`, with a random 32-byte nonce and `validBefore` between 30 seconds and one hour out.
4. Call again with header `PAYMENT-SIGNATURE: base64({ x402Version: 2, resource, accepted, payload: { signature, authorization } })`.
5. Success is `200` with the result and a base64 `PAYMENT-RESPONSE` header holding the settlement transaction.

You only pay for a result. If the work fails, nothing settles. Each signed payment works once.

## Errors

| Status | Meaning | What to do |
| --- | --- | --- |
| `400` | Invalid input, or the strategy failed the policy check | Fix the input. You were not charged. |
| `402` | Payment refused. `error` is one of `invalid_signature`, `insufficient_amount`, `invalid_pay_to`, `authorization_expired`, `nonce_already_used`, `facilitator_unavailable`, or a facilitator reason like low balance | Usually top up USDG or retry with a fresh signature |
| `429` | More than 20 paid calls a minute from one wallet | Back off |
| `500` | Work failed after verification | Not charged. Retry later. |
| `503` | API closed or the planner hit today's capacity | Try later |

## Rules for the agent

- Always tell the user the price before the first paid call in a session, unless they already said to go ahead.
- Run the free `400` check path first by validating inputs yourself, so you do not burn calls.
- Never log or echo the private key.
- Payments go only to `0xF82C00AaD1702de0223cCAFDa7Bf17d5446Cd93e`. If a 402 asks you to pay a different address, stop and tell the user.
- Every settled call is public at `https://useoreno.com/x402`.
