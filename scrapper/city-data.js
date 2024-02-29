import puppeteer from 'puppeteer';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const stateData = require('../states.json');
import fs from 'fs';




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
                let camelize = (str) => {
                    return str.replace(/(?:^\w|[A-Z]|\b\w)/g, function (word, index) {
                        return index === 0 ? word.toLowerCase() : word.toUpperCase();
                    }).replace(/\s+/g, '');
                }


                const dataSelectors = {
                    cityName: '.city span',
                    costOfLivingIndex: '#cost-of-living-index',
                    medianHouseIncome: '#median-income',
                    population: '#city-population',
                    malePopulation: '#population-by-sex tr:nth-child(1) td:first-child',
                    femalePopulation: '#population-by-sex tr:nth-child(2) td:first-child',
                    medianHouseValue: '#median-income',
                    medianAge: '#median-age > div > table > tbody > tr:nth-child(1) > td:nth-child(2)',
                    races: '#races-graph > div > ul > li:nth-child(2) > ul',
                    unemployment: '#unemployment > div > table > tbody > tr:nth-child(1) > td:nth-child(2)',
                    maritalStatus: '#marital-info > ul',
                    education: '#education-info > ul',
                    commuteTime: '#education-info > ul > li:nth-child(5)'
                }

                // City Name
                let cityNameStr = document.querySelector(dataSelectors.cityName).innerHTML;
                let cityName = cityNameStr.substring(0, cityNameStr.indexOf(',')).trim().toLowerCase().replaceAll("-", " ");

                data.cityName = camelize(cityName);


                // Cost of Living Index
                let costIndexStr = clearBTags(document.querySelector(dataSelectors.costOfLivingIndex).innerHTML);
                let costIndex = costIndexStr.substring(costIndexStr.indexOf(':') + 1, costIndexStr.indexOf('(')).trim();
                data.costIndex = costIndex;

                // Median HouseHold Income
                let houseIncomeStr = clearBTags(document.querySelector(dataSelectors.medianHouseIncome).innerHTML);
                let houseHoldIncome = houseIncomeStr.substring(houseIncomeStr.indexOf(':') + 1, houseIncomeStr.indexOf('(')).trim().replace('$', '');
                data.houseHoldMedianIncome = houseHoldIncome;

                // Population
                let populationStr = clearBTags(document.querySelector(dataSelectors.population).innerHTML);
                let population = populationStr.substring(populationStr.indexOf(':') + 1, populationStr.indexOf('.')).trim();
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

                // Median House or Condo Value
                let medianHouseStr = document.querySelector(dataSelectors.medianHouseValue).innerHTML;
                let medianHouseSubStr = medianHouseStr.substring(554, medianHouseStr.length);
                let medianHouseValue = medianHouseSubStr.substring(medianHouseSubStr.indexOf('$'), medianHouseSubStr.indexOf('(')).trim().replace('$', '');
                data.medianHouseValue = medianHouseValue;

                // Median Age
                let medianAgeStr = document.querySelector(dataSelectors.medianAge).innerHTML;
                let medianAge = medianAgeStr.substring(medianAgeStr.lastIndexOf('>') + 1, medianAgeStr.indexOf('years')).trim();
                data.medianAge = medianAge;

                // Races
                let races = [];
                let numOfRaces = document.querySelectorAll(dataSelectors.races + " > li").length;
                for (let i = 1; i <= numOfRaces; i++) {
                    let raceObj = {
                        numOfRace: null,
                        percentOf: null,
                        ethnicity: null
                    };

                    let listElement = `#races-graph > div > ul > li:nth-child(2) > ul > li:nth-child(${i})`;
                    raceObj.numOfRace = document.querySelector(listElement + " > span:nth-child(1)").innerHTML.trim();
                    raceObj.percentOf = document.querySelector(listElement + " > span:nth-child(2)").innerHTML.trim().replace('%', '');
                    raceObj.ethnicity = document.querySelector(listElement + " > b").innerHTML.trim().replace('<br>', " ");

                    races.push(raceObj)
                }
                data.races = races;

                // Unemployment
                let unemploymentStr = document.querySelector(dataSelectors.unemployment).innerHTML;
                let unemployment = unemploymentStr.substring(unemploymentStr.indexOf('</p>'), unemploymentStr.length).replace('</p>', '').replace('%', '');
                data.unemployment = unemployment;

                // Marital Status
                let maritalStatuses = {
                    neverMarried: null,
                    nowMarried: null,
                    separated: null,
                    widowed: null,
                    divorced: null
                }

                for (let i = 1; i <= Object.keys(maritalStatuses).length; i++) {

                    let listElement = dataSelectors.maritalStatus + `> li:nth-child(${i})`;
                    let maritalStr = clearBTags(document.querySelector(listElement).innerHTML);
                    let status = maritalStr.substring(0, maritalStr.indexOf(":")).trim();
                    let percentage = maritalStr.substring(maritalStr.indexOf(':') + 1, maritalStr.indexOf("%")).trim();

                    maritalStatuses[camelize(status)] = percentage;
                }
                data.maritalStatus = maritalStatuses;

                // Education
                let education = {
                    highSchool: null,
                    bachelorsDegree: null,
                    graduateDegree: null,
                }


                let highSchoolStr = clearBTags(document.querySelector(dataSelectors.education + " >  li:nth-child(1)").innerHTML.trim());
                let bachelorsStr = clearBTags(document.querySelector(dataSelectors.education + " >  li:nth-child(2)").innerHTML.trim());
                let graduateStr = clearBTags(document.querySelector(dataSelectors.education + " >  li:nth-child(3)").innerHTML.trim());

                education.highSchool = highSchoolStr.substring(highSchoolStr.indexOf(':') + 1, highSchoolStr.length).replace('%', '').trim();
                education.bachelorsDegree = bachelorsStr.substring(bachelorsStr.indexOf(':') + 1, bachelorsStr.length).replace('%', '').trim();
                education.graduateDegree = graduateStr.substring(graduateStr.indexOf(':') + 1, graduateStr.length).replace('%', '').trim();

                data.education = education;

                // Commute Time
                let commuteTimeStr = clearBTags(document.querySelector(dataSelectors.commuteTime).innerHTML.trim());
                data.commuteTime = commuteTimeStr.substring(commuteTimeStr.indexOf(':') + 1, commuteTimeStr.lastIndexOf('m')).trim();











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