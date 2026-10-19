// Runs when a server function called from the browser throws (serverFunctions.onError in vite.config.ts).
// SolidStart logs nothing here: it answers 200 with the message in an X-Error header, so a failed publish or
// feed query would never reach Workers Logs or Issues. Functions called while rendering throw in place and
// SolidStart logs those itself.
import type { ServerFunctionErrorHandler } from "@solidjs/start/server";

const onServerFunctionError: ServerFunctionErrorHandler = (thrown) => {
  // redirect() throws a Response: control flow, not a failure.
  if (thrown instanceof Response) return thrown;
  // Workers Issues groups logged errors; the stack maps back to src/ through the uploaded source maps.
  console.error(thrown);
  // The message can carry Postgres detail ("create_post: …"), so it stays in the log. The browser only needs to
  // know the call failed: the share form shows "Couldn't share." whatever the message says.
  return new Error("Something went wrong.");
};

export default onServerFunctionError;
