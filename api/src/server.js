import { config } from "./config.js";
import { buildApp } from "./app.js";

let app = null;

try {
  app = await buildApp();
  const address = await app.listen({ host: "0.0.0.0", port: config.PORT });
  app.log.info({ address }, "Spire API listening");
} catch (error) {
  if (app) app.log.error(error);
  else console.error(error);
  process.exit(1);
}
