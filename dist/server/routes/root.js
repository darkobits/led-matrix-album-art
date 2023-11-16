import * as R from "ramda";
import { CONFIG_KEYS } from "../../etc/constants.js";
import conf from "../../lib/config.js";
import { getSpotifyClient } from "../../lib/spotify-client.js";
import { getArtistNames } from "../../lib/utils.js";
async function rootHandler(request, reply) {
  var _a;
  const currentUser = conf.get(CONFIG_KEYS.SPOTIFY_USER);
  if (currentUser) {
    const spotifyClient = await getSpotifyClient(currentUser == null ? void 0 : currentUser.email);
    const nowPlaying = (await spotifyClient.getMyCurrentPlayingTrack()).body;
    const item = nowPlaying.item;
    const largestImage = R.last(R.sortBy(R.propOr(0, "height"), ((_a = item == null ? void 0 : item.album) == null ? void 0 : _a.images) ?? []));
    return {
      user: currentUser.email,
      nowPlaying: item ? {
        state: nowPlaying.is_playing ? "playing" : "paused",
        artist: getArtistNames(item),
        title: item.name,
        image: largestImage == null ? void 0 : largestImage.url
      } : false
    };
  }
  return {
    email: false,
    nowPlaying: false
  };
}
export {
  rootHandler
};
//# sourceMappingURL=root.js.map
