const path = require('path');

const resolveStorage = fileName => path.resolve(__dirname, '..', 'data', fileName);

const sharedConfig = {
  dialect: 'sqlite',
  storage: resolveStorage('index.db'),
  logging: false,
};

module.exports = {
  development: sharedConfig,
  test: sharedConfig,
  production: sharedConfig,
};
