const renderer = require('dom-serializer').default;

const rxAttribute = /([a-z]+)(\[(.*)\])?/;
const matcher = query => {
  const [, name, , attribute] = query.match(rxAttribute) || [];
  console.log('Looking for', name, attribute);
  return node => {
    if (node.name == name) {
      if (!attribute) return true;
      return Object.keys(node.attribs).includes(attribute);
    }
    return false;
  };
};

const find = (children = [], queries) => {
  const [name] = queries;
  const found = children.filter(matcher(name));
  if (queries.length > 1) {
    if (found.length === 1) return find(found[0].children, queries.slice(1));
    return found.map(child => find(child.children, queries.slice(1)));
  }
  // console.log('-------------', found);
  return found.length === 1 ? found[0] : found;
};

const getText = children => {
  return children.map(node => node.data).join('\n');
};

const print = (parsedTree, query = '') => {
  const path = query.trim().split(' ');
  const found = find(parsedTree.children, path);
  console.log('Found', query, found.length);
  console.log(found);
  return handleArrayOrItem(found, node => {
    if (node.attribs && Object.keys(node.attribs).find(k => k.startsWith('data-'))) console.log(Object.keys(node.attribs));
    // console.log(renderer(node));
  });
};

const handleArrayOrItem = async (arrayOrItem, handler) => {
  if (!arrayOrItem.length) return handler(arrayOrItem);
  return arrayOrItem.reduce(async (p, item) => {
    await p;
    return handler(item);
  }, null);
};

Object.assign(module.exports, {
  find,
  print,
  getText,
  handleArrayOrItem,
});

