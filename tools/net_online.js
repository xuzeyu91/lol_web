const { chromium } = require('playwright');
const PORT = process.env.PORT || '5173';

(async () => {
  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
  });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const hits = [];
  page.on('request', r => {
    const u = r.url();
    if (!u.startsWith(`http://127.0.0.1:${PORT}`) && !u.startsWith('blob:') && !u.startsWith('data:')) {
      hits.push(u.slice(0, 160));
    }
  });
  await page.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'load', timeout: 60000 });
  await page.waitForTimeout(6000);
  await page.fill('#onlineName', '本地测试').catch(() => {});
  await page.click('#onlineConnect').catch(() => {});
  await page.waitForTimeout(8000);
  await page.click('#onlineRefresh').catch(() => {});
  await page.waitForTimeout(5000);
  console.log('外部请求 (' + hits.length + '):');
  [...new Set(hits)].forEach(h => console.log('  ' + h));
  const status = await page.evaluate(() => document.getElementById('onlineStatus')?.textContent);
  console.log('onlineStatus:', status);
  await browser.close();
})();
