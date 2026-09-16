const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
  });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  const protos = new Map();
  const nonLocal = [];

  page.on('request', r => {
    const u = r.url();
    const proto = u.split(':')[0];
    protos.set(proto, (protos.get(proto) || 0) + 1);
    if (!u.startsWith('http://127.0.0.1:5173') && !u.startsWith('blob:') && !u.startsWith('data:')) {
      nonLocal.push(proto + '  ' + u.slice(0, 160));
    }
  });

  await page.goto('http://127.0.0.1:5173/', { waitUntil: 'load', timeout: 60000 });
  await page.waitForTimeout(6000);

  // --- 单人练习全流程 ---
  await page.click('#lobbyModeLocal').catch(() => {});
  await page.waitForTimeout(1200);
  await page.click('#start').catch(() => {});
  for (let i = 0; i < 20; i++) {
    await page.waitForTimeout(2500);
    if (await page.evaluate(() => getComputedStyle(document.getElementById('lobby')).display === 'none')) break;
  }
  await page.waitForTimeout(5000);
  for (const k of ['KeyQ', 'KeyW', 'KeyE', 'KeyR', 'KeyD', 'KeyF']) {
    await page.keyboard.press(k).catch(() => {});
    await page.waitForTimeout(1200);
  }
  await page.mouse.click(700, 400, { button: 'right' }).catch(() => {});
  await page.waitForTimeout(3000);

  console.log('\n=== 请求按协议分类 ===');
  [...protos.entries()].sort((a, b) => b[1] - a[1]).forEach(([p, n]) => console.log(String(n).padStart(6), p));

  console.log('\n=== 非本地 / 非 blob / 非 data 的请求 (' + nonLocal.length + ') ===');
  [...new Set(nonLocal)].forEach(e => console.log('  ' + e));

  // --- 回到大厅，测试联机模式 ---
  console.log('\n=== 测试联机模式是否外联 ===');
  await page.keyboard.press('Escape').catch(() => {});
  await page.waitForTimeout(1000);
  await page.click('#backLobby').catch(() => {});
  await page.waitForTimeout(2500);
  const before = nonLocal.length;
  await page.click('#lobbyModeOnline').catch(() => {});
  await page.waitForTimeout(1500);
  // try to enter the online lobby (this is what would hit the API)
  await page.fill('#onlineName', '本地测试').catch(() => {});
  await page.click('#onlineConnect').catch(() => {});
  await page.waitForTimeout(6000);
  const onlineCalls = [...new Set(nonLocal)].slice(before === 0 ? 0 : before);
  console.log('  联机模式新增外部请求: ' + (nonLocal.length - before));
  [...new Set(nonLocal)].forEach(e => console.log('    ' + e));

  await browser.close();
})();
