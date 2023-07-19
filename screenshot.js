const puppeteer = require('puppeteer');

async function screenshot() {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto('https://ryan.hellyer.kiwi');
  await page.screenshot({path: 'example.png'});

  await browser.close();
}

screenshot();
