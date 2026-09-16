const { chromium } = require('playwright');
const PORT = process.env.PORT || '5173';

(async () => {
  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
  });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const bad = [];
  page.on('response', r => { if (r.status() >= 400) bad.push(r.status() + ' ' + r.url()); });

  await page.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'load', timeout: 60000 });
  await page.waitForTimeout(7000);
  const lobby = await page.evaluate(() => ({
    module: document.documentElement.dataset.gameModule,
    base: document.querySelector('base')?.href,
    heroes: document.querySelectorAll('.hero-card').length,
    artOk: (() => { const i = document.getElementById('selectedArt'); return i && i.naturalWidth > 0; })(),
  }));
  console.log('大厅:', JSON.stringify(lobby));
  await page.screenshot({ path: 'final-01-lobby.png' });

  await page.click('#lobbyModeLocal').catch(() => {});
  await page.waitForTimeout(1500);
  await page.screenshot({ path: 'final-02-hero.png' });

  await page.click('#start').catch(() => {});
  for (let i = 0; i < 20; i++) {
    await page.waitForTimeout(2500);
    if (await page.evaluate(() => getComputedStyle(document.getElementById('lobby')).display === 'none')) break;
  }
  await page.waitForTimeout(5000);
  const game = await page.evaluate(() => ({
    lobbyHidden: getComputedStyle(document.getElementById('lobby')).display === 'none',
    hud: document.getElementById('hud').children.length,
    minimap: document.getElementById('minimap').width,
  }));
  console.log('对局:', JSON.stringify(game));
  await page.screenshot({ path: 'final-03-game.png' });

  console.log('404:', bad.length);
  await browser.close();
})();
