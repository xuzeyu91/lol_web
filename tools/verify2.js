const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
  });

  // ---- reference screenshot of the original site ----
  const ref = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await ref.goto('https://lol.hanyue.io/', { waitUntil: 'load', timeout: 90000 });
  await ref.waitForTimeout(7000);
  // switch to local mode on the reference
  await ref.click('#lobbyModeLocal').catch(() => {});
  await ref.waitForTimeout(2000);
  await ref.screenshot({ path: 'shot-original.png' });
  const refHud = await ref.evaluate(() => {
    const s = document.getElementById('score');
    const a = document.getElementById('augmentHud');
    const f = document.getElementById('hud');
    return {
      scoreRect: s?.getBoundingClientRect(),
      hudDisplay: getComputedStyle(s?.parentElement?.parentElement || document.body).display,
      hudChildren: f?.children.length,
      visibleStart: !!document.getElementById('start')?.offsetParent,
    };
  });
  console.log('REF', JSON.stringify(refHud, null, 2));
  await ref.close();

  // ---- local replica ----
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = [];
  const failed = [];
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));
  page.on('requestfailed', r => {
    const u = r.url();
    if (!u.startsWith('https://game-api')) failed.push(u + ' :: ' + (r.failure() && r.failure().errorText));
  });
  page.on('response', r => { if (r.status() >= 400 && !r.url().startsWith('https://game-api')) failed.push(r.status() + ' ' + r.url()); });

  await page.goto('http://127.0.0.1:5173/', { waitUntil: 'load', timeout: 60000 });
  await page.waitForTimeout(9000);

  // switch to single-player
  await page.click('#lobbyModeLocal').catch(e => console.log('mode click:', e.message));
  await page.waitForTimeout(1500);

  const ready = await page.evaluate(() => ({
    ready: !!globalThis.__ARAM_APP_READY__,
    module: document.documentElement.dataset.gameModule,
    base: document.querySelector('base').href,
    heroes: document.querySelectorAll('.hero-card').length,
    selected: document.getElementById('selectedName')?.textContent,
    visibleStart: !!document.getElementById('start')?.offsetParent,
    visibleArt: !!document.getElementById('selectedArt')?.offsetParent,
  }));
  console.log('STATE', JSON.stringify(ready, null, 2));
  await page.screenshot({ path: 'shot-lobby-local.png' });

  await page.click('#start').catch(e => console.log('start click:', e.message));
  await page.waitForTimeout(12000);

  const inGame = await page.evaluate(() => ({
    lobbyDisplay: getComputedStyle(document.getElementById('lobby')).display,
    hudChildren: document.getElementById('hud').children.length,
    timer: document.getElementById('timer')?.textContent,
    score: [document.getElementById('blueScore')?.textContent, document.getElementById('redScore')?.textContent],
    augmentHudDisplay: getComputedStyle(document.getElementById('augmentHud')).display,
    minimapW: document.getElementById('minimap')?.width,
    canvasW: document.getElementById('arena')?.width,
    modelStatus: document.getElementById('modelStatus')?.textContent,
    canvasNonEmpty: (() => {
      const c = document.getElementById('arena');
      if (!c) return false;
      const ctx = c.getContext('webgl2') || c.getContext('webgl');
      return !!ctx;
    })(),
  }));
  console.log('INGAME', JSON.stringify(inGame, null, 2));
  await page.screenshot({ path: 'shot-game-local.png' });

  console.log('\nCONSOLE ERRORS (' + errors.length + '):');
  errors.slice(0, 25).forEach(e => console.log('  - ' + e.slice(0, 220)));
  console.log('\nFAILED REQUESTS (' + failed.length + '):');
  [...new Set(failed)].slice(0, 30).forEach(e => console.log('  - ' + e.slice(0, 200)));

  await browser.close();
})();