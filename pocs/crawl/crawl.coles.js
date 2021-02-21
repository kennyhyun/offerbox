const R = require('ramda');
const PATH = require('path');
const parse5 = require('parse5');
const htmlparser2Adapter = require('parse5-htmlparser2-tree-adapter');
const { FileCache } = require('./lib/cache');
const { FetchSource } = require('./lib/net');
const { find, print, getText, handleArrayOrItem } = require('./lib/tree');

const [, , akBmcrf] = process.argv;

if (!akBmcrf) {
  console.log(`Please provide 'ak_bmcrf' in the browser cookies`);
  process.exit(-1);
}

const constants = {
  maxPage: 50,
  categoryLevel: 2,
  cachePrefix: 'coles.browse',
  userAgent:
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/88.0.4324.150 Safari/537.36',
  baseUrl: 'https://shop.coles.com.au',
  endpoints: {
    browse: '/a/national/everything/browse',
    ajaxCategoryBase: '/online/national',
  },
  ajaxQuerySample:
    'tabType=everything&tabId=everything&personaliseSort=false&orderBy=20601_6&errorView=AjaxActionErrorResponse&requesttype=ajax&beginIndex=0',
};

const source = new FetchSource({
  userAgent: constants.userAgent,
  baseUrl: constants.baseUrl,
  cookieStringArray: [`ak_bmcrf=${akBmcrf}`],
  cache: new FileCache({ subdir: 'raw-json/coles/', jsonExtension: '.json' }),
});

const categoyMapper = ({ uniqueID, name, seo_token, level }, path) => ({
  level,
  id: uniqueID,
  name,
  slug: seo_token,
  ...(path && { path: PATH.join(path, seo_token) }),
});

const findCategories = (categories, path = '/') =>
  categories.reduce((ext, cat) => {
    if (cat.level >= constants.categoryLevel) {
      return [...ext, categoyMapper(cat, path)];
    }
    return [...ext, ...(cat.catalogGroupView && findCategories(cat.catalogGroupView, PATH.join(path, cat.seo_token)))];
  }, []);

const parseColesProductData = async tree => {
  const found = find(tree.children, 'html body div div div div div div div div[data-colrs-transformer]'.split(' '));
  const flatten = R.flatten(found);
  const data = flatten.reduce((attr, node) => {
    const dataSegment =
      node.attribs &&
      Object.keys(node.attribs).reduce((attribs, key) => {
        if (key.startsWith('data-')) {
          if (!key.endsWith('transformer')) {
            const val = JSON.parse(getText(node.children));
            const bind = node.attribs['data-colrs-bind'];
            // console.log(`${bind}:`, val);
            return { ...attr, [bind]: val };
          }
        }
        return attribs;
      }, {});
    return { ...attr, ...dataSegment };
  }, {});
  return Object.values(data).find(it => it.type === 'COLRSCatalogEntryList');
};

const parseColesData = async tree => {
  // console.log(parsed);
  // print(parsed, 'html body div[data-colrs-category-counts]');
  // print(parsed, 'html body div[data-colrs-all-categories]');
  // const found = find(parsed.children, 'html body div[data-colrs-all-categories]'.split(' '));
  const found = find(tree.children, 'html body div[data-colrs-transformer]'.split(' '));
  const data = found.reduce((attr, node) => {
    const dataSegment = Object.keys(node.attribs).reduce((attribs, key) => {
      if (key.startsWith('data-')) {
        const val = node.attribs[key];
        // console.log(`${key}:`, val);
        if (!key.endsWith('transformer')) {
          const [, outKey] = key.split('data-colrs-');
          return { ...attr, [outKey]: val };
        }
      }
      return attribs;
    }, {});
    return { ...attr, ...dataSegment };
  }, {});
  return data;
};

const parseMinificationCodes = async tree => {
  const found = find(tree.children, 'html body script[type]'.split(' '));
  // console.log(JSON.stringify(found.map(it => it.attribs), null, 2))
  // found.map((node, idx) => console.log('-----------', idx, '\n', getText(node.children)));
  const scripts = found
    .filter(node => {
      const keys = Object.keys(node.attribs);
      return !keys.includes('src') && !keys.includes('id');
    })
    .map(node => getText(node.children));
  const siteConfig = scripts.find(txt => txt.includes('siteConfig'));
  const [, minificationCodes] = siteConfig.match(/minificationCodes.+: (.*)\n/) || [];
  return JSON.parse(minificationCodes);
};

const fetchProductsHtml = async (dir, page = 1) => {
  const productObjectParams = {
    objectId: `${constants.cachePrefix}.products${dir.replace(/\//g, '_')}`,
    subkeys: [page],
  };
  return source.fetchColesHtml({
    objectParams: productObjectParams,
    path: `${PATH.join(constants.endpoints.ajaxCategoryBase, dir)}?beginIndex=${page - 1}`,
  });
};

const mapKeys = ({ products, map }) => {
  const [product] = products;

  const mapKeys = R.compose(
    R.fromPairs,
    R.map(([k, v]) => [map[k], v]),
    R.toPairs
  );

  const mapObjectKeys = obj => {
    Object.keys(obj).forEach(k => {
      const val = obj[k];
      if (typeof val === 'object' && val.length === undefined) {
        obj[k] = mapObjectKeys(obj[k], map);
      }
    });
    return mapKeys(obj);
  };

  return products.map(product => mapObjectKeys(product));
};

const categoryObjectParams = { objectId: constants.cachePrefix };

const fetchProducts = async ({ directory, page = 1, minificationCodes }) => {
  const productsHtml = await fetchProductsHtml(directory, page);
  const parsedProducts = parse5.parse(productsHtml, { treeAdapter: htmlparser2Adapter });
  const parsedProductsData = await parseColesProductData(parsedProducts);
  const {
    searchInfo: { totalCount, pageSize },
    products: productSourceData,
    ...prodData
  } = parsedProductsData;
  const products = mapKeys({ map: minificationCodes, products: productSourceData });
  if (totalCount > pageSize * page && page < constants.maxPage) {
    products.push(...(await fetchProducts({ directory, page: page + 1, minificationCodes })));
  }
  return products;
};

source
  .fetchColesHtml({ objectParams: categoryObjectParams, path: constants.endpoints.browse })
  .then(async htmlString => {
    const parsed = parse5.parse(htmlString, { treeAdapter: htmlparser2Adapter });
    const minificationCodes = await parseMinificationCodes(parsed);
    const data = await parseColesData(parsed);
    // console.log(data);
    console.log('--------- categories ------------');
    // console.log(JSON.parse(data['all-categories']));
    const categories = findCategories(JSON.parse(data['all-categories']).catalogGroupView);
    // // .reduce((ext, cat) => [...ext, findCategories(cat)], []);
    // console.log(JSON.stringify(categories, null, 2));
    console.log(categories);
    await categories.reduce(async (p, category, idx) => {
      await p;
      const { path } = category;
      const products = await fetchProducts({ directory: path, minificationCodes });

      // console.log(products);
      console.log(JSON.stringify(products, null, 2));
      if (idx >= 3) throw new Error('break');
    }, null);
  })
  .catch(console.error);
