const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
  });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  const errors = [];
  const failed = [];
  page.on('console', m => {
    if (m.type() === 'error') errors.push(m.text());
  });
  page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));
  page.on('requestfailed', r => {
    const u = r.url();
    if (!u.startsWith('https://game-api')) failed.push(u + ' :: ' + (r.failure() && r.failure().errorText));
  });
  page.on('response', r => {
    if (r.status() >= 400) failed.push(r.status() + ' ' + r.url());
  });

  await page.goto('http://127.0.0.1:5173/', { waitUntil: 'load', timeout: 60000 });
  await page.waitForTimeout(9000);

  const ready = await page.evaluate(() => ({
    ready: !!globalThis.__ARAM_APP_READY__,
    module: document.documentElement.dataset.gameModule,
    base: document.querySelector('base').href,
    heroes: document.querySelectorAll('.hero-card').length,
    selected: document.getElementById('selectedName')?.textContent,
    artSrc: document.getElementById('selectedArt')?.src,
    artOk: (() => { const i = document.getElementById('selectedArt'); return i ? i.naturalWidth : -1; })(),
    lobbyVisible: (() => { const l = document.getElementById('lobby'); return l ? getComputedStyle(l).display : 'none'; })(),
  }));
  console.log('STATE', JSON.stringify(ready, null, 2));

  await page.screenshot({ path: 'shot-lobby.png' });

  // try starting single player practice
  try {
    await page.click('#start', { timeout: 5000 });
    await page.waitForTimeout(12000);
    const inGame = await page.evaluate(() => ({
      lobbyDisplay: getComputedStyle(document.getElementById('lobby')).display,
      hudChildren: document.getElementById('hud').children.length,
      timer: document.getElementById('timer')?.textContent,
      modelStatus: document.getElementById('modelStatus')?.textContent,
    }));
    console.log('INGAME', JSON.stringify(inGame, null, 2));
    await page.screenshot({ path: 'shot-game.png' });
  } catch (e) {
    console.log('START CLICK FAILED:', e.message);
    await page.screenshot({ path: 'shot-game.png' });
  }

  console.log('\nCONSOLE ERRORS (' + errors.length + '):');
  errors.slice(0, 25).forEach(e => console.log('  - ' + e.slice(0, 220)));
  console.log('\nFAILED REQUESTS (' + failed.length + '):');
  [...new Set(failed)].slice(0, 30).forEach(e => console.log('  - ' + e.slice(0, 200)));

  await browser.close();
})();
