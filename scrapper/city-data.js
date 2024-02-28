import puppeteer from 'puppeteer';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const stateData = require('../states.json');
import { delay } from '../helper/delay.js';




(async () => {


    // Launch the browser and open a new blank page
    const browser = await puppeteer.launch({ headless: false, defaultViewport: null });
    const page = await browser.newPage();

    const citiesData = {};

    for (let states in stateData) {
        let citiesLinksArray = stateData[states];
        for (let i = 0; i < citiesLinksArray.length; i++) {



            // // Navigate the page to a URL
            await page.goto(citiesLinksArray[i], { waitUntil: 'load', timeout: 0 });
            // // Set screen size
            await page.setViewport({ width: 1080, height: 1024 });

            // await page.waitForNetworkIdle({ idleTime: 2000 })


            const cityData = await page.evaluate(async () => {
                let data = {};
                let delay = (time) => {
                    return new Promise(function (resolve) {
                        setTimeout(resolve, time)
                    });
                }
                let clearBTags = (innerHTML) => innerHTML.replaceAll('<b>', '').replaceAll('</b>', '');


                const dataSelectors = {
                    cityName: '.city span',
                    costOfLivingIndex: '#cost-of-living-index',
                    medianHouseIncome: '#median-income',
                    population: '#city-population',
                    malePopulation: '#population-by-sex tr:nth-child(1) td:first-child',
                    femalePopulation: '#population-by-sex tr:nth-child(2) td:first-child'
                }

                // City Name
                let cityNameStr = document.querySelector(dataSelectors.cityName).innerHTML;
                let cityNameSpaced = cityNameStr.substring(0, cityNameStr.indexOf(',')).trim().toLowerCase().replaceAll("-", " ");
                let splitArr = cityNameSpaced.split(" ").map((string, index) => {
                    if (index === 0) {
                        return string;
                    } else {

                        return string.charAt(0).toUpperCase() + string.slice(1);
                    }
                })
                let cityName = splitArr.join("");
                data.cityName = cityName;


                // Cost of Living Index
                let costIndexStr = clearBTags(document.querySelector(dataSelectors.costOfLivingIndex).innerHTML);
                let costIndex = costIndexStr.substring(costIndexStr.indexOf(':') + 1, costIndexStr.indexOf('(')).trim();
                data.costIndex = costIndex;

                // Median HouseHold Income
                let houseIncomeStr = clearBTags(document.querySelector(dataSelectors.medianHouseIncome).innerHTML);
                let houseHoldIncome = houseIncomeStr.substring(houseIncomeStr.indexOf(':') + 1, houseIncomeStr.indexOf('(')).trim();
                data.houseHoldMedianIncome = houseHoldIncome;

                // Population
                let populationStr = clearBTags(document.querySelector(dataSelectors.population).innerHTML);
                let population = populationStr.substring(populationStr.indexOf(':') + 1, populationStr.indexOf('.'));
                if (population.includes("(")) {
                    population = population.substring(0, population.indexOf('(')).trim();
                }
                data.population = population;

                // Male Population
                let malePopStr = clearBTags(document.querySelector(dataSelectors.malePopulation).innerHTML);
                let malePopulation = malePopStr.substring(malePopStr.indexOf(":") + 1, malePopStr.indexOf("&")).trim();
                data.malePopulation = malePopulation;


                // Female Population
                let femalePopStr = clearBTags(document.querySelector(dataSelectors.femalePopulation).innerHTML);
                let femalePopulation = femalePopStr.substring(femalePopStr.indexOf(":") + 1, femalePopStr.indexOf("&")).trim();
                data.femalePopulation = femalePopulation;


                // delay to avoid sending requests too fast.
                await delay(20000);
                return data;

            })

            citiesData[cityData.cityName] = cityData;
            console.log(citiesData)
        }
    }
    await browser.close();
})();