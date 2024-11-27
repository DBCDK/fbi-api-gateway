import config from "../config";

const { url } = config.datasources.datahub;
/**
 * Store an event in datahub
 */
export async function load(event, context) {
  await context.fetch(
    `${url}/api/v1/app/${event?.context?.systemId}/sessionId/${event?.context?.sessionToken}/schema/${event?.kind}/event`,
    {
      method: "POST",
      body: JSON.stringify(event),
    }
  );
}
