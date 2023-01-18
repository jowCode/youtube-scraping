const puppeteer = require('puppeteer');
const cheerio = require("cheerio");
const fs = require('fs');

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


try {
    (async () => {
        let results = {};
        const browser = await puppeteer.launch({headless: false});
        const page = await browser.newPage();
        await page.goto('https://www.youtube.com/results?search_query=a4+b5&sp=CAISBggEEAEYAw%253D%253D');

        console.log('initial page load')

        await page.waitForSelector('tp-yt-paper-dialog, ytd-button-renderer', {timeout: 10000});
        await page.keyboard.press('Tab');
        await page.keyboard.press('Tab');
        await page.keyboard.press('Tab');
        await page.keyboard.press('Tab');
        await page.keyboard.press('Tab');
        await page.keyboard.press('Enter');

        console.log('accepted consent banner');


        await page.waitForSelector('ytd-video-renderer,ytd-grid-video-renderer', {timeout: 10000});

        console.log('start scrolling');

        await page.evaluate(async () => {
            let scrollPosition = 0
            let documentHeight = document.body.scrollHeight
            console.log(documentHeight);
            console.log(document.body.scrollHeight);
            while (documentHeight > scrollPosition) {
                window.scrollBy(0, documentHeight)
                await new Promise(resolve => {
                    setTimeout(resolve, 2000)
                })
                scrollPosition = documentHeight
                documentHeight = document.body.scrollHeight
                console.log(documentHeight);
            }
        });

        console.log('end scrolling');

        let html = await page.content();
        results = parse(html);
        console.dir(results, {depth: null, colors: true});
        // await browser.close();

    })()
} catch (err) {
    console.error(err)
}
