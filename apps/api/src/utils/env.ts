const { NODE_ENV } = process.env;

export const ENV = {
  isProd: NODE_ENV === 'production',
};
