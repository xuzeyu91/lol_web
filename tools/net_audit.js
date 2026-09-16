const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
  });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  const byHost = new Map();
  const external = [];

  page.on('request', r => {
    try {
      const u = new URL(r.url());
      const host = u.host;
      byHost.set(host, (byHost.get(host) || 0) + 1);
      if (host !== '127.0.0.1:5173' && !u.protocol.startsWith('data') && !u.protocol.startsWith('blob')) {
        external.push(r.resourceType() + '  ' + r.url().slice(0, 140));
      }
    } catch (e) { /* blob:/data: */ }
  });

  await page.goto('http://127.0.0.1:5173/', { waitUntil: 'load', timeout: 60000 });
  await page.waitForTimeout(6000);

  // exercise: local mode -> help -> start game -> augment -> a bit of combat
  await page.click('#lobbyModeLocal').catch(() => {});
  await page.waitForTimeout(1200);
  await page.click('#help').catch(() => {});
  await page.waitForTimeout(800);
  await page.evaluate(() => document.querySelector('#helpDialog [data-close]')?.click());
  await page.waitForTimeout(500);
  await page.click('#start').catch(() => {});

  for (let i = 0; i < 20; i++) {
    await page.waitForTimeout(2500);
    const hidden = await page.evaluate(() => getComputedStyle(document.getElementById('lobby')).display === 'none');
    if (hidden) break;
  }
  await page.waitForTimeout(6000);

  // play a little: move + cast so VFX/audio get requested
  await page.mouse.click(720, 400, { button: 'right' }).catch(() => {});
  await page.keyboard.press('KeyQ').catch(() => {});
  await page.waitForTimeout(1500);
  await page.keyboard.press('KeyW').catch(() => {});
  await page.waitForTimeout(1500);
  await page.keyboard.press('KeyE').catch(() => {});
  await page.waitForTimeout(1500);
  await page.keyboard.press('KeyR').catch(() => {});
  await page.waitForTimeout(4000);

  console.log('\n=== 按 host 统计的请求数 ===');
  [...byHost.entries()].sort((a, b) => b[1] - a[1]).forEach(([h, n]) => console.log(String(n).padStart(6), h));

  console.log('\n=== 非本地请求 (' + external.length + ') ===');
  [...new Set(external)].forEach(e => console.log('  ' + e));

  await browser.close();
})();
