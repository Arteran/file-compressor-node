module.exports = {
  extends: 'eslint:recommended',
  env: {
    jest: true,
    node: true
  },
  rules: {
    'no-proto': 0
  },
  plugins: ['jest']
};
