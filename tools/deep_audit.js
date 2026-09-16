const { chromium } = require('playwright');

const HEROES = ['Ashe', 'Lux', 'Ahri', 'Ezreal', 'Garen', 'Jinx', 'Yasuo', 'Sett',
  'Darius', 'Ryze', 'DrMundo', 'Malphite', 'MissFortune', 'ElderDragon',
  'RiftHerald', 'BaronNashor'];

(async () => {
  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
  });
  const allBad = new Map();

  for (const hero of HEROES) {
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    page.on('response', r => {
      if (r.status() >= 400) {
        const u = r.url().replace('http://127.0.0.1:5173/static/r20260915-miss-fortune-1/', '');
        if (!allBad.has(u)) allBad.set(u, new Set());
        allBad.get(u).add(hero);
      }
    });
    page.on('requestfailed', r => {
      const u = r.url().replace('http://127.0.0.1:5173/static/r20260915-miss-fortune-1/', '');
      if (u.includes('localhost') || u.includes('127.0.0.1')) return;
      if (!allBad.has(u)) allBad.set(u, new Set());
      allBad.get(u).add(hero);
    });

    try {
      await page.goto('http://127.0.0.1:5173/', { waitUntil: 'load', timeout: 60000 });
      await page.waitForTimeout(7000);
      await page.click('#lobbyModeLocal').catch(() => {});
      await page.waitForTimeout(800);
      await page.evaluate(h => document.querySelector(`.hero-card[data-hero="${h}"]`)?.click(), hero);
      await page.waitForTimeout(1500);
      await page.click('#start').catch(() => {});
      for (let i = 0; i < 20; i++) {
        await page.waitForTimeout(2000);
        if (await page.evaluate(() => getComputedStyle(document.getElementById('lobby')).display === 'none')) break;
      }
      await page.waitForTimeout(4000);

      // Cast every ability + summoners + force right-click attacks
      for (const k of ['KeyQ', 'KeyW', 'KeyE', 'KeyR', 'KeyD', 'KeyF']) {
        await page.keyboard.press(k).catch(() => {});
        await page.waitForTimeout(700);
      }
      // shoot + click ground a lot to trigger every VFX
      await page.mouse.click(640, 380, { button: "right" });
      await page.keyboard.press('KeyA');
      await page.mouse.click(640, 380);
      await page.waitForTimeout(800);
      for (let k = 1; k <= 7; k++) {
        await page.keyboard.press('Digit' + k).catch(() => {});
        await page.waitForTimeout(150);
      }
      // Ctrl+6 mastery badge
      await page.keyboard.press('Control+6').catch(() => {});
      await page.waitForTimeout(500);
      // Tab scoreboard
      await page.keyboard.down('Tab');
      await page.waitForTimeout(700);
      await page.keyboard.up('Tab');
      await page.waitForTimeout(500);
      // G/V signal
      await page.keyboard.down('KeyG');
      await page.mouse.move(640, 400);
      await page.mouse.move(700, 420);
      await page.keyboard.up('KeyG');
      await page.waitForTimeout(700);

      console.log('  ok', hero);
    } catch (e) {
      console.log('  ERR', hero, e.message.slice(0, 100));
    }
    await page.close();
  }

  console.log('\n=== 失败资源 (' + allBad.size + ') ===');
  [...allBad.entries()].forEach(([u, heroes]) => {
    console.log('  ' + u + '   [' + [...heroes].join(',') + ']');
  });
  await browser.close();
})();