const puppeteer = require('puppeteer');
const cheerio = require("cheerio");

function parse(html) {
    // load the page source into cheerio
    const cheerioHTML = cheerio.load(html);

    // perform queries
    const results = [];
    cheerioHTML('#contents ytd-video-renderer').each((i, link) => {
        results.push({
            link: cheerioHTML(link).find('#thumbnail').attr('href'),
            title: cheerioHTML(link).find('#video-title').text(),
            channel: cheerioHTML(link).find('#text a').text(),
            channel_link: cheerioHTML(link).find('#text a').attr('href'),
            views: cheerioHTML(link).find('#metadata-line span').text(),
            thumbnail: cheerioHTML(link).find('#thumbnail img').attr('src'),

            release_date: cheerioHTML(link).find('#metadata-line span:nth-child(2)').text(),
        })
    });

    const cleaned = [];
    for (let i = 0; i < results.length; i++) {
        let res = results[i];

        if (res.link && res.link.trim() && res.title && res.title.trim()) {
            res.title = res.title.trim();
            res.rank = i + 1;
            res.views = +res.views.substr(0, res.views.indexOf(' '));

            cleaned.push(res);
        }
    }

    return cleaned;
}


async function scroll(
    page,
    scrollDelay = 800,
) {
    try {
        let previousHeight;

        for (let i = 0; i < 9; i++) {
            previousHeight = await page.evaluate('document.body.scrollHeight');
            console.log('previousHeight: ', previousHeight);
            await page.evaluate('window.scrollTo(0, document.body.scrollHeight)');
            await page.waitForFunction(`document.body.scrollHeight > ${previousHeight}`);
            await page.waitForTimeout(scrollDelay);
        }
    } catch(e) { }
    return page;
}


try {
    (async () => {
        let results = {};
        const browser = await puppeteer.launch({headless: false});
        const page = await browser.newPage();
        await page.goto('https://www.youtube.com');
        await new Promise(r => setTimeout(r, 5000));
        console.log('initial page loaded')
        // await page.waitForSelector('tp-yt-paper-dialog, ytd-button-renderer', {timeout: 10000});
        await page.keyboard.press('Tab');
        await new Promise(r => setTimeout(r, 800));
        await page.keyboard.press('Tab');
        await new Promise(r => setTimeout(r, 900));
        await page.keyboard.press('Tab');
        await new Promise(r => setTimeout(r, 800));
        await page.keyboard.press('Tab');
        await new Promise(r => setTimeout(r, 800));
        await page.keyboard.press('Tab');
        await new Promise(r => setTimeout(r, 1000));
        await page.keyboard.press('Enter');
        console.log('accepted consent banner');
        await new Promise(r => setTimeout(r, 5000));
        console.log('do the search');
        await page.goto('https://www.youtube.com/results?search_query=a4+b5&sp=CAISBggEEAEYAw%253D%253D');
        await page.waitForSelector('ytd-video-renderer,ytd-grid-video-renderer', {timeout: 10000});
        console.log('start scrolling');
        await scroll(page);
        console.log('end scrolling');

        let html = await page.content();
        results = parse(html);
        console.dir(results, {depth: null, colors: true});
        // await browser.close();

    })()
} catch (err) {
    console.error(err)
}
