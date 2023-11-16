import Conf from "conf";
import { CONFIG_KEYS } from "../etc/constants.js";
import events from "./events.js";
const conf = new Conf({
  // Set this to a sane-ish location. Otherwise, when run as root, config will
  // be saved to /root/.config, which cannot be reliably written to / read from
  // even when the process is started with sudo.
  cwd: "/etc/spotify-ish",
  configFileMode: 511,
  projectName: "spotify-ish",
  schema: {
    [CONFIG_KEYS.SPOTIFY_USER]: {
      type: "object",
      properties: {
        id: { type: "string" },
        email: { type: "string" },
        accessToken: { type: "string" },
        expires: { type: "number" },
        refreshToken: { type: "string" },
        scopes: { type: "string" }
      }
    },
    [CONFIG_KEYS.CERTIFICATES]: {
      type: "array",
      items: {
        type: "object",
        properties: {
          commonName: { type: "string" },
          cert: { type: "string" },
          key: { type: "string" },
          expires: { type: "number" }
        }
      }
    }
  }
});
conf.onDidChange("spotify-user", (newValue, oldValue) => {
  if (newValue) {
    void events.emit("user-logged-in", newValue);
  } else {
    void events.emit("user-logged-out", oldValue);
  }
});
export {
  conf as default
};
//# sourceMappingURL=config.js.map
