import createHash from "../utils/hash";

// TODO add descriptions of headers in our documentation
export function dataHubMiddleware(req, res, next) {
  async function getContext() {
    // The ID identifying the calling system (a smaug client id)
    const systemId = req?.smaug?.app?.clientId;

    // Indicates if the user accepted tracking via the cookie consent form
    const trackingConsentGiven = req.headers["x-tracking-consent"] === "true";

    // Visitor ID:
    // - Without tracking consent, the client app should use browser fingerprinting.
    // - With tracking consent, the client app should use a long lived cookie.
    const sessionToken = req.headers["x-session-token"];

    // User ID (only used if user is logged in and tracking consent is given):
    // - Uses the uniqueId from culr if available.
    // - Otherwise, a hashed userId (if userId exists).
    const userTokenBeforePseudo = trackingConsentGiven
      ? req.user?.uniqueId || req.user?.userId
      : null;

    // Trace ID passed from a previous FBI-API response.
    const causedBy = req.headers["x-caused-by"];

    let res = { systemId, sessionToken, causedBy: causedBy ? [causedBy] : [] };

    if (userTokenBeforePseudo) {
      res.userToken = (
        await req.datasources
          .getLoader("pseudonymizer")
          .load(userTokenBeforePseudo)
      )?.token;
    }

    return res;
  }

  async function createSearchEvent({ input, works }) {
    const context = await getContext();
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
      context,
      kind: "SEARCH",
      variables,
      result: {
        identifiers,
      },
    };

    req.datasources.getLoader("datahub").load(event);
  }

  async function createWorkEvent({ input = {}, work }) {
    const { id, faust, pid, oclc } = input;
    const context = await getContext();
    if (!context.sessionToken || !work) {
      return;
    }

    const variables = { id, faust, pid, oclc };
    const identifiers = [{ identifer: work?.workId, traceId: work?.traceId }];
    const event = {
      context,
      kind: "WORK",
      variables,
      result: {
        identifiers,
      },
    };

    req.datasources.getLoader("datahub").load(event);
  }

  async function createSuggestEvent({ input = {}, suggestions }) {
    const { q, suggestStypes } = input;
    const context = await getContext();
    if (!context.sessionToken) {
      return;
    }

    const variables = { q, suggestStypes };

    const event = {
      context,
      kind: "SUGGEST",
      variables,
      result: {
        suggestions: suggestions?.map((s) => ({
          term: s.term,
          type: s.type,
          traceId: s.traceId,
        })),
      },
    };

    req.datasources.getLoader("datahub").load(event);
  }

  async function createComplexSuggestEvent({ input = {}, suggestions }) {
    const { q, suggestStypes } = input;
    const context = await getContext();
    if (!context.sessionToken) {
      return;
    }

    const variables = { q, suggestStypes };

    const event = {
      context,
      kind: "COMPLEX_SEARCH_SUGGEST",
      variables,
      result: {
        suggestions: suggestions?.map((s) => ({
          term: s.term,
          type: s.type,
          traceId: s.traceId,
        })),
      },
    };

    req.datasources.getLoader("datahub").load(event);
  }

  req.dataHub = {
    createSearchEvent,
    createWorkEvent,
    createSuggestEvent,
    createComplexSuggestEvent,
  };

  next();
}
