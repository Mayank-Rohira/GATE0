const puppeteer = require('puppeteer');

(async () => {
  console.log('Starting GATE0 Browser UI E2E test...');
  // Launch in non-headless so the user can see it! 
  // We use the default viewport to simulate mobile
  const browser = await puppeteer.launch({ headless: false, defaultViewport: { width: 390, height: 844 } });
  const page = await browser.newPage();
  
  try {
      console.log('1. Navigating to landing page...');
      await page.goto('http://localhost:8081', { waitUntil: 'networkidle2' });
      await new Promise(r => setTimeout(r, 2000)); // wait for landing animation
      
      console.log('2. Testing Resident Login/Entry...');
      // Click 'Resident Portal' or equivalent
      const [residentBtn] = await page.$x("//*[contains(text(), 'Resident')]");
      if (residentBtn) {
          await residentBtn.click();
          await new Promise(r => setTimeout(r, 1000));
      } else {
          console.error("Could not find Resident button");
      }

      console.log('Browser test script completed execution.');
  } catch(e) {
      console.error('Error during browser execution:', e);
  } finally {
      console.log('Leaving browser open for user to inspect.');
      // await browser.close(); 
  }
})();
