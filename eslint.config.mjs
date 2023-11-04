import { ts } from '@darkobits/eslint-plugin';

export default [
  ...ts,
  {
    languageOptions: {
      globals: {
        'SpotifyApi': 'readonly'
      }
    },
    rules: {
      'no-console': 'off',
      'unicorn/no-typeof-undefined': 'off'
    }
  }
];
