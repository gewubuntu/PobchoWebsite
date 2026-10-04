// Holder count, fetched at build time (the deploy workflow rebuilds daily to keep it fresh).
// Sources, in order:
//   1. Basescan via the Etherscan V2 API – needs BASESCAN_API_KEY (the holder-count endpoint requires an API PRO plan)
//   2. Blockscout for Base – free, no key
//   3. The manual fallback in site.ts

import { token } from "./site";

const TIMEOUT = 10_000;

type Result = { value: number; source: "basescan" | "blockscout" | "fallback" };

async function getJson(url: string): Promise<unknown> {
  const res = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT), headers: { accept: "application/json" } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

const toCount = (value: unknown) => {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : undefined;
};

async function fromBasescan(apiKey: string) {
  const url = new URL("https://api.etherscan.io/v2/api");
  url.search = new URLSearchParams({
    chainid: "8453",
    module: "token",
    action: "tokenholdercount",
    contractaddress: token.address,
    apikey: apiKey,
  }).toString();
  const data = (await getJson(url.href)) as { status?: string; result?: unknown; message?: string };
  if (data.status !== "1") throw new Error(`${data.message ?? "error"}: ${String(data.result)}`);
  return toCount(data.result);
}

async function fromBlockscout() {
  const data = (await getJson(`https://base.blockscout.com/api/v2/tokens/${token.address}`)) as {
    holders_count?: unknown;
    holders?: unknown;
  };
  return toCount(data.holders_count ?? data.holders);
}

async function load(): Promise<Result> {
  const apiKey = process.env.BASESCAN_API_KEY;
  if (apiKey) {
    try {
      const value = await fromBasescan(apiKey);
      if (value) return { value, source: "basescan" };
    } catch (error) {
      console.warn(`[holders] Basescan failed (${(error as Error).message}), trying Blockscout`);
    }
  }
  try {
    const value = await fromBlockscout();
    if (value) return { value, source: "blockscout" };
  } catch (error) {
    console.warn(`[holders] Blockscout failed (${(error as Error).message}), using fallback from site.ts`);
  }
  return { value: token.holders.value, source: "fallback" };
}

let cached: Promise<Result> | undefined;

/** Fetched once per build. */
export function getHolders() {
  cached ??= load().then((result) => {
    console.info(`[holders] ${result.value} (${result.source})`);
    return result;
  });
  return cached;
}
