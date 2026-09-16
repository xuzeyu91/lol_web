const { chromium } = require('playwright');
const OUT = 'compare';

(async () => {
  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
  });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto('https://lol.hanyue.io/', { waitUntil: 'load', timeout: 90000 });
  await page.waitForTimeout(7000);
  await page.screenshot({ path: `${OUT}/original-01-online.png` });
  await page.click('#lobbyModeLocal').catch(() => {});
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${OUT}/original-02-local-lobby.png` });
  await page.click('#help').catch(() => {});
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `${OUT}/original-03-help.png` });
  await page.evaluate(() => document.querySelector('#helpDialog [data-close]')?.click());
  await page.waitForTimeout(800);
  await page.click('#start').catch(() => {});
  for (let i = 0; i < 24; i++) {
    await page.waitForTimeout(2500);
    const hidden = await page.evaluate(() => getComputedStyle(document.getElementById('lobby')).display === 'none');
    if (hidden) break;
  }
  await page.waitForTimeout(5000);
  await page.screenshot({ path: `${OUT}/original-04-game.png` });
  const augOpen = await page.evaluate(() => document.getElementById('augmentDialog').open);
  if (augOpen) {
    await page.screenshot({ path: `${OUT}/original-05-augment.png` });
    await page.evaluate(() => { const b = document.querySelectorAll('#augmentDialog button'); if (b[1]) b[1].click(); });
    await page.waitForTimeout(2500);
  }
  await page.keyboard.press('Escape');
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${OUT}/original-07-pause.png` });
  await page.setViewportSize({ width: 480, height: 900 });
  await page.reload({ waitUntil: 'load' });
  await page.waitForTimeout(7000);
  await page.click('#lobbyModeLocal').catch(() => {});
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${OUT}/original-08-mobile.png` });
  await ctx.close();
  await browser.close();
  console.log('original done');
})();