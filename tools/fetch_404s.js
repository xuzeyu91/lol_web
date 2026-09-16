const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({executablePath:'C://Program Files\\Google\\Chrome\\Application\\chrome.exe', args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  const page = await browser.newPage({viewport:{width:1280,height:800}});
  const bad = new Set();
  page.on('response', r => { if (r.status() >= 400) bad.add(r.url().replace('http://127.0.0.1:5174/static/r20260915-miss-fortune-1/','')); });
  await page.goto('http://127.0.0.1:5174/', {waitUntil:'load',timeout:60000});
  await page.waitForTimeout(7000);
  await page.click('#lobbyModeLocal').catch(()=>{});
  await page.waitForTimeout(1500);
  await page.click('#start').catch(()=>{});
  for (let i=0;i<24;i++){await page.waitForTimeout(2000); if (await page.evaluate(()=>getComputedStyle(document.getElementById('lobby')).display==='none')) break;}
  await page.waitForTimeout(5000);
  [...bad].forEach(u=>console.log('  404', u));
  await browser.close();
})();
