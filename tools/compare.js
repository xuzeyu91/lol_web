const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
  });

  async function run(url, outDir, name, mode) {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
    const page = await ctx.newPage();
    await page.goto(url, { waitUntil: 'load', timeout: 60000 });
    await page.waitForTimeout(7000);
    await page.click('#lobbyModeLocal').catch(() => {});
    await page.waitForTimeout(1200);
    await page.click('#start').catch(() => {});
    // poll until the augment dialog is up
    for (let i = 0; i < 30; i++) {
      await page.waitForTimeout(2500);
      const visible = await page.evaluate(() => {
        const d = document.getElementById('augmentDialog');
        return d ? d.open : false;
      });
      if (visible) break;
    }
    await page.waitForTimeout(3500);
    await page.screenshot({ path: `${outDir}/${name}-lobby.png` });
    if (mode === 'game') {
      await page.screenshot({ path: `${outDir}/${name}-augment.png` });
      // pick the second augment to advance
      await page.evaluate(() => {
        const btns = document.querySelectorAll('#augmentDialog button');
        if (btns[1]) btns[1].click();
      }).catch(() => {});
      await page.waitForTimeout(3500);
      await page.screenshot({ path: `${outDir}/${name}-combat.png` });
    }
    await ctx.close();
  }

  await run('http://127.0.0.1:5173/', 'compare', 'local', 'game');
  await run('https://lol.hanyue.io/', 'compare', 'original', 'game');
  await browser.close();
  console.log('done');
})();