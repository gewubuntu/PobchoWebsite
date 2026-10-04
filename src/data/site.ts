// Single source of truth for addresses, links and figures used across the site.

export const site = {
  name: "Poncho on Base",
  title: "Poncho on Base",
  description:
    "Poncho is the cutest cat on Base with the strongest community. The friendly face that welcomes all Smart Wallet users.",
  url: "https://www.ponchobase.com",
  twitterHandle: "@ponchoBASE",
  themeColor: "#1d1a7a",
  analyticsId: "G-LBV1YCZ3ME",
} as const;

export const token = {
  symbol: "PONCHO",
  chain: "base",
  address: "0xC2fE011C3885277c7F0e7ffd45Ff90cADc8ECD12",
  pairAddress: "0x6FD34677ecDFae4caE732A5B22F1A3082917eb15",
  maxSupply: 10_000_000,
  launchDate: "March 11, 2024",
  allocation: [
    { label: "Team", value: 5, color: "var(--poncho_orange)" },
    { label: "LP", value: 95, color: "var(--poncho_blue)" },
  ],
  lpLockYears: 5,
  // Fallback only – the live holder count is fetched at build time (see src/data/holders.ts).
  holders: { value: 92_985, updated: "2025-02-16" },
} as const;

export const uniswapUrl = `https://app.uniswap.org/swap?chain=base&theme=dark&inputCurrency=ETH&outputCurrency=${token.address}`;

export const links = {
  twitter: "https://x.com/ponchoBASE",
  telegram: "https://t.me/ponchoBASE",
  dexscreener: `https://dexscreener.com/base/${token.pairAddress.toLowerCase()}`,
  coinmarketcap: "https://coinmarketcap.com/currencies/poncho/",
  coingecko: "https://www.coingecko.com/en/coins/poncho",
  medium: "https://medium.com/@ponchobase",
  opensea: "https://opensea.io/collection/poncho-pals",
  smartWallet: "https://wallet.coinbase.com/smart-wallet",
  base: "https://www.base.org/",
  uncx: "https://beta.uncx.network/lockers/univ3/chain/8453/address/0x6fd34677ecdfae4cae732a5b22f1a3082917eb15/lock/0x231278edd38b00b07fbd52120cef685b9baebcc1109",
  howToBuyDesktop: "https://x.com/ponchobase/status/1798515651168100408",
  howToBuyMobile: "https://x.com/ponchobase/status/1812141128679854101",
  forThePeople: "https://medium.com/@ponchobase/poncho-for-the-people-f766690a4a19",
  scams: "https://www.investopedia.com/articles/forex/042315/beware-these-five-bitcoin-scams.asp",
  memeTemplates: "https://imgflip.com/memetemplates",
} as const;

// Set `url` once Poncho Bear Hunt is deployed; until then the section shows "Coming Soon".
export const bearHunt: { url: string | null } = {
  url: null,
};

export const nav = [
  { href: "/#about", label: "About" },
  { href: "/#nfts", label: "NFTs" },
  { href: "/#tokenomics", label: "Tokenomics" },
  { href: "/#roadmap", label: "Roadmap" },
  { href: "/#faq", label: "FAQ" },
] as const;

export type Phase = {
  title: string;
  status: "completed" | "progress";
  items: { label: string; done: boolean }[];
};

export const roadmap: Phase[] = [
  {
    title: "Phase 1",
    status: "completed",
    items: [
      { label: "Stealth Launch", done: true },
      { label: "Dex Info Updates", done: true },
      { label: "Strategic Marketing", done: true },
      { label: "1,000 Holders", done: true },
    ],
  },
  {
    title: "Phase 2",
    status: "completed",
    items: [
      { label: "CoinGecko and CMC", done: true },
      { label: "Base Partnerships", done: true },
      { label: "NFT Launch", done: true },
      { label: "5,000 Holders", done: true },
    ],
  },
  {
    title: "Phase 3",
    status: "progress",
    items: [
      { label: "Advanced Marketing", done: true },
      { label: "Poncho Gives Back", done: true },
      { label: "CEX Listings", done: false },
      { label: "10,000 Holders", done: true },
    ],
  },
];
