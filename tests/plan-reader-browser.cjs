const { chromium, webkit } = require("playwright");
const assert = require("node:assert/strict");

(async () => {
  const engine = process.env.TEST_WEBKIT ? webkit : chromium;
  const browser = await engine.launch(process.env.TEST_WEBKIT ? { headless: true } : { channel: "chrome", headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
    const errors = [];
    const requests = [];
    page.on("pageerror", error => errors.push(error.message));
    page.on("request", request => requests.push(request.url()));
    await page.goto("http://127.0.0.1:3003/");
    await page.getByRole("button", { name: "Okudum", exact: true }).click();
    assert.equal(requests.some(url => url.endsWith("masak-rehber-temmuz-2026.pdf")), false);
    await page.getByRole("button", { name: "Ders planı", exact: true }).click();
    assert.equal(await page.locator(".plan-day").count(), 35);
    assert.equal(await page.locator(".plan-week").count(), 5);
    await page.locator(".plan-day").first().getByRole("checkbox").check();
    await page.reload();
    await page.getByRole("button", { name: "Ders planı", exact: true }).click();
    await page.waitForFunction(() => document.querySelector(".plan-day input")?.checked);
    assert.ok(await page.locator(".plan-day").first().getByRole("checkbox").isChecked());
    await page.getByRole("region", { name: "Sıradaki oturum" }).getByRole("button", { name: "Dersi aç", exact: true }).click();
    await page.getByRole("heading", { name: "Uluslararası Standartlar ve Kuruluşlar", exact: true }).waitFor();
    await page.getByRole("button", { name: "Bu konuyu ana kaynakta oku", exact: true }).click();
    await page.waitForFunction(() => {
      const c = document.querySelector(".pdf-surface canvas");
      return c && !c.hidden && c.width > 100 && document.querySelector(".pdf-surface").getAttribute("aria-busy") === "false";
    }, null, { timeout: 60000 });
    assert.equal(await page.getByRole("spinbutton", { name: "PDF sayfası" }).inputValue(), "23");
    const ink = await page.locator(".pdf-surface canvas").evaluate(c => {
      const data = c.getContext("2d").getImageData(0, 0, c.width, c.height).data;
      let count = 0;
      for (let i = 0; i < data.length; i += 16) if (data[i + 3] && data[i] < 190 && data[i + 1] < 190 && data[i + 2] < 190) count++;
      return count;
    });
    assert.ok(ink > 200, `PDF canvas is blank: ${ink}`);
    await page.getByRole("button", { name: "Sonraki sayfa", exact: true }).click();
    assert.equal(await page.getByRole("spinbutton", { name: "PDF sayfası" }).inputValue(), "24");
    await page.getByRole("button", { name: "Derse dön", exact: true }).click();
    await page.getByRole("button", { name: "Ana kaynak PDF", exact: true }).click();
    await page.waitForFunction(() => document.querySelector('.pdf-toolbar input')?.value === "24");
    await page.getByRole("combobox", { name: "PDF konusu" }).selectOption("181");
    await page.waitForFunction(() => document.querySelector('.pdf-toolbar input')?.value === "181");
    for (const width of [320, 390, 768, 1400]) {
      await page.setViewportSize({ width, height: 900 });
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false, `PDF overflow: ${width}`);
    }
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForFunction(() => document.querySelector(".pdf-surface").getAttribute("aria-busy") === "false");
    await page.screenshot({ path: `/private/tmp/uyum-pdf-${process.env.TEST_WEBKIT ? "webkit" : "chrome"}.png` });
    await page.getByRole("button", { name: "Koyu moda geç", exact: true }).click();
    assert.equal(await page.evaluate(() => document.documentElement.dataset.theme), "dark");
    await page.waitForFunction(() => {
      const style = getComputedStyle(document.querySelector(".app-shell"));
      return style.backgroundColor === "rgb(15, 18, 22)" && style.color === "rgb(243, 246, 248)";
    });
    await page.screenshot({ path: `/private/tmp/uyum-pdf-dark-${process.env.TEST_WEBKIT ? "webkit" : "chrome"}.png` });
    if (!process.env.TEST_WEBKIT) {
      await page.evaluate(() => navigator.serviceWorker.ready);
      await page.context().setOffline(true);
      await page.reload();
      await page.getByRole("button", { name: "Ana kaynak PDF", exact: true }).click();
      await page.waitForFunction(() => {
        const canvas = document.querySelector(".pdf-surface canvas");
        return canvas && !canvas.hidden && canvas.width > 100 && document.querySelector(".pdf-surface").getAttribute("aria-busy") === "false";
      }, null, { timeout: 30000 });
      assert.equal(await page.getByRole("spinbutton", { name: "PDF sayfası" }).inputValue(), "181");
      await page.context().setOffline(false);
    }
    await page.getByRole("button", { name: "Ders planı", exact: true }).click();
    for (const width of [320, 390, 1400]) {
      await page.setViewportSize({ width, height: 900 });
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false, `Plan overflow: ${width}`);
    }
    await page.screenshot({ path: "/private/tmp/uyum-plan-desktop.png" });
    await page.getByRole("button", { name: "İlerleme", exact: true }).click();
    page.once("dialog", dialog => dialog.accept());
    await page.getByRole("button", { name: "İlerlemeyi sıfırla", exact: true }).click();
    assert.equal(await page.evaluate(() => localStorage.getItem("uyum-study-plan-v1")), null);
    assert.equal(await page.evaluate(() => localStorage.getItem("uyum-guide-page-v1")), null);
    await page.getByRole("button", { name: "Çalış", exact: true }).click();
    await page.getByRole("button", { name: "Ders planı", exact: true }).click();
    await page.locator(".plan-day").nth(13).getByRole("button", { name: "Denemeyi başlat", exact: true }).click();
    await page.getByText(/Kalan süre: (45:00|44:59)/).waitFor();
    assert.deepEqual(errors, []);
    const fallbackContext = await browser.newContext({ serviceWorkers: "block" });
    try {
      const fallbackPage = await fallbackContext.newPage();
      await fallbackPage.route(/\/assets\/PdfReader-[^/]+\.js$/, route => route.abort());
      await fallbackPage.goto("http://127.0.0.1:3003/");
      await fallbackPage.getByRole("button", { name: "Okudum", exact: true }).click();
      await fallbackPage.getByRole("button", { name: "Ana kaynak PDF", exact: true }).click();
      await fallbackPage.getByText("Gelişmiş okuyucu yüklenemedi. PDF tarayıcı görünümünde açılıyor.", { exact: true }).waitFor();
      assert.ok(await fallbackPage.getByRole("link", { name: "PDF’yi doğrudan aç", exact: true }).isVisible());
      assert.ok(await fallbackPage.locator("iframe.pdf-native").isVisible());
    } finally { await fallbackContext.close(); }
    console.log("Plan persistence, lesson links, PDF rendering, saved page, responsive layout and reset passed");
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
