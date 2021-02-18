const Puppeteer = require("puppeteer-extra");

// Add stealth plugin and use defaults (all tricks to hide puppeteer usage)
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
Puppeteer.use(StealthPlugin());

// Add adblocker plugin to block all ads and trackers (saves bandwidth)
const AdblockerPlugin = require("puppeteer-extra-plugin-adblocker");
Puppeteer.use(AdblockerPlugin({ blockTrackers: true }));

// That's it, the rest is puppeteer usage as normal 😊
Puppeteer.launch({
  executablePath: "node_modules/puppeteer/.local-chromium/linux-848005/chrome-linux/chrome",
  headless: true,
  defaultViewport: null,
  args: [
    //
    //
    "--remote-debugging-port=9222",
    "--remote-debugging-address=0.0.0.0",
  ],
  //
})
  .then(async (browser) => {
    console.log(`------------------ Launched..`);
    //
    try {
      await new Promise((res) => setTimeout(res, 1000));
      const [page] = await browser.pages();
      console.log(`----------------- first page`, await page.title());
      await page.setViewport({ width: 800, height: 600 });

      /*
  console.log(`Testing adblocker plugin..`)
  await page.goto('https://www.vanityfair.com')
    console.log('--- page', await page.title());
  await page.waitFor(1000)
  await page.screenshot({ path: 'adblocker.png', fullPage: true })
  */

      console.log(`------------------ Testing the stealth plugin..`);
      await page.goto("https://fingerprintjs.com/demo/");
      // await page.goto('https://bot.sannysoft.com')
      await page.waitFor(2000);
      console.log("--- page", await page.title());
      await page.screenshot({ path: "stealth.png", fullPage: false });

      console.log(`All done, check the screenshots. ✨`);
      await browser.close();
    } catch (error) {
      console.error("--------Error", error);
    } finally {
      console.error("-------Finally");
      if (browser !== null && browser._process && browser._process.signalCode !== "SIGKILL") {
        await browser.close();
      }
    }
  })
  .then(() => console.log("main ended"))
  .catch(console.error);
