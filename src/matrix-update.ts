import sleep from '@darkobits/sleep';

import log from 'lib/log';
import { getMatrix } from 'lib/matrix';
import { imageToBuffer } from 'lib/utils';


const src = 'https://pf543qii3d.execute-api.us-west-1.amazonaws.com/b9a97e/now-playing.jpg';
const width = 64;
const height = 64;

export async function doMatrixUpdateLoop() {
  const matrix = getMatrix();

  let errorCount = 0;

  log.info('init');

  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      // TODO: We might be able to avoid some flickering here by disabling the
      // call to clear() and just call drawBuffer().
      const imgBuffer = await imageToBuffer({ src, width, height });
      matrix.clear();
      matrix.drawBuffer(imgBuffer);
      matrix.sync();
    } catch (err: any) {
      log.error(err);

      if (errorCount >= 5) {
        throw err;
      } else {
        errorCount += 1;
      }
    } finally {
      await sleep('2s');
    }
  }
}
