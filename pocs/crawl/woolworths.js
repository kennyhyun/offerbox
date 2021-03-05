const axios = require('axios');
const { FileCache } = require('./lib/cache');

const endpoints = {
  categories: 'https://www.woolworths.com.au/apis/ui/PiesCategoriesWithSpecials',
  category: 'https://www.woolworths.com.au/apis/ui/browse/category',
  products:
    'https://www.woolworths.com.au/apis/ui/products/169438,143730,135568,139897,185785,137546,144497,143737,120080,385085,144336?excludeUnavailable=true&source=RR-Suggested+For+You',
};

const constants = {
  pageSize: 24,
  maxPageNumber: 100,
  subdir: 'raw-json/woolworths/',
  jsonExtension: '.json',
  categoryFilename: 'woolworths.categories',
  productFilename: 'woolworths.products',
};

const fileCache = new FileCache({ subdir: constants.subdir, jsonExtension: constants.jsonExtension });

const save = fileCache.save.bind(fileCache);
const load = fileCache.load.bind(fileCache);

const getDiscountRateString = ({ price, originalPrice }) =>
  `${Number((((originalPrice - price) / originalPrice) * 20).toFixed()) * 5}%`;

const fetchProductsInCategory = async ({ key, id, desc, pageNumber = 1 }) => {
  const { pageSize, productFilename } = constants;
  const objectParams = { objectId: productFilename, subkeys: [key, pageNumber] };
  let products = await load(objectParams);
  if (!products) {
    const location = `/shop/browse/${key}`;
    const resp = await axios.post(endpoints.category, {
      categoryId: id,
      location,
      url: location,
      pageNumber,
      pageSize,
      sortType: 'PriceDesc',
      formatObject: `{"name": "${desc}"}`,
    });
    ({ data: products } = resp);
    save({ ...objectParams, json: products }).catch(e => console.error('Failed to save', objectId));
  }
  const { TotalRecordCount: totalCount, Bundles: bundles } = products;
  console.log('------------', key, '-', pageNumber, '------------');
  console.log(
    JSON.stringify(
      bundles &&
        bundles
          .map(({ Products, Name: name }) => {
            return {
              name,
              products: Products.map(
                ({
                  Name: name,
                  Stockcode: code,
                  WasPrice: originalPrice,
                  Price: price,
                  InstorePrice: instorePrice,
                  Unit: unit,
                  IsAvailable: available,
                }) => ({
                  code,
                  price: instorePrice || price,
                  originalPrice,
                  unit,
                  available,
                  ...(price !== originalPrice ? { discountRate: getDiscountRateString({ originalPrice, price }) } : {}),
                })
              ),
            };
          })
          .filter(({ products: [it] }) => it.available && it.discountRate),
      null,
      2
    )
  );
  if (!totalCount || pageNumber > totalCount / pageSize) return;
  if (pageNumber >= constants.maxPageNumber) return;
  fetchProductsInCategory({ key, id, desc, pageNumber: pageNumber + 1 });
};

const fetchCategories = async info => {
  return Object.keys(info).reduce(async (p, key, idx) => {
    await p;
    const { id, desc } = info[key];
    await fetchProductsInCategory({ key, id, desc });
    if (idx === 6) throw new Error('break');
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
