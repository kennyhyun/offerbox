import React from 'react';

import ProductItem from '../components/ProductItem';

export default {
  title: 'Producte/ProductItem',
  component: ProductItem,
  argTypes: {
    backgroundColor: { control: 'color' },
  },
};

const Template = args => <ProductItem {...args} />;

export const Primary = Template.bind({});
Primary.args = {
  title: 'Product Title',
  description: 'Superior product',
};
