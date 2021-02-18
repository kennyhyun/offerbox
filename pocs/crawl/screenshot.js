const chromium = require('chrome-aws-lambda');
// const Puppeteer = require('puppeteer-extra');
// // const StealthPlugin = require('puppeteer-extra-plugin-stealth');

// const { addExtra } = require('puppeteer-extra');
// const StealthPlugin = require('puppeteer-extra-plugin-stealth');
// const AcceptLanguagePlugin = require('puppeteer-extra-plugin-stealth/evasions/accept-language');
// const ChromeRuntimePlugin = require('puppeteer-extra-plugin-stealth/evasions/chrome.runtime');
// const ConsoleDebugPlugin = require('puppeteer-extra-plugin-stealth/evasions/console.debug');
// const IFrameContentWindowPlugin = require('puppeteer-extra-plugin-stealth/evasions/iframe.contentWindow');
// const MediaCodecsPlugin = require('puppeteer-extra-plugin-stealth/evasions/media.codecs');
// const NavigatorLanguagesPlugin = require('puppeteer-extra-plugin-stealth/evasions/navigator.languages');
// const NavigatorPermissionsPlugin = require('puppeteer-extra-plugin-stealth/evasions/navigator.permissions');
// const NavigatorPlugins = require('puppeteer-extra-plugin-stealth/evasions/navigator.plugins');
// const WebdriverPlugin = require('puppeteer-extra-plugin-stealth/evasions/navigator.webdriver');
// const UserAgentPlugin = require('puppeteer-extra-plugin-stealth/evasions/user-agent');
// const WebglVendorPlugin = require('puppeteer-extra-plugin-stealth/evasions/webgl.vendor');
// const WindowOuterDimensionsPlugin = require('puppeteer-extra-plugin-stealth/evasions/window.outerdimensions');


// const plugins = [
//   StealthPlugin(),
//   AcceptLanguagePlugin(),
//   ChromeRuntimePlugin(),
//   ConsoleDebugPlugin(),
//   IFrameContentWindowPlugin(),
//   MediaCodecsPlugin(),
//   NavigatorLanguagesPlugin(),
//   NavigatorPermissionsPlugin(),
//   NavigatorPlugins(),
//   WebdriverPlugin(),
//   UserAgentPlugin(),
//   WebglVendorPlugin(),
//   WindowOuterDimensionsPlugin(),
// ];

// Puppeteer.use(StealthPlugin());

const main = async () => {
  let result = null;
  let browser = null;

  try {
    // console.log('------', chromium.puppeteer, chromium.headless);
    const { puppeteer } = chromium;
    // const puppeteer = Puppeteer;

    browser = await puppeteer.launch({
      // args: chromium.args,
      args: [
        ...chromium.args,
        // ...Puppeteer.args,
        '--disable-gpu',
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-sync',
        '--mute-audio',
        '--window-size=800,600',
        // '--ignore-certificate-errors',
        '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/86.0.4240.183 Safari/537.36',
        '--lang=en-US,en;q=0.9',
      ],
      // defaultViewport: chromium.defaultViewport,
      // executablePath: await chromium.executablePath,
      headless: true, // chromium.headless,
      ignoreHTTPSErrors: true,
    });

    // await plugins.reduce(async (p, plugin) => {
    //   await p;
    //   return plugin.onBrowser(browser);
    // }, Promise.resolve());

    browser.on('disconnected', () => {
      console.log('disconnected!!!!!!');
    });

    console.log('--- browser', browser._process.spawnargs, browser);
    const page = await browser.newPage();
    page.on('error', e => console.log('page error', e));
    // await page.setExtraHTTPHeaders({
    //   'Accept-Language': 'en-AU,en;q=0.9'
    // });
    console.log('--- new page', Object.keys(page), Object.getPrototypeOf(page));
    // const resp = await page.goto('https://shop.coles.com.au/a/national/everything/browse', {
    const resp = await page.goto('https://fingerprintjs.com/demo/', {
      // const resp = await page.goto('https://i-know-you-faked-user-agent.glitch.me/new-window', {
      // const resp = await page.goto('https://google.com', {
      // const resp = await page.goto('https://duckduckgo.com/?q=my+user+agent&ia=answer', {
      timeout: 180 * 1000,
      waitUntil: 'networkidle0',
    }); // 'https://google.com');
    await page.waitFor(1000);
    console.log('--- page', await page.title());
    await page.screenshot({ path: '_screenshot.png' });

    console.log('--- closing browser');
    await browser.close();
    // console.log('--- browser closed', JSON.stringify(browser._process, null, 2));
  } catch (error) {
    console.error('--------Error', error);
  } finally {
    console.error('-------Finally');
    if (browser !== null && (browser._process && browser._process.signalCode !== 'SIGKILL')) {
      await browser.close();
    }
  }
  process.exit();
};

main()
  .then(() => console.log('main ended'))
  .catch(console.error);
