const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
  });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  const bad = [];
  page.on('response', r => {
    if (r.status() >= 400) bad.push(r.status() + ' ' + r.url());
  });
  page.on('requestfailed', r => bad.push('FAIL ' + r.url() + ' :: ' + (r.failure() && r.failure().errorText)));

  await page.goto('http://127.0.0.1:5173/', { waitUntil: 'load', timeout: 60000 });
  await page.waitForTimeout(8000);
  await page.click('#lobbyModeLocal').catch(() => {});
  await page.waitForTimeout(1500);
  await page.click('#start').catch(() => {});
  for (let i = 0; i < 20; i++) {
    await page.waitForTimeout(2500);
    if (await page.evaluate(() => getComputedStyle(document.getElementById('lobby')).display === 'none')) break;
  }
  await page.waitForTimeout(6000);

  console.log('=== 失败请求 (' + bad.length + ') ===');
  [...new Set(bad)].forEach(b => console.log('  ' + b));
  await browser.close();
})();
