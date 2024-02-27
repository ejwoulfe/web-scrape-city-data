import puppeteer from 'puppeteer';
import { citiesListByState } from '../website-urls.js';
import fs from 'fs';






(async () => {


    // Launch the browser and open a new blank page
    const browser = await puppeteer.launch({ headless: false, defaultViewport: null });
    const page = await browser.newPage();
    const states = ["Alabama", "Alaska", "Arkansas", "Arizona", "California", "Colorado", "Connecticut", "Delaware", "District of Columbia", "Florida", "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky", "Louisiana", "Maine", "Maryland", "Massachusetts", "Michigan", "Minnesota", "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire", "New Jersey", "New Mexico", "New York", "North Carolina", "North Dakota", "Ohio", "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island", "South Carolina", "South Dakota", "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington", "West Virginia", "Wisconsin", "Wyoming"]
    const statesWithCityLinks = {};
    for (let i = 0; i < states.length; i++) {


        // Navigate the page to a URL
        await page.goto(citiesListByState(states[i]).replaceAll(" ", "-"), { timeout: 0 });

        // Set screen size
        await page.setViewport({ width: 1080, height: 1024 });

        await page.waitForNetworkIdle({ idleTime: 10000 })


        const data = await page.evaluate(() => {
            const cityDataSelectors = {
                tableBody: "#cityTAB > tbody",
                tableRow: "#cityTAB > tbody > tr",
                cityLink: "#cityTAB > tbody > tr > td:nth-child(2) > a"

            }
            const trs = Array.from(document.querySelectorAll(cityDataSelectors.tableRow))

            // Really low population cities have their css visibility hidden. So filter out those and grab only the visible ones.
            const cities = trs.filter(row => row.checkVisibility() === true);

            // The website is wrapping certain cities with the <b> tag so have to add an additional step to go 1 more child node down to get the href value.
            const links = cities.map((row) => {
                let tableRowWithHref = row.children[1];
                let linkElement = tableRowWithHref.children[0];
                if (linkElement.innerHTML.includes('<a')) {
                    return linkElement.children[0].href
                } else {
                    return linkElement.href;
                }


            })

            return links;



        });

        let stateName = states[i];

        statesWithCityLinks[stateName] = data;


    }
    let stateData = JSON.stringify(statesWithCityLinks);
    fs.writeFileSync('states.json', stateData);


    await browser.close();
})();