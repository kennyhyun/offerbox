const axios = require('axios');
const { promises: fsp } = require('fs');

const endpoints = {
  categories: 'https://www.woolworths.com.au/apis/ui/PiesCategoriesWithSpecials',
  category: 'https://www.woolworths.com.au/apis/ui/browse/category',
  products:
    'https://www.woolworths.com.au/apis/ui/products/169438,143730,135568,139897,185785,137546,144497,143737,120080,385085,144336?excludeUnavailable=true&source=RR-Suggested+For+You',
};

const constants = {
  jsonExtension: '.json',
  categoryFilename: 'woolworths.categories',
  productFilename: 'woolworths.products',
};

const getFilename = ({ objectId, subkeys = [] }) => `${[objectId, ...subkeys].join('-')}${constants.jsonExtension}`;
const saveToFile = async ({ objectId, subkeys = [], json }) => {
  const filename = getFilename({ objectId, subkeys });
  const data = JSON.stringify(json, null, 2);
  return fsp.writeFile(filename, data);
};
const loadFromFile = async ({ objectId, subkeys }) => {
  const filename = getFilename({ objectId, subkeys });
  return fsp
    .readFile(filename, 'utf8')
    .then(str => JSON.parse(str))
    .catch(() => {});
};
const save = saveToFile;
const load = loadFromFile;
const pageSize = 24;

const fetchProductsInCategory = async ({ key, id, desc, pageNumber = 1 }) => {
  const objectParams = { objectId: constants.productFilename, subkeys: [key, pageNumber] };
  let products = await load(objectParams);
  if (!products) {
    const location = `/shop/browse/${key}`;
    const resp = await axios.post(endpoints.category, {
      categoryId: id,
      location,
      url: location,
      pageNumber,
      pageSize: 24,
      sortType: 'PriceDesc',
      formatObject: `{"name": "${desc}"}`,
    });
    ({ data: products } = resp);
    save({ ...objectParams, json: products }).catch(e => console.error('Failed to save', objectId));
  }
  const { TotalRecordCount: totalCount, Bundles: bundles } = products;
  console.log('------------', key, '------------');
  console.log(
    JSON.stringify(
      bundles &&
        bundles.map(({ Products, Name: name }) => {
          return {
            name,
            products: Products.map(
              ({ Name: name, Stockcode: code, Price: price, InstorePrice: actualPrice, Unit: unit }) => ({
                code,
                price,
                actualPrice,
                unit,
              })
            ),
          };
        }),
      null,
      2
    )
  );
  if (!totalCount || pageNumber > (totalCount / pageSize)) return;
  fetchProductsInCategory({ key, id, desc, pageNumber: pageNumber + 1 });
};

const fetchCategories = async info => {
  return Object.keys(info).reduce(async (p, key, idx) => {
    await p;
    const { id, desc } = info[key];
    await fetchProductsInCategory({ key, id, desc });
    if (idx === 2) throw new Error('break');
  }, null);
};

const categoryObjectParams = { objectId: constants.categoryFilename };
load(categoryObjectParams).then(async categories => {
  if (!categories) {
    console.log('--- fetching', endpoints.category);
    const resp = await axios.get(endpoints.categories);
    ({ data: { Categories: categories } = {} } = resp);
    save({ ...categoryObjectParams, json: categories }).catch(e => console.error('Failed to save', objectId));
  }
  console.log('=== Categories ===');
  const categoryInfo = categories.reduce(
    (acc, it) => ({ ...acc, [it.UrlFriendlyName]: { id: it.NodeId, desc: it.Description } }),
    {}
  );
  console.log(categoryInfo);
  return fetchCategories(categoryInfo);
});
