const scraperObject = {
	url: 'https://compralonuestro.co/search/companies?country=2007',
	async scraper(browser) {
		let page = await browser.newPage();
		console.log(`Navigating to ${this.url}...`);
		// Navigate to the selected page
		await page.goto(this.url);

		// Open login modal
		try {
			await page.$eval('.login-click', e => e.click());
			await page.waitForTimeout(20000);
		} catch(err) {
			console.log("Could not resolve the selector => ", err);
		}

		// Click the View More button and start the scraping of the shown companies
		// You are going to check if this button exist first, so you know if there really are more companies.
		/*let viewMoreButtonExist = false;
		try {
			const nextButton = await page.$eval('a.show-more-items', a => a.textContent);
			viewMoreButtonExist = true;
		} catch(err) {
			viewMoreButtonExist = false;
		}

		if(viewMoreButtonExist) {
			await page.click('a.show-more-items');
			//return scrapeCurrentPage(); // Call this function recursively
		}*/

		let showMoreCounter = 0;
		while (await page.$eval('a.show-more-items', a => a.textContent) && showMoreCounter <= 5) {
			await page.waitForTimeout(3000);
			await page.click('a.show-more-items');
			showMoreCounter++;
		}

		let scrapedData = [];
		async function scrapeCurrentPage() {
			// Wait for the required DOM to be rendered
			await page.waitForSelector('.item-section-parent');
		
			// Open login modal
			/*try {
				await page.$eval('.login-click', e => e.click());
				await page.waitForTimeout(20000);
			} catch(err) {
				console.log("Could not resolve the selector => ", err);
			}*/

			// Get the link to all the companies
			let urls = await page.$$eval('div.item-footer', links => {
				// Extract the links from the data
				links = links.map(el => el.querySelector('a.ng-binding').href)
				return links;
			});
			console.log(urls);

			// Loop through each of those links, open a new page instance and get the relevant data from them
			let pagePromise = (link) => new Promise(async(resolve, reject) => {
				let dataObj = {};
				let newPage = await browser.newPage();
				await newPage.goto(link);
				console.log("Link: ", link)
				await page.waitForSelector('div.main-content.ng-scope');
				try {
					dataObj['companyDetailURL'] = link;
					dataObj['companyNameHeader'] = await newPage.$eval('.landing-mid-hero > div:nth-child(1) > div:nth-child(1) > div:nth-child(2) > h2:nth-child(1)', text => text.textContent).catch(() => '');
					dataObj['companyName'] = await newPage.$eval('.first-column > div:nth-child(1) > div:nth-child(1) > p:nth-child(1)', text => text.textContent).catch(() => '');
					dataObj['companyDescription'] = await newPage.$eval('.description-block > div:nth-child(2) > div:nth-child(1) > p:nth-child(1)', text => {
						// Strip new line and tab spaces
						text = text.textContent.replace(/(\r\n\t|\n|\r|\t|^\s+)/gm, "");
						return text;
					}).catch(() => '');
					dataObj['webSite'] = await newPage.$eval('.first-column > div:nth-child(5) > div:nth-child(1) > div:nth-child(2) > div:nth-child(1) > p:nth-child(1) > a:nth-child(3)', text => text.textContent).catch(() => '');
					dataObj['email'] = await newPage.$eval('.first-column > div:nth-child(5) > div:nth-child(1) > div:nth-child(3) > div:nth-child(1) > p:nth-child(1) > span:nth-child(3)', text => text.textContent).catch(() => '');
					dataObj['phone'] = await newPage.$eval('.first-column > div:nth-child(5) > div:nth-child(1) > div:nth-child(4) > div:nth-child(1) > p:nth-child(1) > span:nth-child(3)', text => text.textContent).catch(() => '');
					dataObj['address1'] = await newPage.$eval('.first-column > div:nth-child(5) > div:nth-child(1) > div:nth-child(5) > div:nth-child(1) > p:nth-child(1) > span:nth-child(3)', text => text.textContent).catch(() => '');
					dataObj['address2'] = await newPage.$eval('.first-column > div:nth-child(5) > div:nth-child(1) > div:nth-child(5) > div:nth-child(1) > p:nth-child(1) > span:nth-child(4)', text => text.textContent).catch(() => '');
					dataObj['ecommerce'] = await newPage.$eval('.first-column > div:nth-child(5) > div:nth-child(1) > div:nth-child(6) > div:nth-child(1) > p:nth-child(1) > a:nth-child(3)', text => text.textContent).catch(() => '');
					dataObj['socialNetwork1'] = await newPage.$eval('.first-column > div:nth-child(5) > div:nth-child(1) > div:nth-child(8) > div:nth-child(1) > a:nth-child(1)', (elm) => elm.href).catch(() => '');
					dataObj['socialNetwork2'] = await newPage.$eval('.first-column > div:nth-child(5) > div:nth-child(1) > div:nth-child(8) > div:nth-child(2) > a:nth-child(1)', (elm) => elm.href).catch(() => '');
					dataObj['socialNetwork3'] = await newPage.$eval('.first-column > div:nth-child(5) > div:nth-child(1) > div:nth-child(8) > div:nth-child(3) > a:nth-child(1)', (elm) => elm.href).catch(() => '');
					dataObj['people'] = await newPage.$eval('div.extra-info-block:nth-child(1) > div:nth-child(2) > div:nth-child(1) > div:nth-child(1) > div:nth-child(1) > div:nth-child(2) > div:nth-child(1) > p:nth-child(1)', text => {
						// Strip new line and tab spaces
						text = text.textContent.replace(/(\r\n\t|\n|\r|\t|^\s+)/gm, "");
						return text;
					}).catch(() => '');
					dataObj['industry'] = await newPage.$eval('p.ng-binding:nth-child(3)', text => {
						// Strip new line and tab spaces
						text = text.textContent.replace(/(\r\n\t|\n|\r|\t|^\s+)/gm, "");
						return text;
					}).catch(() => '');
					dataObj['isVerifiedCompany'] = await newPage.$eval('.company-verifications > div:nth-child(1) > i:nth-child(1)', () => 'true').catch(() => 'false');
					dataObj['isWomenLedCompany'] = await newPage.$eval('div.woman > i:nth-child(1)', () => 'true').catch(() => 'false');
					dataObj['isOrangeCompany'] = await newPage.$eval('div.orange > i:nth-child(1)', () => 'true').catch(() => 'false');
					dataObj['isBIC'] = await newPage.$eval('div.bic > i:nth-child(1)', () => 'true').catch(() => 'false');
					dataObj['logoURL'] = await newPage.$eval('div.title-company:nth-child(1) > img:nth-child(1)', (img) => img.getAttribute('src')).catch(() => '');
					dataObj['productsAndServices_0'] = await newPage.$eval('.products-services-card > div:nth-child(1) > div:nth-child(1) > p:nth-child(1)', text => {
						// Strip new line and tab spaces
						text = text.textContent.replace(/(\r\n\t|\n|\r|\t|^\s+)/gm, "");
						return text;
					}).catch(() => '');
					dataObj['productsAndServices_0_1'] = await newPage.$eval('#moreProducts > div:nth-child(2) > div:nth-child(1) > div:nth-child(1) > div:nth-child(1) > p:nth-child(1)', text => {
						// Strip new line and tab spaces
						text = text.textContent.replace(/(\r\n\t|\n|\r|\t|^\s+)/gm, "");
						return text;
					}).catch(() => '');
					dataObj['productsAndServices_0_2'] = await newPage.$eval('#moreProducts > div:nth-child(2) > div:nth-child(1) > div:nth-child(2) > div:nth-child(1) > p:nth-child(1)', text => {
						// Strip new line and tab spaces
						text = text.textContent.replace(/(\r\n\t|\n|\r|\t|^\s+)/gm, "");
						return text;
					}).catch(() => '');
					dataObj['productsAndServices_0_3'] = await newPage.$eval('#moreProducts > div:nth-child(2) > div:nth-child(1) > div:nth-child(3) > div:nth-child(1) > p:nth-child(1)', text => {
						// Strip new line and tab spaces
						text = text.textContent.replace(/(\r\n\t|\n|\r|\t|^\s+)/gm, "");
						return text;
					}).catch(() => '');
					dataObj['productsAndServices_0_4'] = await newPage.$eval('#moreProducts > div:nth-child(2) > div:nth-child(1) > div:nth-child(4) > div:nth-child(1) > p:nth-child(1)', text => {
						// Strip new line and tab spaces
						text = text.textContent.replace(/(\r\n\t|\n|\r|\t|^\s+)/gm, "");
						return text;
					}).catch(() => '');
					dataObj['productsAndServices_1'] = await newPage.$eval('div.products-services-card:nth-child(1) > div:nth-child(1) > div:nth-child(1) > p:nth-child(1)', text => {
						// Strip new line and tab spaces
						text = text.textContent.replace(/(\r\n\t|\n|\r|\t|^\s+)/gm, "");
						return text;
					}).catch(() => '');
					dataObj['productsAndServices_1_1'] = await newPage.$eval('div.products-services-card:nth-child(1) > div:nth-child(1) > div:nth-child(2) > div:nth-child(1) > div:nth-child(1) > div:nth-child(1) > div:nth-child(1) > p:nth-child(1)', text => {
						// Strip new line and tab spaces
						text = text.textContent.replace(/(\r\n\t|\n|\r|\t|^\s+)/gm, "");
						return text;
					}).catch(() => '');
					dataObj['productsAndServices_1_2'] = await newPage.$eval('div.products-services-card:nth-child(1) > div:nth-child(1) > div:nth-child(2) > div:nth-child(1) > div:nth-child(1) > div:nth-child(2) > div:nth-child(1) > p:nth-child(1)', text => {
						// Strip new line and tab spaces
						text = text.textContent.replace(/(\r\n\t|\n|\r|\t|^\s+)/gm, "");
						return text;
					}).catch(() => '');
					dataObj['productsAndServices_1_3'] = await newPage.$eval('div.products-services-card:nth-child(1) > div:nth-child(1) > div:nth-child(2) > div:nth-child(1) > div:nth-child(1) > div:nth-child(3) > div:nth-child(1) > p:nth-child(1)', text => {
						// Strip new line and tab spaces
						text = text.textContent.replace(/(\r\n\t|\n|\r|\t|^\s+)/gm, "");
						return text;
					}).catch(() => '');
					dataObj['productsAndServices_1_4'] = await newPage.$eval('div.products-services-card:nth-child(1) > div:nth-child(1) > div:nth-child(2) > div:nth-child(1) > div:nth-child(1) > div:nth-child(4) > div:nth-child(1) > p:nth-child(1)', text => {
						// Strip new line and tab spaces
						text = text.textContent.replace(/(\r\n\t|\n|\r|\t|^\s+)/gm, "");
						return text;
					}).catch(() => '');
					dataObj['productsAndServices_2'] = await newPage.$eval('div.products-services-card:nth-child(2) > div:nth-child(1) > div:nth-child(1) > p:nth-child(1)', text => {
						// Strip new line and tab spaces
						text = text.textContent.replace(/(\r\n\t|\n|\r|\t|^\s+)/gm, "");
						return text;
					}).catch(() => '');
					dataObj['productsAndServices_2_1'] = await newPage.$eval('div.products-services-card:nth-child(2) > div:nth-child(1) > div:nth-child(2) > div:nth-child(1) > div:nth-child(1) > div:nth-child(1) > div:nth-child(1) > p:nth-child(1)', text => {
						// Strip new line and tab spaces
						text = text.textContent.replace(/(\r\n\t|\n|\r|\t|^\s+)/gm, "");
						return text;
					}).catch(() => '');
					dataObj['productsAndServices_2_2'] = await newPage.$eval('div.products-services-card:nth-child(2) > div:nth-child(1) > div:nth-child(2) > div:nth-child(1) > div:nth-child(1) > div:nth-child(2) > div:nth-child(1) > p:nth-child(1)', text => {
						// Strip new line and tab spaces
						text = text.textContent.replace(/(\r\n\t|\n|\r|\t|^\s+)/gm, "");
						return text;
					}).catch(() => '');
					dataObj['productsAndServices_2_3'] = await newPage.$eval('div.products-services-card:nth-child(2) > div:nth-child(1) > div:nth-child(2) > div:nth-child(1) > div:nth-child(1) > div:nth-child(3) > div:nth-child(1) > p:nth-child(1)', text => {
						// Strip new line and tab spaces
						text = text.textContent.replace(/(\r\n\t|\n|\r|\t|^\s+)/gm, "");
						return text;
					}).catch(() => '');
					dataObj['productsAndServices_2_4'] = await newPage.$eval('div.products-services-card:nth-child(2) > div:nth-child(1) > div:nth-child(2) > div:nth-child(1) > div:nth-child(1) > div:nth-child(4) > div:nth-child(1) > p:nth-child(1)', text => {
						// Strip new line and tab spaces
						text = text.textContent.replace(/(\r\n\t|\n|\r|\t|^\s+)/gm, "");
						return text;
					}).catch(() => '');
					dataObj['productsAndServices_3'] = await newPage.$eval('div.products-services-card:nth-child(3) > div:nth-child(1) > div:nth-child(1) > p:nth-child(1)', text => {
						// Strip new line and tab spaces
						text = text.textContent.replace(/(\r\n\t|\n|\r|\t|^\s+)/gm, "");
						return text;
					}).catch(() => '');
					dataObj['productsAndServices_3_1'] = await newPage.$eval('div.products-services-card:nth-child(3) > div:nth-child(1) > div:nth-child(2) > div:nth-child(1) > div:nth-child(1) > div:nth-child(1) > div:nth-child(1) > p:nth-child(1)', text => {
						// Strip new line and tab spaces
						text = text.textContent.replace(/(\r\n\t|\n|\r|\t|^\s+)/gm, "");
						return text;
					}).catch(() => '');
					dataObj['productsAndServices_3_2'] = await newPage.$eval('div.products-services-card:nth-child(3) > div:nth-child(1) > div:nth-child(2) > div:nth-child(1) > div:nth-child(1) > div:nth-child(2) > div:nth-child(1) > p:nth-child(1)', text => {
						// Strip new line and tab spaces
						text = text.textContent.replace(/(\r\n\t|\n|\r|\t|^\s+)/gm, "");
						return text;
					}).catch(() => '');
					dataObj['productsAndServices_3_3'] = await newPage.$eval('div.products-services-card:nth-child(3) > div:nth-child(1) > div:nth-child(2) > div:nth-child(1) > div:nth-child(1) > div:nth-child(3) > div:nth-child(1) > p:nth-child(1)', text => {
						// Strip new line and tab spaces
						text = text.textContent.replace(/(\r\n\t|\n|\r|\t|^\s+)/gm, "");
						return text;
					}).catch(() => '');
					dataObj['productsAndServices_3_4'] = await newPage.$eval('div.products-services-card:nth-child(3) > div:nth-child(1) > div:nth-child(2) > div:nth-child(1) > div:nth-child(1) > div:nth-child(4) > div:nth-child(1) > p:nth-child(1)', text => {
						// Strip new line and tab spaces
						text = text.textContent.replace(/(\r\n\t|\n|\r|\t|^\s+)/gm, "");
						return text;
					}).catch(() => '');
				} catch(err) {
					console.log("Could not resolve the selector => ", err);
				}

				await page.waitForTimeout(2000);

				resolve(dataObj);
				await newPage.close();
			});

			for(link in urls) {
				let currentPageData = await pagePromise(urls[link]);
				scrapedData.push(currentPageData);
				console.log(currentPageData);
				await page.waitForTimeout(2000);
			}

			// When all the data on this page is done, click the View More button and start the scraping of the shown companies
			// You are going to check if this button exist first, so you know if there really are more companies.
			/*let viewMoreButtonExist = false;
			try {
				const nextButton = await page.$eval('a.show-more-items', a => a.textContent);
				viewMoreButtonExist = true;
			} catch(err) {
				viewMoreButtonExist = false;
			}

			if(viewMoreButtonExist) {
				await page.click('a.show-more-items');	
				return scrapeCurrentPage(); // Call this function recursively
			}*/
			await page.close();
			return scrapedData;
		}

		let data = await scrapeCurrentPage();
		console.log(data);
		return data;
    }
}

module.exports = scraperObject;