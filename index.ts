const puppeteer = require('puppeteer');
const cheerio = require("cheerio");

function parse(html) {
    // load the page source into cheerio
    const cheerioHTML = cheerio.load(html);

    // perform queries
    const results = [];


    cheerioHTML('#contents ytd-video-renderer').each((J: number, linkInner: Element) => {
        results.push({
            link: cheerioHTML(linkInner).find('#thumbnail').attr('href'),
            title: cheerioHTML(linkInner).find('#video-title').text(),
            channel: cheerioHTML(linkInner).find('#text a').text(),
            channel_link: cheerioHTML(linkInner).find('#text a').attr('href'),
            views: cheerioHTML(linkInner).find('#metadata-line span').text(),
            thumbnail: cheerioHTML(linkInner).find('#thumbnail img').attr('src'),
            release_date: cheerioHTML(linkInner).find('#metadata-line span:nth-child(2)').text(),
        })

    })


    const cleaned = [];
    for (let i = 0; i < results.length; i++) {
        let res = results[i];

        if (res.link && res.link.trim() && res.title && res.title.trim()) {
            res.title = res.title.trim();
            res.rank = i + 1;
            const views = +res.views.substr(0, res.views.indexOf(' '));
            if (isNaN(views))  {
                res.views = 0;
            } else {
                res.views = views;
            }

            cleaned.push(res);
        }
    }

    return cleaned;
}


try {
    (async () => {
        let results: {};
        const browser = await puppeteer.launch({headless: true});
        const page = await browser.newPage();
        await page.goto('https://www.youtube.com');
        await new Promise(r => setTimeout(r, 4000));

        await page.keyboard.press('Tab');
        await new Promise(r => setTimeout(r, 400));
        await page.keyboard.press('Tab');
        await new Promise(r => setTimeout(r, 400));
        await page.keyboard.press('Tab');
        await new Promise(r => setTimeout(r, 400));
        await page.keyboard.press('Tab');
        await new Promise(r => setTimeout(r, 400));
        await page.keyboard.press('Tab');
        await new Promise(r => setTimeout(r, 400));
        await page.keyboard.press('Enter');

        await new Promise(r => setTimeout(r, 4000));

        await page.goto('');
        await page.waitForSelector('ytd-video-renderer, ytd-item-section-renderer, ytd-grid-video-renderer', {timeout: 10000});

        for (let i = 0; i < 9; i++) {
            await page.keyboard.press('End');
            await new Promise(r => setTimeout(r, 2000));
        }

        for (let i = 0; i < 9; i++) {
            await page.keyboard.press('Home');
            await new Promise(r => setTimeout(r, 1000));
        }


        let html = await page.content();
        results = parse(html);
        console.dir(results, {depth: null, colors: true});
        await browser.close();

    })()
} catch (err) {
    console.error(err)
}
