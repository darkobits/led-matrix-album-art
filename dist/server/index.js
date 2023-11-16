import Fastify from "fastify";
import * as R from "ramda";
import selfsigned from "selfsigned";
import { OAUTH, CONFIG_KEYS } from "../etc/constants.js";
import conf from "../lib/config.js";
import log from "../lib/log.js";
import { expiresInToUnixTimestamp } from "../lib/utils.js";
import { configHandler } from "./routes/config.js";
import { loginHandler } from "./routes/login.js";
import { logoutHandler } from "./routes/logout.js";
import { rootHandler } from "./routes/root.js";
const prefix = log.prefix("server");
async function generateCertificate(commonName) {
  const certificates = conf.get(CONFIG_KEYS.CERTIFICATES) ?? [];
  let certificate = R.find(R.propEq(commonName, "commonName"), certificates);
  if (!certificate || Date.now() > certificate.expires) {
    log.info(log.prefix("server"), `Generating certificate for: ${log.chalk.green(commonName)}`);
    const { cert, private: key } = await new Promise((resolve, reject) => {
      selfsigned.generate([{ name: "commonName", value: commonName }], { days: 365 }, (err, result) => err ? reject(err) : resolve(result));
    });
    certificate = {
      commonName,
      cert,
      key,
      expires: expiresInToUnixTimestamp(365 * 24 * 60 * 60)
    };
    conf.set(CONFIG_KEYS.CERTIFICATES, [
      ...R.filter(R.propEq(commonName, "commonName"), certificates),
      certificate
    ]);
  }
  return certificate;
}
async function startServer(opts) {
  const { hostname, port } = opts ?? {};
  if (typeof hostname !== "string")
    throw new TypeError(`[startServer] Expected "hostname" to be of type "string", got "${typeof hostname}".`);
  if (typeof port !== "number")
    throw new TypeError(`[startServer] Expected "port" to be of type "number", got "${typeof port}".`);
  const server = Fastify({
    // Generate self-signed certificates for the configured hostname.
    https: await generateCertificate(hostname),
    ajv: {
      customOptions: {
        useDefaults: true,
        // With this option set to `false` and `additionalProperties` set to
        // `false` in schemas, Fastify will return a 400 if any unknown keys are
        // present.
        removeAdditional: false
      }
    }
  });
  server.get("/", rootHandler);
  server.get(OAUTH.LOGIN_ROUTE, { schema: loginHandler.schema }, loginHandler);
  server.get(OAUTH.CALLBACK_ROUTE, { schema: loginHandler.schema }, loginHandler);
  server.get("/logout", logoutHandler);
  server.get("/config", configHandler);
  server.post("/config", { schema: configHandler.schema }, configHandler);
  try {
    await server.listen({
      // Server should still be accessible via HTTPS on the configured hostname,
      // this merely instructs Fastify to listen on all available interfaces.
      host: "0.0.0.0",
      port
    });
    log.info(prefix, `Listening on: ${log.chalk.blue(`https://${hostname}:${port}`)}`);
    return await server;
  } catch (err) {
    throw new Error(log.chalk.red.bold(`Error starting server: ${err.message}`), { cause: err });
  }
}
export {
  startServer
};
//# sourceMappingURL=index.js.map
