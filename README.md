# Oreno skill library

Drop-in `SKILL.md` files that let AI agents use the [Oreno](https://useoreno.com) API: market data, analytics, backtests, AI strategy plans and public strategies for tokenized stocks on Robinhood Chain.

Free skills need nothing. Paid skills use [x402](https://www.x402.org), so an agent pays per call in USDG from its own wallet. No account, no API key.

## Skills

| Skill | Cost | What it does |
| --- | --- | --- |
| [oreno-markets](skills/oreno-markets/SKILL.md) | Free | Live prices, 24h and 30d change, price history and news for every stock token |
| [oreno-public-strategies](skills/oreno-public-strategies/SKILL.md) | Free | Browse public strategies with rules, backtests and paper results |
| [oreno-x402-pay](skills/oreno-x402-pay/SKILL.md) | n/a | How to pay any Oreno endpoint, plus a ready `pay.mjs` script |
| [oreno-market-screener](skills/oreno-market-screener/SKILL.md) | $0.02 | Rank and filter all tokens by returns, volatility, RSI, trend and beta |
| [oreno-token-deep-dive](skills/oreno-token-deep-dive/SKILL.md) | $0.03 | One token in depth: history, correlations, Uniswap liquidity, news |
| [oreno-backtest](skills/oreno-backtest/SKILL.md) | $0.05 | Backtest any basket with DCA, rebalancing or a trend filter |
| [oreno-strategy-planner](skills/oreno-strategy-planner/SKILL.md) | $0.25 | Turn a goal in plain words into a checked, backtested strategy |
| [oreno-top-strategies](skills/oreno-top-strategies/SKILL.md) | $0.02 | Public strategies ranked by paper or backtested return |

## Install

Copy the folders you want into wherever your agent loads skills from. Each folder is self-contained, except that the paid skills call the script in `oreno-x402-pay`, so install that one too.

```bash
git clone https://github.com/oreno-labs/skill-libs.git
cp -r skill-libs/skills/* /path/to/your/agent/skills/
```

For paid calls:

```bash
cd /path/to/your/agent/skills/oreno-x402-pay/scripts && npm install
export ORENO_AGENT_KEY=0x...   # wallet with a little USDG on Robinhood Chain
```

## A typical flow

1. `oreno-markets` to get the symbol list (free).
2. `oreno-market-screener` to find names that fit (2 cents).
3. `oreno-backtest` to test a basket (5 cents), or `oreno-strategy-planner` if you only have a goal (25 cents).
4. `oreno-public-strategies` or `oreno-top-strategies` to compare with what others run.

## Links

- Free endpoint and price list: https://useoreno.com/api/x402
- Docs: https://docs.useoreno.com
- Every settled payment: https://useoreno.com/x402

Everything here is research and market data, not investment advice. Backtests are hypothetical and Oreno never trades for the caller.
