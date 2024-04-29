module.exports = {
  extends: ['eslint-config-salesforce-typescript', 'plugin:sf-plugin/recommended'],
  root: true,
  rules: {
    header: 'off',
    '@typescript-eslint/no-unsafe-member-access': 'off',
  },
};
