const pageScraper = require('./pageScraperCompraLoNuestro');
const fs = require('fs');
async function scrapeAll(browserInstance){
	let browser;
	try{
		browser = await browserInstance;
		let scrapedData = {};
		
		// Call the scraper for different set of books to be scraped
		//await pageScraper.scraper(browser);
		scrapedData = await pageScraper.scraper(browser);
		await browser.close();
		console.log(scrapedData)
		fs.writeFile("data_CompraLoNuestro.json", JSON.stringify(scrapedData), 'utf8', function(err) {
		    if(err) {
		        return console.log(err);
		    }
		    console.log("The data has been scraped and saved successfully! View it at './data_CompraLoNuestro.json'");
		});
	} catch(err){
		console.log("Could not resolve the browser instance => ", err);
	}
}

module.exports = (browserInstance) => scrapeAll(browserInstance)