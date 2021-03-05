const { promises: fsp } = require('fs');

class Cache {
  constructor(config) {
    this.config = config;
  }
  async save({ objectId, subkeys, json }) {}
  async load({ objectId, subkeys }) {
    return {};
  }
  getFilename({ objectId, subkeys = [] }) {
    return `./${this.config.subdir}${[objectId, ...subkeys].join('-')}${this.config.jsonExtension}`;
  }
}

class FileCache extends Cache {
  constructor(config) {
    super(config);
  }
  async save({ objectId, subkeys, json }) {
    const filename = this.getFilename({ objectId, subkeys });
    const data = JSON.stringify(json, null, 2);
    return fsp.writeFile(filename, data);
  }
  async load({ objectId, subkeys }) {
    const filename = this.getFilename({ objectId, subkeys });
    console.log('----- load', filename);
    return fsp
      .readFile(filename, 'utf8')
      .then(str => JSON.parse(str))
      .catch(() => {});
  }
}

Object.assign(module.exports, {
  FileCache,
});
