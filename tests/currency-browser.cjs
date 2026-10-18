const { chromium } = require("playwright");
const assert = require("node:assert/strict");
const url = process.env.APP_URL || "http://127.0.0.1:3003/";
(async () => {
  const browser = await chromium.launch({channel:"chrome",headless:true});
  try {
    const page = await browser.newPage({viewport:{width:1400,height:900}});
    const errors=[]; page.on("pageerror",e=>errors.push(e.message));
    await page.addInitScript(()=>{
      localStorage.setItem("masak-storage-notice-read-v1","1");
      localStorage.setItem("masak-prep-progress-v2",JSON.stringify({version:2,completedLessons:["masak-gorevleri"],answered:{},weakTags:{},lastSession:"test",examHistory:[],lastLegislationCheck:"18 Temmuz 2026"}));
    });
    await page.goto(url);
    await page.locator(".academic-chapter").first().waitFor();
    const notice=page.getByRole("button",{name:"Okudum",exact:true});
    if(await notice.isVisible())await notice.click();
    assert.match(await page.locator(".topnav-meta").innerText(),/15 Ekim 2026/);
    await page.getByRole("button",{name:"Başka bir ders seç",exact:true}).click();
    await page.getByRole("button",{name:/Müşterinin Tanınması/}).click();
    const body=await page.locator(".study-lesson-card").innerText();
    assert.match(body,/370\.000 TL/); assert.match(body,/30\.000 TL/); assert.match(body,/SMS OTP/);
    await page.getByRole("button",{name:"İlerleme",exact:true}).click();
    assert.match(await page.locator(".progress-sources").innerText(),/İçerik kontrolü: 15 Ekim 2026/);
    assert.equal((await page.evaluate(()=>JSON.parse(localStorage.getItem("masak-prep-progress-v2")))).completedLessons[0],"masak-gorevleri");
    await page.getByRole("button",{name:"Deneme",exact:true}).click();
    await page.locator(".exam-card").first().getByRole("button",{name:"Denemeyi Başlat",exact:true}).click();
    assert.equal(await page.locator(".palette-button").count() || await page.locator(".question-palette button").count(),50);
    assert.match(await page.locator("body").innerText(),/45:00|44:5[0-9]/);
    for(const width of [320,390,768,1400]){
      await page.setViewportSize({width,height:900});
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);
    }
    await page.screenshot({path:"/private/tmp/uyum-currency-exam.png"});
    assert.deepEqual(errors,[]);
    console.log("Current thresholds, source date, stored progress, timed 50-question exam and responsive widths passed");
  } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
