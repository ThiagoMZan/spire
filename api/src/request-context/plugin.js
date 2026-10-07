import { runWithRequestContext } from "./index.js";

export async function requestContextPlugin(app) {
  app.addHook("onRequest", (request, _reply, done) => {
    runWithRequestContext(
      { requestId: request.id, principal: null, moduleKey: null },
      done,
    );
  });
}
