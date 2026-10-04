import { expect, test } from "@playwright/test";

// Live market data comes from DEX Screener; tests must not depend on it.
test.beforeEach(async ({ page }) => {
  await page.route("https://api.dexscreener.com/**", (route) =>
    route.fulfill({
      json: {
        pair: {
          chainId: "base",
          baseToken: { address: "0xC2fE011C3885277c7F0e7ffd45Ff90cADc8ECD12", symbol: "PONCHO" },
          priceUsd: "0.01234",
          priceChange: { h24: 5.5 },
          marketCap: 1_234_567,
          volume: { h24: 45_678 },
          txns: { h24: { buys: 300, sells: 200 } },
        },
      },
    }),
  );
  await page.route(/googletagmanager|google-analytics/, (route) => route.abort());
  // Consent is covered by its own tests; elsewhere start with a stored choice so the banner stays out of the way.
  if (!test.info().title.startsWith("consent")) {
    await page.addInitScript(() => localStorage.setItem("poncho-consent-v1", "denied"));
  }
});

test.describe("cookie consent", () => {
  test("consent: analytics only loads after accepting", async ({ page }) => {
    const gaRequests: string[] = [];
    page.on("request", (req) => req.url().includes("googletagmanager") && gaRequests.push(req.url()));

    await page.goto("/");
    const banner = page.locator("[data-consent]");
    await expect(banner).toBeVisible();
    await page.waitForTimeout(500);
    expect(gaRequests).toEqual([]);

    await banner.getByRole("button", { name: "Accept" }).click();
    await expect(banner).toBeHidden();
    await expect.poll(() => gaRequests.length).toBeGreaterThan(0);

    await page.reload();
    await expect(banner).toBeHidden();
  });

  test("consent: declining keeps analytics off and can be changed later", async ({ page }) => {
    const gaRequests: string[] = [];
    page.on("request", (req) => req.url().includes("googletagmanager") && gaRequests.push(req.url()));

    await page.goto("/");
    await page.locator("[data-consent]").getByRole("button", { name: "Decline" }).click();
    await page.reload();
    await expect(page.locator("[data-consent]")).toBeHidden();
    expect(gaRequests).toEqual([]);

    await page.getByRole("button", { name: "Cookie settings" }).click();
    await expect(page.locator("[data-consent]")).toBeVisible();
  });
});

test.describe("landing page", () => {
  test("renders all sections without errors or horizontal overflow", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto("/");

    await expect(page.getByRole("heading", { level: 1, name: "$PONCHO" })).toBeVisible();
    for (const id of ["about", "nfts", "tokenomics", "roadmap", "bear-hunt", "faq"]) {
      await expect(page.locator(`#${id}`)).toBeAttached();
    }
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(0);
    expect(errors).toEqual([]);
  });

  test("shows live token data", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("[data-price-text]")).toHaveText("$0.01234 (5.50%)");
    await expect(page.locator("[data-price]")).toHaveAttribute("data-trend", "up");
    await page.locator('[data-live="marketCap"]').scrollIntoViewIfNeeded();
    await expect(page.locator('[data-live="marketCap"]')).toHaveText("$1.2M", { timeout: 5000 });
    await expect(page).toHaveTitle(/\$PONCHO: \$0\.01234/);
  });

  test("copies the contract address", async ({ page, context, browserName }) => {
    test.skip(browserName !== "chromium");
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.goto("/");
    await page.locator("[data-copy]").click();
    await expect(page.locator("[data-copy]")).toHaveAttribute("data-tooltip", "Copied!");
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe("0xC2fE011C3885277c7F0e7ffd45Ff90cADc8ECD12");
  });

  test("opens and closes the buy dialog via button and URL", async ({ page }) => {
    await page.route("https://app.uniswap.org/**", (route) => route.fulfill({ body: "<html></html>", contentType: "text/html" }));
    await page.goto("/");
    await page.getByRole("button", { name: "Buy $PONCHO" }).click();
    const dialog = page.locator("#buy-dialog");
    await expect(dialog).toBeVisible();
    await expect(page).toHaveURL(/\?modal=buy/);
    await expect(dialog.locator("iframe")).toHaveAttribute("src", /app\.uniswap\.org/);
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(page).not.toHaveURL(/modal=/);

    await page.goto("/?modal=buy");
    await expect(dialog).toBeVisible();
  });

  test("legacy ?modal=memes links redirect to the memes page", async ({ page }) => {
    await page.goto("/?modal=memes");
    await expect(page).toHaveURL(/\/memes\/?$/);
  });

  test("FAQ show all / hide all toggles every answer", async ({ page }) => {
    await page.goto("/");
    const details = page.locator("#faq details");
    await page.getByRole("button", { name: "Show All" }).click();
    await expect(details.locator("[open]")).toHaveCount(0);
    expect(await details.evaluateAll((els) => els.every((el) => (el as HTMLDetailsElement).open))).toBe(true);
    await page.getByRole("button", { name: "Hide All" }).click();
    expect(await details.evaluateAll((els) => els.every((el) => !(el as HTMLDetailsElement).open))).toBe(true);
  });

  test("carousel buttons scroll the roadmap", async ({ page }) => {
    await page.setViewportSize({ width: 400, height: 900 });
    await page.goto("/#roadmap");
    const track = page.locator("#roadmap .carousel__track");
    const next = page.locator("#roadmap .carousel__nav").last();
    const before = await track.evaluate((el) => el.scrollLeft);
    await next.click();
    await expect.poll(() => track.evaluate((el) => el.scrollLeft)).toBeGreaterThan(before);
  });
});

test.describe("meme generator", () => {
  test("loads a template and manages layers", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto("/memes/");
    const layers = page.locator("[data-layers] li");
    await expect(layers).toHaveCount(2);

    await page.getByText("Select Template").click();
    await page.locator('[data-template="Drake_Hotline_Bling"]').click();
    await expect(layers).toHaveCount(3);
    await expect(layers.nth(1)).toContainText("Poncho Hate");

    await page.getByRole("button", { name: "Add text" }).click();
    await page.getByRole("button", { name: "Add shape" }).click();
    await expect(layers).toHaveCount(5);

    await page.getByText("Select Assets").click();
    await page.locator('[data-asset-gallery] [title="Fur B & W"]').click();
    await expect(layers).toHaveCount(6);

    await layers.nth(1).getByRole("button", { name: "Delete layer" }).click();
    await expect(layers).toHaveCount(5);

    const download = page.waitForEvent("download");
    await page.getByRole("button", { name: "Download" }).click();
    expect((await download).suggestedFilename()).toBe("poncho_meme.png");
    expect(errors).toEqual([]);
  });
});
