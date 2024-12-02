import config from "../config";

const { url } = config.datasources.datahub;
/**
 * Store an event in datahub
 */
export async function load(event, context) {
  // Only send events to datahub, when we are in production
  if (process.env.NODE_ENV === "production") {
    await context.fetch(
      `${url}/api/v1/app/${event?.context?.systemId}/sessionId/${event?.context?.sessionToken}/schema/${event?.kind}/event`,
      {
        method: "POST",
        body: JSON.stringify(event),
      }
    );
  } else {
    console.log("");
    console.log("EVENT START");
    console.log(event);
    console.log("EVENT END");
    console.log("");
  }
}
