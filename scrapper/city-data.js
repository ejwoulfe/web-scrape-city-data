import puppeteer from 'puppeteer';
import { citiesListByState } from '../website-urls.js';




(async () => {


    // Launch the browser and open a new blank page
    const browser = await puppeteer.launch({ headless: false, defaultViewport: null });
    const page = await browser.newPage();

    // Navigate the page to a URL
    await page.goto(citiesListByState("Alabama"));

    // Set screen size
    await page.setViewport({ width: 1080, height: 1024 });

    await page.waitForNetworkIdle();

    const data = await page.evaluate(() => {
        const cityDataSelectors = {
            tableBody: "#cityTAB > tbody",
            tableRow: "#cityTAB > tbody > tr",
            cityLink: "#cityTAB > tbody > tr > td:nth-child(2) > a"

        }
        const trs = Array.from(document.querySelectorAll(cityDataSelectors.tableRow))

        // Really low population cities have their css visibility hidden. So filter out those and grab only the visible ones.
        const cities = trs.filter(row => row.checkVisibility() === true);

        // The website is wrabbing certain cities with the <b> tag so have to add an additional step to go 1 more child node down to get the href value.
        const links = cities.map((row) => {
            let test = row.children[1];
            let test2 = test.children[0];
            if (test2.innerHTML.includes('<a')) {
                return test2.children[0].href
            } else {
                return test2.href;
            }


        })

        return links;



    });
    console.log(data);


    await browser.close();
})();