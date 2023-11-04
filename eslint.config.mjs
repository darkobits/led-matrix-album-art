import { ts } from '@darkobits/eslint-plugin';

export default [
  ...ts,
  {
    globals: {
      'SpotifyApi': 'readonly'
    },
    rules: {
      'unicorn/no-typeof-undefined': 'off'
    }
  }
];
