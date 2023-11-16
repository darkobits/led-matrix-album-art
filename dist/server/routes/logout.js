import { CONFIG_KEYS } from "../../etc/constants.js";
import conf from "../../lib/config.js";
async function logoutHandler(request, reply) {
  conf.delete(CONFIG_KEYS.SPOTIFY_USER);
  await reply.redirect("/");
}
export {
  logoutHandler
};
//# sourceMappingURL=logout.js.map
