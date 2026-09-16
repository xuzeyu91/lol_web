const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const INDEX = path.join(__dirname, '..', 'index.html');
const orig = fs.readFileSync(INDEX, 'utf8');

(async () => {
  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
  });

  async function check(label, html) {
    fs.writeFileSync(INDEX, html, 'utf8');
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    const ext = [];
    page.on('request', r => {
      const u = r.url();
      if (!u.startsWith('http://127.0.0.1:5173') && !u.startsWith('blob:') && !u.startsWith('data:')) ext.push(u);
    });
    let ws = 0;
    page.on('websocket', s => { ws++; });
    await page.goto('http://127.0.0.1:5173/', { waitUntil: 'load', timeout: 60000 });
    await page.waitForTimeout(7000);
    const state = await page.evaluate(() => ({
      mode: document.documentElement.dataset.onlineMode || '(default)',
      connectDisabled: document.getElementById('onlineConnect')?.disabled,
      status: document.getElementById('onlineStatus')?.textContent,
      roomsText: document.getElementById('onlineRooms')?.textContent?.trim().slice(0, 40),
      module: document.documentElement.dataset.gameModule,
    }));
    console.log('\n### ' + label);
    console.log('  onlineMode     :', state.mode);
    console.log('  connectDisabled:', state.connectDisabled);
    console.log('  status         :', state.status);
    console.log('  rooms          :', state.roomsText);
    console.log('  module         :', state.module);
    console.log('  外部 HTTP 请求  :', ext.length, ext.length ? ext.slice(0, 3) : '');
    await page.close();
  }

  await check('A. apiOrigin = 原站联机服务（默认）', orig);
  await check('B. apiOrigin = ""（完全离线）',
    orig.replace(/"apiOrigin":"[^"]*"/, '"apiOrigin":""'));

  fs.writeFileSync(INDEX, orig, 'utf8'); // restore
  console.log('\nindex.html 已还原为默认配置');
  await browser.close();
})();
