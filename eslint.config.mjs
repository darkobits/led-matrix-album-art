import { ts } from '@darkobits/eslint-plugin';

export default [
  ...ts,
  {
    rules: {
      'unicorn/no-typeof-undefined': 'off'
    }
  }
];
