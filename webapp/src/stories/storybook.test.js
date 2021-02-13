import initStoryshots, { multiSnapshotWithOptions } from '@storybook/addon-storyshots';

jest.mock('react-dom', () => {
  const original = jest.requireActual('react-dom');
  return {
    ...original,
    createPortal: node => node,
  };
});

initStoryshots({ test: multiSnapshotWithOptions() });
