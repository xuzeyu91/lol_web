const { chromium } = require('playwright');
const PORT = process.env.PORT || '5173';

const HEROES = ['Ashe', 'Lux', 'Ahri', 'Ezreal', 'Garen', 'Jinx', 'Yasuo', 'Sett',
  'Darius', 'Ryze', 'DrMundo', 'Malphite', 'MissFortune', 'ElderDragon',
  'RiftHerald', 'BaronNashor'];

(async () => {
  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
  });

  const allBad = new Map(); // url -> set of heroes

  for (const hero of HEROES) {
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    page.on('response', r => {
      if (r.status() >= 400) {
        const u = r.url().replace(`http://127.0.0.1:${PORT}/static/r20260915-miss-fortune-1/`, '');
        if (!allBad.has(u)) allBad.set(u, new Set());
        allBad.get(u).add(hero);
      }
    });
    page.on('requestfailed', r => {
      const u = r.url().replace(`http://127.0.0.1:${PORT}/static/r20260915-miss-fortune-1/`, '');
      if (!allBad.has(u)) allBad.set(u, new Set());
      allBad.get(u).add(hero);
    });

    try {
      await page.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'load', timeout: 60000 });
      await page.waitForTimeout(7000);
      await page.click('#lobbyModeLocal').catch(() => {});
      await page.waitForTimeout(800);
      // select the hero
      await page.evaluate(h => {
        const card = document.querySelector(`.hero-card[data-hero="${h}"]`);
        if (card) card.click();
      }, hero);
      await page.waitForTimeout(2000);
      // cast all four abilities + summoners to pull in VFX/audio
      await page.click('#start').catch(() => {});
      for (let i = 0; i < 14; i++) {
        await page.waitForTimeout(2000);
        if (await page.evaluate(() => getComputedStyle(document.getElementById('lobby')).display === 'none')) break;
      }
      await page.waitForTimeout(4000);
      for (const k of ['KeyQ', 'KeyW', 'KeyE', 'KeyR', 'KeyD', 'KeyF']) {
        await page.keyboard.press(k).catch(() => {});
        await page.waitForTimeout(900);
      }
      await page.mouse.click(640, 380, { button: 'right' }).catch(() => {});
      await page.waitForTimeout(2500);
      console.log('  done', hero);
    } catch (e) {
      console.log('  ERR', hero, e.message.slice(0, 80));
    }
    await page.close();
  }

  console.log('\n=== 失败资源汇总 (' + allBad.size + ') ===');
  [...allBad.entries()].forEach(([u, heroes]) => {
    console.log('  ' + u + '   [' + [...heroes].join(',') + ']');
  });
  await browser.close();
})();
