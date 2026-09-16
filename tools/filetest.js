const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
  });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const bad = [];
  page.on('response', r => { if (r.status() >= 400) bad.push(r.status() + ' ' + r.url().slice(0, 110)); });
  page.on('requestfailed', r => bad.push('FAIL ' + r.url().slice(0, 110) + ' :: ' + (r.failure() && r.failure().errorText)));
  page.on('console', m => { if (m.type() === 'error') bad.push('CONSOLE ' + m.text().slice(0, 110)); });

  await page.goto('file:///D:/AI/AIDotNet/weblol/index.html', { waitUntil: 'load', timeout: 60000 });
  await page.waitForTimeout(8000);
  const st = await page.evaluate(() => ({
    module: document.documentElement.dataset.gameModule,
    heroes: document.querySelectorAll('.hero-card').length,
  }));
  console.log('file:// 结果:', JSON.stringify(st));
  console.log('失败 (' + bad.length + '):');
  [...new Set(bad)].slice(0, 15).forEach(b => console.log('  ' + b));
  await browser.close();
})();
