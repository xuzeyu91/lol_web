const { chromium } = require('playwright');

const OUT = 'compare';

async function captureStates(page, name) {
  const states = [];
  await page.waitForTimeout(7000);
  // 1. default lobby (online mode shown by default)
  await page.screenshot({ path: `${OUT}/${name}-01-online.png` });
  states.push('online');

  // 2. switch to local mode
  await page.click('#lobbyModeLocal').catch(() => {});
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${OUT}/${name}-02-local-lobby.png` });
  states.push('local-lobby');

  // 3. help dialog
  await page.click('#help').catch(() => {});
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `${OUT}/${name}-03-help.png` });
  states.push('help');
  await page.evaluate(() => document.querySelector('#helpDialog [data-close]')?.click());
  await page.waitForTimeout(800);

  // 4. start a game
  await page.click('#start').catch(() => {});

  // wait until lobby hides or we time out
  for (let i = 0; i < 24; i++) {
    await page.waitForTimeout(2500);
    const hidden = await page.evaluate(() => getComputedStyle(document.getElementById('lobby')).display === 'none');
    if (hidden) break;
  }
  await page.waitForTimeout(5000);
  await page.screenshot({ path: `${OUT}/${name}-04-game.png` });
  states.push('game');

  // 5. augment dialog (random — may not match between sites, only visual fidelity tested)
  const augOpen = await page.evaluate(() => document.getElementById('augmentDialog').open);
  if (augOpen) {
    await page.screenshot({ path: `${OUT}/${name}-05-augment.png` });
    states.push('augment');
    // dismiss by picking middle option
    await page.evaluate(() => {
      const btns = document.querySelectorAll('#augmentDialog button');
      if (btns[1]) btns[1].click();
    });
    await page.waitForTimeout(2500);
  } else {
    states.push('augment-skipped');
  }

  // 6. shop dialog (open with P key)
  await page.keyboard.press('KeyP');
  await page.waitForTimeout(1500);
  const shopOpen = await page.evaluate(() => document.getElementById('shopDialog').open);
  if (shopOpen) {
    await page.screenshot({ path: `${OUT}/${name}-06-shop.png` });
    states.push('shop');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(800);
  } else {
    states.push('shop-blocked');
  }

  // 7. pause dialog
  await page.keyboard.press('Escape');
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${OUT}/${name}-07-pause.png` });
  states.push('pause');
  await page.click('#resume').catch(() => {});
  await page.waitForTimeout(800);

  return states;
}

async function mobileCapture(page, name) {
  await page.setViewportSize({ width: 480, height: 900 });
  await page.reload({ waitUntil: 'load' });
  await page.waitForTimeout(7000);
  await page.click('#lobbyModeLocal').catch(() => {});
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${OUT}/${name}-08-mobile.png` });
}

(async () => {
  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
  });

  console.log('--- LOCAL ---');
  const ctxL = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const pageL = await ctxL.newPage();
  await pageL.goto('http://127.0.0.1:5173/', { waitUntil: 'load', timeout: 60000 });
  const localStates = await captureStates(pageL, 'local');
  await mobileCapture(pageL, 'local');
  await ctxL.close();

  console.log('local states:', localStates);

  console.log('--- ORIGINAL ---');
  const ctxR = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const pageR = await ctxR.newPage();
  await pageR.goto('https://lol.hanyue.io/', { waitUntil: 'load', timeout: 90000 });
  const origStates = await captureStates(pageR, 'original');
  await mobileCapture(pageR, 'original');
  await ctxR.close();

  console.log('original states:', origStates);
  await browser.close();
  console.log('done');
})();