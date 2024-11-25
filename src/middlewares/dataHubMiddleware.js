import createHash from "../utils/hash";

// TODO add descriptions of headers in our documentation
export function dataHubMiddleware(req, res, next) {
  function getContext() {
    // The ID identifying the calling system (a smaug client id)
    const systemId = req?.smaug?.app?.clientId;

    // Indicates if the user accepted tracking via the cookie consent form
    const trackingConsentGiven = req.headers["x-tracking-consent"] === "true";

    // Visitor ID:
    // - Without tracking consent, the client app should use browser fingerprinting.
    // - With tracking consent, the client app should use a long lived cookie.
    const sessionToken = req.headers["x-visitor-id"];

    // User ID (only used if user is logged in and tracking consent is given):
    // - Uses the uniqueId from culr if available.
    // - Otherwise, a hashed userId (if userId exists).
    const userToken = trackingConsentGiven
      ? context.user?.uniqueId ||
        (context.user?.userId ? createHash(context.user?.userId) : null)
      : null;

    // Trace ID passed from a previous FBI-API response.
    const causedBy = req.headers["x-parent-trace-id"];

    return {
      systemId,
      sessionToken,
      causedBy: causedBy ? [causedBy] : [],
      userToken,
    };
  }

  function createSearchEvent({ input, works }) {
    const context = getContext();

    if (!context.sessionToken) {
      // We cant send this event, since sessionToken is required
      return;
    }

    const variables = {
      q: input?.q,
      offset: input?.offset,
      limit: input?.limit,
    };
    const identifiers = works?.map((w) => ({
      identifier: w.workId,
      traceId: w.traceId,
    }));
    const event = {
      kind: "SEARCH",
      variables,
      result: {
        identifiers,
      },
    };

    req.datasources.getLoader("datahub").load(event);
  }

  req.dataHub = { createSearchEvent };

  next();
}
