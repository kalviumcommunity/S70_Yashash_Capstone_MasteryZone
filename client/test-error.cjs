const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));

  await page.goto('http://localhost:5055/language', { waitUntil: 'networkidle2' });
  
  try {
    const errorDetails = await page.evaluate(() => {
      const details = document.querySelector('details');
      if (details) return details.innerText;
      return "No error boundary found";
    });
    console.log("ERROR DETAILS FROM DOM:\n", errorDetails);
  } catch(err) {
    console.log("Failed to extract error:", err);
  }
  
  await browser.close();
})();
