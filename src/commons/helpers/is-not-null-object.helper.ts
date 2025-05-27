export const isNotNullObject = (val: unknown) => {
  return typeof val !== 'undefined' && typeof val === 'object' && val !== null;
};
