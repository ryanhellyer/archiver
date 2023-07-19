const puppeteer = require('puppeteer');
const fs = require('fs');
const url = require('url');

async function monitorNetworkRequests() {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    let pathsArr = [];

    // Setup request interception and log each request's URL
    await page.setRequestInterception(true);
    page.on('request', (request) => {
        const parsedUrl = url.parse(request.url());
        const pathname = parsedUrl.pathname;
        const hostname = parsedUrl.hostname;
        const mainHostname = url.parse(page.url()).hostname;
        const search = parsedUrl.search || '';

        if (hostname === mainHostname) {
            const path = pathname + search;
            if (!pathsArr.includes(path)) {
                pathsArr.push(path);
            }
        }
        request.continue();
    });

    // Log each URL change
    page.on('framenavigated', async () => {
        const parsedUrl = url.parse(page.url());
        const pathname = parsedUrl.pathname;
        const search = parsedUrl.search || '';
        const path = pathname + search;
        if (!pathsArr.includes(path)) {
            pathsArr.push(path);
        }

        // Log all assets linked in the page
        const assetSelectors = ['a', 'img', 'link', 'script', 'source', 'iframe', 'audio', 'embed', 'object', 'track', 'video', 'meta[content]'];
        for (let selector of assetSelectors) {
            const assetUrls = await page.$$eval(selector, elements => elements.map(el => el.getAttribute('href') || el.getAttribute('src') || el.getAttribute('content')));
            for (let assetUrl of assetUrls) {
                if (assetUrl) {
                    const parsedAssetUrl = url.parse(assetUrl);
                    const assetPathname = parsedAssetUrl.pathname;
                    const assetHostname = parsedAssetUrl.hostname;
                    const mainHostname = url.parse(page.url()).hostname;
                    const assetSearch = parsedAssetUrl.search || '';
                    const path = assetPathname + assetSearch;
                    if (assetHostname === mainHostname) {
                        if (!pathsArr.includes(path)) {
                            pathsArr.push(path);
                        }
                    }
                }
            }
        }
    });

    await page.goto('https://ryan.hellyer.kiwi/');

    // Scroll to the bottom of the page
    await page.evaluate(async () => {
        await new Promise((resolve) => {
            var totalHeight = 0;
            var distance = 100;
            var timer = setInterval(() => {
                var scrollHeight = document.body.scrollHeight;
                window.scrollBy(0, distance);
                totalHeight += distance;

                if (totalHeight >= scrollHeight){
                    clearInterval(timer);
                    resolve();
                }
            }, 300);
        });
    });

    // Wait for 3 seconds to make sure all requests are captured (you can adjust this delay as needed)
    await new Promise(resolve => setTimeout(resolve, 3000));

    await browser.close();

    // Write the unique paths to a JSON file
    fs.writeFileSync('paths.json', JSON.stringify(pathsArr, null, 2));
}

monitorNetworkRequests();
