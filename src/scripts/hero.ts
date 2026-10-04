// Hero interactions: copy contract address, animated stat counters and live token data from DEX Screener.

import { formatCompact, formatPrice } from "./format";
import { token } from "../data/site";

const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------------------------------------------------------------- copy -- */

document.querySelectorAll<HTMLButtonElement>("[data-copy]").forEach((button) => {
  const status = button.querySelector<HTMLElement>("[data-copy-status]");
  const idle = button.dataset.tooltip ?? "";
  let timer: number | undefined;

  button.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(button.dataset.copy ?? "");
      button.dataset.tooltip = "Copied!";
      button.classList.add("is-copied");
      if (status) status.textContent = "Address copied to clipboard";
      clearTimeout(timer);
      timer = window.setTimeout(() => {
        button.dataset.tooltip = idle;
        button.classList.remove("is-copied");
        if (status) status.textContent = "";
      }, 2000);
    } catch {
      // Clipboard can be unavailable (e.g. insecure context); the address stays visible for manual copying.
    }
  });
});

/* ------------------------------------------------------------ counters -- */

const easeSwing = (p: number) => 0.5 - Math.cos(p * Math.PI) / 2;

/** Counts every number inside the formatted text up from zero, keeping separators and suffixes. */
function animateText(el: HTMLElement, finalText: string, duration = 2500) {
  if (reducedMotion) {
    el.textContent = finalText;
    return;
  }
  const parts = finalText.split(/(\d+)/);
  const start = performance.now();
  const frame = (now: number) => {
    const p = Math.min((now - start) / duration, 1);
    el.textContent = parts
      .map((part, i) => (i % 2 ? String(Math.floor(Number(part) * easeSwing(p))).padStart(part.length > 1 && part.startsWith("0") ? part.length : 0, "0") : part))
      .join("");
    if (p < 1) requestAnimationFrame(frame);
    else el.textContent = finalText;
  };
  requestAnimationFrame(frame);
}

const counters = document.querySelectorAll<HTMLElement>(".stat__value");
const visible = new WeakSet<HTMLElement>();
const animated = new WeakSet<HTMLElement>();

function render(counter: HTMLElement) {
  const value = counter.dataset.count;
  const target = counter.querySelector<HTMLElement>("[data-count-target]");
  if (!target || value === undefined || value === "") return;
  const text = formatCompact(Number(value));
  if (animated.has(counter) || !visible.has(counter)) {
    if (animated.has(counter)) target.textContent = text;
    return;
  }
  animated.add(counter);
  animateText(target, text);
}

const counterObserver = new IntersectionObserver(
  (entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      const counter = entry.target as HTMLElement;
      visible.add(counter);
      counterObserver.unobserve(counter);
      render(counter);
    }
  },
  { threshold: 0.5 },
);
counters.forEach((counter) => counterObserver.observe(counter));

/* ----------------------------------------------------------- live data -- */

type Pair = {
  chainId: string;
  baseToken: { address: string; symbol: string };
  priceUsd?: string;
  priceChange?: { h24?: number };
  marketCap?: number;
  volume?: { h24?: number };
  txns?: { h24?: { buys: number; sells: number } };
};

const API = "https://api.dexscreener.com/latest/dex";

async function fetchPair(): Promise<Pair | undefined> {
  try {
    const res = await fetch(`${API}/pairs/base/${token.pairAddress}`, { cache: "no-store" });
    const data = await res.json();
    if (data?.pair?.priceUsd) return data.pair as Pair;
  } catch {
    /* fall through to the token endpoint */
  }
  try {
    const res = await fetch(`${API}/tokens/${token.address}`, { cache: "no-store" });
    const data = await res.json();
    return (data?.pairs as Pair[] | undefined)?.find(
      (pair) =>
        pair.chainId === token.chain &&
        pair.baseToken.symbol === token.symbol &&
        pair.baseToken.address.toLowerCase() === token.address.toLowerCase(),
    );
  } catch {
    return undefined;
  }
}

const priceEl = document.querySelector<HTMLElement>("[data-price]");

function setLive(key: string, value: number | undefined) {
  if (value === undefined || !Number.isFinite(value)) return;
  document.querySelectorAll<HTMLElement>(`[data-live="${key}"]`).forEach((counter) => {
    counter.dataset.count = String(value);
    render(counter);
  });
}

async function refresh() {
  const pair = await fetchPair();
  const price = Number(pair?.priceUsd);
  if (!pair || !price) return;

  const change = Number(pair.priceChange?.h24 ?? 0);
  const priceText = `$${formatPrice(price)} (${change.toFixed(2)}%)`;

  if (priceEl) {
    const trend = change > 0 ? "up" : change < 0 ? "down" : "flat";
    priceEl.dataset.trend = trend;
    priceEl.querySelector<HTMLElement>("[data-price-up]")!.hidden = trend !== "up";
    priceEl.querySelector<HTMLElement>("[data-price-down]")!.hidden = trend !== "down";
    priceEl.querySelector<HTMLElement>("[data-price-text]")!.textContent = priceText;
  }

  setLive("marketCap", pair.marketCap);
  setLive("volume", pair.volume?.h24);
  const txns = pair.txns?.h24;
  setLive("transactions", txns ? txns.buys + txns.sells : undefined);

  document.title = `$${token.symbol}: $${formatPrice(price)} (${change.toFixed(2)}%) | Poncho on Base`;
}

refresh();
// Refresh every minute while the tab is visible.
setInterval(() => {
  if (document.visibilityState === "visible") refresh();
}, 60_000);
