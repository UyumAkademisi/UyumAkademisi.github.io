const { chromium } = require("playwright");
const assert = require("node:assert/strict");

(async () => {
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.goto("http://127.0.0.1:3003/");
    await page.getByRole("button", { name: "Okudum", exact: true }).click();
    for (const [title, text] of [
      ["Müşterinin Tanınması", "Salt ekonomik pay hesabını göstermek"],
      ["Şüpheli İşlem Bildirimi", "Genel bildirim süresini öğrenirken üç unsur"],
      ["Uyum", "Uyum programı, birbirinden bağımsız belgelerin"],
    ]) {
      await page.getByRole("button", { name: "Başka bir ders seç", exact: true }).click();
      await page.locator(".lesson-picker-row").filter({ hasText: title }).first().click();
      const paragraph = page.locator(".academic-chapter p").filter({ hasText: text });
      await paragraph.scrollIntoViewIfNeeded();
      assert.ok(await paragraph.isVisible(), title);
      for (const width of [320, 390, 1400]) {
        await page.setViewportSize({ width, height: 900 });
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false, `${title}: ${width}`);
      }
    }
    await page.setViewportSize({ width: 390, height: 844 });
    await page.locator(".academic-chapter p").filter({ hasText: "Uyum programı, birbirinden bağımsız belgelerin" }).scrollIntoViewIfNeeded();
    await page.screenshot({ path: "/private/tmp/uyum-expanded-lessons-mobile.png" });
    assert.deepEqual(errors, []);
    console.log("Expanded KYC, ŞİB and compliance lessons render without mobile overflow or runtime errors");
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
