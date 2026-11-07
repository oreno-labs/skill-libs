#!/usr/bin/env node
// Calls a paid Oreno x402 endpoint: request, read the 402, sign a USDG
// TransferWithAuthorization, retry with PAYMENT-SIGNATURE.
//
//   ORENO_AGENT_KEY=0x... node pay.mjs <url> [--body '<json>'] [--max-usd 0.25] [--dry-run]
//
// Prints the JSON result on stdout. Everything else goes to stderr.

import { keccak256, toHex } from "viem";
import { privateKeyToAccount } from "viem/accounts";

const ORENO_PAY_TO = "0xf82c00aad1702de0223ccafda7bf17d5446cd93e";
const CHAIN_ID = 4663;

const args = process.argv.slice(2);
const flag = (name) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : undefined;
};
const has = (name) => args.includes(`--${name}`);
const log = (...m) => console.error(...m);

const enc = (v) => Buffer.from(JSON.stringify(v)).toString("base64");
const dec = (h) => {
  try {
    return JSON.parse(Buffer.from(h, "base64").toString("utf8"));
  } catch {
    return null;
  }
};

async function main() {
  const url = args[0];
  if (!url?.startsWith("http")) {
    throw new Error("usage: node pay.mjs <url> [--body '<json>'] [--max-usd 0.25] [--dry-run]");
  }
  const body = flag("body");
  if (body) JSON.parse(body); // fail early on bad JSON
  const maxUsd = Number(flag("max-usd") ?? "0.25");

  const init = (headers = {}) =>
    body
      ? { method: "POST", headers: { "content-type": "application/json", ...headers }, body }
      : { headers };

  const first = await fetch(url, init());
  if (first.status !== 402) {
    const text = await first.text();
    if (first.ok) return console.log(text); // free or already paid
    throw new Error(`${first.status}: ${text}`);
  }

  const required = dec(first.headers.get("payment-required") ?? "") ?? (await first.json().catch(() => null));
  const req = required?.accepts?.[0];
  if (!req) throw new Error("Got 402 without readable payment requirements");

  const priceUsd = Number(req.amount) / 1e6;
  log(`price: ${priceUsd} USDG on ${req.network}, pay to ${req.payTo}`);

  if (req.payTo.toLowerCase() !== ORENO_PAY_TO) throw new Error(`Unexpected payTo ${req.payTo}, refusing to sign`);
  if (req.network !== `eip155:${CHAIN_ID}`) throw new Error(`Unexpected network ${req.network}, refusing to sign`);
  if (priceUsd > maxUsd) throw new Error(`Price ${priceUsd} is above --max-usd ${maxUsd}, refusing to sign`);
  if (has("dry-run")) return log("dry run, nothing signed");

  const key = process.env.ORENO_AGENT_KEY;
  if (!key) throw new Error("Set ORENO_AGENT_KEY to a wallet key holding USDG on Robinhood Chain");
  const account = privateKeyToAccount(key);

  const now = Math.floor(Date.now() / 1000);
  const authorization = {
    from: account.address,
    to: req.payTo,
    value: req.amount,
    validAfter: String(now - 5),
    validBefore: String(now + Math.min(req.maxTimeoutSeconds ?? 120, 3600)),
    nonce: keccak256(toHex(crypto.getRandomValues(new Uint8Array(32)))),
  };

  const signature = await account.signTypedData({
    domain: { name: req.extra.name, version: req.extra.version, chainId: CHAIN_ID, verifyingContract: req.asset },
    types: {
      TransferWithAuthorization: [
        { name: "from", type: "address" },
        { name: "to", type: "address" },
        { name: "value", type: "uint256" },
        { name: "validAfter", type: "uint256" },
        { name: "validBefore", type: "uint256" },
        { name: "nonce", type: "bytes32" },
      ],
    },
    primaryType: "TransferWithAuthorization",
    message: {
      ...authorization,
      value: BigInt(authorization.value),
      validAfter: BigInt(authorization.validAfter),
      validBefore: BigInt(authorization.validBefore),
    },
  });

  const payment = { x402Version: 2, resource: required.resource, accepted: req, payload: { signature, authorization } };
  const res = await fetch(url, init({ "PAYMENT-SIGNATURE": enc(payment) }));

  const receipt = res.headers.get("payment-response");
  if (receipt) log("settled:", JSON.stringify(dec(receipt)));
  const text = await res.text();
  if (!res.ok) {
    const refused = dec(res.headers.get("payment-required") ?? "");
    throw new Error(`${res.status}: ${refused?.error ?? text}`);
  }
  console.log(text);
}

main().catch((err) => {
  log(err instanceof Error ? err.message : err);
  process.exit(1);
});
