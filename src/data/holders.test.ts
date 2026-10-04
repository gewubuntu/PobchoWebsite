import { beforeEach, describe, expect, it, vi } from "vitest";
import { token } from "./site";

type Responses = Partial<Record<"etherscan" | "blockscout", unknown>>;

function mockApis(responses: Responses) {
  const fetchMock = vi.fn(async (url: string) => {
    const key = (Object.keys(responses) as (keyof Responses)[]).find((k) => url.includes(k));
    if (!key) throw new TypeError("fetch failed");
    return new Response(JSON.stringify(responses[key]), { status: 200 });
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

// getHolders() caches per module instance, so every test loads a fresh copy.
async function getHolders() {
  vi.resetModules();
  const mod = await import("./holders");
  return mod.getHolders();
}

beforeEach(() => {
  vi.spyOn(console, "info").mockImplementation(() => undefined);
  vi.spyOn(console, "warn").mockImplementation(() => undefined);
  vi.stubEnv("BASESCAN_API_KEY", "");
});

describe("getHolders", () => {
  it("uses Basescan when an API key is set", async () => {
    vi.stubEnv("BASESCAN_API_KEY", "key");
    const fetchMock = mockApis({ etherscan: { status: "1", message: "OK", result: "101234" } });
    expect(await getHolders()).toEqual({ value: 101_234, source: "basescan" });
    expect(String(fetchMock.mock.calls[0]?.[0])).toContain("chainid=8453");
  });

  it("falls back to Blockscout when Basescan requires API PRO", async () => {
    vi.stubEnv("BASESCAN_API_KEY", "key");
    mockApis({
      etherscan: {
        status: "0",
        message: "NOTOK",
        result: "Sorry, it looks like you are trying to access an API Pro endpoint.",
      },
      blockscout: { holders_count: "99876" },
    });
    expect(await getHolders()).toEqual({ value: 99_876, source: "blockscout" });
  });

  it("skips Basescan without a key and reads the legacy Blockscout field", async () => {
    const fetchMock = mockApis({ blockscout: { holders: "98765" } });
    expect(await getHolders()).toEqual({ value: 98_765, source: "blockscout" });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("rejects implausibly low counts", async () => {
    mockApis({ blockscout: { holders_count: "120" } });
    expect(await getHolders()).toEqual({ value: token.holders.value, source: "fallback" });
  });

  it("uses the stored fallback when every source fails", async () => {
    mockApis({});
    expect(await getHolders()).toEqual({ value: token.holders.value, source: "fallback" });
  });

  it("emits a GitHub Actions warning when the fallback is used in CI", async () => {
    vi.stubEnv("GITHUB_ACTIONS", "true");
    const log = vi.spyOn(console, "log").mockImplementation(() => undefined);
    mockApis({});
    await getHolders();
    expect(log).toHaveBeenCalledWith(expect.stringContaining("::warning title=Holder count not updated::"));
  });

  it("only fetches once per build", async () => {
    vi.resetModules();
    const fetchMock = mockApis({ blockscout: { holders_count: "99000" } });
    const mod = await import("./holders");
    await Promise.all([mod.getHolders(), mod.getHolders()]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
