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
  page.on('response', r => {
    if (r.status() >= 400 && !r.url().startsWith('https://game-api')) failed.push(r.status() + ' ' + r.url());
  });

  // capture the real error object from the game's own failure handler
  await page.addInitScript(() => {
    window.__battleErrors = [];
    const origError = console.error;
    console.error = function (...a) {
      window.__battleErrors.push(a.map(x => {
        if (x instanceof Error) return x.name + ': ' + x.message + '\n' + (x.stack || '');
        try { return JSON.stringify(x); } catch { return String(x); }
      }).join(' '));
      return origError.apply(this, a);
    };
  });

  await page.goto('http://127.0.0.1:5173/', { waitUntil: 'load', timeout: 60000 });
  await page.waitForTimeout(8000);
  await page.click('#lobbyModeLocal').catch(e => console.log('mode click:', e.message));
  await page.waitForTimeout(1200);
  await page.screenshot({ path: 'shot-lobby-local.png' });

  await page.click('#start').catch(e => console.log('start click:', e.message));

  // poll until the lobby hides or we time out
  let ok = false;
  for (let i = 0; i < 24; i++) {
    await page.waitForTimeout(2500);
    const st = await page.evaluate(() => ({
      lobby: getComputedStyle(document.getElementById('lobby')).display,
      status: document.getElementById('modelStatus')?.textContent || '',
      timer: document.getElementById('timer')?.textContent || '',
      hud: document.getElementById('hud')?.children.length || 0,
    }));
    console.log('  poll', i, JSON.stringify(st));
    if (st.lobby === 'none') { ok = true; break; }
    if (/失败|错误|不可用/.test(st.status)) break;
  }
  console.log('LOBBY HIDDEN:', ok);

  await page.waitForTimeout(6000);
  const inGame = await page.evaluate(() => ({
    lobbyDisplay: getComputedStyle(document.getElementById('lobby')).display,
    hudChildren: document.getElementById('hud').children.length,
    timer: document.getElementById('timer')?.textContent,
    score: [document.getElementById('blueScore')?.textContent, document.getElementById('redScore')?.textContent],
    modelStatus: document.getElementById('modelStatus')?.textContent,
    battleErrors: (window.__battleErrors || []).slice(-4),
  }));
  console.log('INGAME', JSON.stringify(inGame, null, 2));
  await page.screenshot({ path: 'shot-game-local.png' });

  console.log('\nFAILED REQUESTS (' + failed.length + '):');
  [...new Set(failed)].slice(0, 30).forEach(e => console.log('  - ' + e.slice(0, 190)));
  console.log('\nCONSOLE ERRORS:');
  [...new Set(errors)].slice(0, 20).forEach(e => console.log('  - ' + e.slice(0, 300)));

  await browser.close();
})();