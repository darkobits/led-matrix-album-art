import { withDefaultPackageScripts } from '@darkobits/ts';


export default withDefaultPackageScripts(({ command, script }) => {
  script('start', [
    command('nodemon', {
      args: [
        '--delay 1000',
        '--signal SIGKILL',
        'dist/index.js'
      ]})
  ], {
    group: 'Development'
  });
});