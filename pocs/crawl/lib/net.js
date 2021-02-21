const axios = require('axios');
require('axios-debug-log');

class FetchSource {

  constructor({ baseUrl, userAgent, cookieStringArray, cache }) {
    this.cache = cache;
    this.axiosInstance = axios.create({
      baseURL: baseUrl,
      headers: {
        'User-Agent': userAgent,
        Cookie: cookieStringArray,
      },
    });
    // console.log(axiosInstance.defaults);
  }

  async fetchColesHtml({ objectParams, path }) {
    let htmlString = await this.cache.load(objectParams);
    if (!htmlString) {
      const resp = await this.axiosInstance.get(path).catch(resp => {
        const { status, config, headers } = resp.response || {};
        console.log('Error', { status, config, headers });
        const setCookie = resp.response.headers['set-cookie'];
        this.updateCookie(setCookie);
      });
      const setCookie = resp.headers['set-cookie'];
      this.updateCookie(setCookie);
      console.log('OK', this.axiosInstance.defaults.headers.Cookie);
      htmlString = resp.data;
      this.cache.save({ ...objectParams, json: htmlString }).catch(e => console.error('Failed to save', objectId));
    }
    return htmlString;
  };

  updateCookie(cookies) {
    const {
      defaults: { headers },
    } = this.axiosInstance;
    let removed = 0;
    const newKeys = cookies.map(pair => pair.split('=')[0]);
    // remove existing
    headers.Cookie.forEach((pair, idx) => {
      const [key] = pair.split('=');
      if (newKeys.includes(key)) {
        // console.log('Updating cokie', key, 'at idx', idx);
        headers.Cookie.splice(idx - removed, 1);
        removed += 1;
      }
    });
    // add new
    headers.Cookie.push(...cookies);
    const bmcrf = headers.Cookie.find(c => c.startsWith('ak_bmcrf'));
    console.log('Updatied ak_bmcrf', bmcrf);
  }
}

Object.assign(module.exports, {
  FetchSource,
});

