const Puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
Puppeteer.use(StealthPlugin());

const getTimeDiff = stamps => {
  const [former, latter] = stamps.slice(-2);
  return ((latter - former) / 1000).toFixed(2);
};

Puppeteer.launch({
  executablePath: 'node_modules/puppeteer/.local-chromium/linux-848005/chrome-linux/chrome',
  headless: false,
  defaultViewport: null,
  args: [
    '--disable-gpu',
    '--hide-scrollbars',
    '--mute-audio',
    '--window-size=800,600',
    '--no-sandbox',
    '--disable-setuid-sandbox',
    // '--disable-sync',
    // '--ignore-certificate-errors',
    '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/86.0.4240.183 Safari/537.36',
    // '--lang=en-US,en;q=0.9',
    // '--remote-debugging-port=9222',
    // '--remote-debugging-address=0.0.0.0',
    // '--app=https://google.com',
    '--lang=en-US,en;q=0.9',
  ],
  ignoreHTTPSErrors: true,
})
  .then(async browser => {
    console.log(`Launched..`);
    console.log('--- browser', browser._process.spawnargs);
    try {
      // await new Promise(res => setTimeout(res, 1000));
      const timestamps = [new Date().getTime()];
      const [page] = await browser.pages();
      timestamps.push(new Date().getTime());
      console.log('--- page ready', getTimeDiff(timestamps));
      browser.on('disconnected', () => {
        console.log('disconnected!!!!!!');
      });
      page.on('error', e => console.log('page error', e));

      timestamps.push(new Date().getTime());
      console.log(`------------------ Testing the stealth plugin..`, getTimeDiff(timestamps));
      const resp = await page
        .goto('https://shop.coles.com.au/a/national/everything/browse', {
          // .goto("https://fingerprintjs.com/demo/", {
          timeout: 120 * 1000,
          waitUntil: 'networkidle2',
        })
        .catch(e => console.warn);
      timestamps.push(new Date().getTime());
      console.log('--- page loaded', page._title, getTimeDiff(timestamps));
      const client = await page.target().createCDPSession();
      const { cookies: allCookies } = await client.send('Network.getAllCookies');
      timestamps.push(new Date().getTime());
      const cookies = allCookies
        .filter(i => i.httpOnly && i.domain === 'shop.coles.com.au')
        .map(({ name, value }) => `${name}=${value}`);
      cookies.forEach(it => console.log(it));
      console.log(getTimeDiff(timestamps));
      timestamps.push(new Date().getTime());
      await page.screenshot({ path: 'screenshots/_puppeteer-extra.png' });
      timestamps.push(new Date().getTime());
      console.log('--- screenshot taken', getTimeDiff(timestamps));
      await browser.close();
    } catch (error) {
      console.error('--------Error', error);
    } finally {
      console.error('-------Finally');
      if (browser !== null && browser._process && browser._process.signalCode !== 'SIGKILL') {
        await browser.close();
      }
    }
    process.exit();
  })
  .then(() => console.log('main ended'))
  .catch(console.error);
