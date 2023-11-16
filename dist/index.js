import path from "node:path";
import adeiu from "@darkobits/adeiu";
import Cron from "@darkobits/cron";
import env from "@darkobits/env";
import rootPath from "app-root-path";
import dotenv from "dotenv";
import * as R from "ramda";
import { CONFIG_KEYS } from "./etc/constants.js";
import conf from "./lib/config.js";
import events from "./lib/events.js";
import log from "./lib/log.js";
import { getMatrix } from "./lib/matrix.js";
import { getSpotifyClient } from "./lib/spotify-client.js";
import { getCurrentBrightness } from "./lib/suncalc.js";
import { imageToBuffer } from "./lib/utils.js";
import { startServer } from "./server/index.js";
dotenv.config({
  override: true,
  path: path.resolve(rootPath.toString(), ".env")
});
async function main() {
  try {
    if (process.getuid) {
      const uid = process.getuid();
      if (uid !== 0)
        log.warn(`Process not run with ${log.chalk.bold("sudo")}; unexpected errors may occur.`);
    }
    const hostname = env("HOSTNAME", true);
    const port = env("PORT", true);
    const matrixWidth = env("MATRIX_WIDTH", true);
    const matrixHeight = env("MATRIX_HEIGHT", true);
    const latitude = env("LATITUDE", true);
    const longitude = env("LONGITUDE", true);
    const server = await startServer({ hostname, port });
    const matrix = getMatrix();
    let delayedActionTimeout;
    const artworkUpdateCron = Cron.interval("2 seconds", async () => {
      const targetBrightness = getCurrentBrightness(latitude, longitude);
      if (matrix.brightness() !== targetBrightness) {
        matrix.brightness(targetBrightness).sync();
      }
      const currentUser = conf.get(CONFIG_KEYS.SPOTIFY_USER);
      if (!currentUser)
        return;
      const spotifyClient = await getSpotifyClient(currentUser == null ? void 0 : currentUser.email);
      const nowPlaying = (await spotifyClient.getMyCurrentPlayingTrack()).body;
      const item = nowPlaying.item;
      if (!nowPlaying.is_playing) {
        log.verbose("Player is paused.");
        delayedActionTimeout = setTimeout(() => {
          log.verbose("Clearing display due to inactivity.");
          matrix.clear().sync();
        }, 5e3);
        return;
      }
      if (!item) {
        log.verbose("Nothing is playing.");
        return matrix.clear().sync();
      }
      const images = item.type === "track" ? item.album.images : item.images;
      const largestImage = R.last(R.sortBy(R.propOr(0, "height"), images));
      if (!largestImage) {
        log.warn("No images for current item.");
        return matrix.clear().sync();
      }
      clearTimeout(delayedActionTimeout);
      const imgBuffer = await imageToBuffer({
        src: largestImage.url,
        width: matrixWidth,
        height: matrixHeight
      });
      matrix.drawBuffer(imgBuffer);
      setTimeout(() => matrix.sync(), 0);
    });
    artworkUpdateCron.on("start", () => {
      log.info(log.prefix("matrix"), log.chalk.green("Updates started."));
    });
    artworkUpdateCron.on("suspend", () => {
      log.info(log.prefix("matrix"), log.chalk.dim("Updates suspended."));
    });
    artworkUpdateCron.on("error", (err) => {
      log.error(log.prefix("matrix"), "Error updating matrix:", err);
      if (err instanceof AggregateError) {
        err.errors.forEach((err2) => log.error(err2.message));
      }
    });
    events.on("user-logged-in", (user) => {
      log.info(log.prefix("main"), `Logged in as: ${log.chalk.green(user.email)}`);
      void artworkUpdateCron.start();
    });
    events.on("user-logged-out", (user) => {
      if (user) {
        log.info(log.prefix("main"), log.chalk.gray(`User ${log.chalk.green.dim(user.email)} logged out.`));
      } else {
        log.info(log.prefix("main"), log.chalk.gray("User logged out."));
      }
      matrix.clear().sync();
      void artworkUpdateCron.suspend();
    });
    if (!conf.has(CONFIG_KEYS.SPOTIFY_USER)) {
      log.info(log.prefix("main"), log.chalk.gray("Waiting for user authentication."));
    } else {
      await artworkUpdateCron.start();
    }
    adeiu(async (signal) => {
      log.info(log.prefix("main"), `Got signal ${log.chalk.yellow(signal)}; shutting down.`);
      await Promise.all([
        artworkUpdateCron.suspend(),
        server.close()
      ]);
    });
    log.info(log.prefix("main"), log.chalk.green("Ready."));
  } catch (err) {
    log.error(err);
    throw err;
  }
}
void main();
export {
  main
};
//# sourceMappingURL=index.js.map
