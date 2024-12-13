import isbot from "isbot";
import { findAliasesAndArgs } from "../utils/graphQLQueryTools";
import { createTraceId } from "../utils/trace";

// TODO add descriptions of headers in our documentation
export function dataHubMiddleware(req, res, next) {
  const userAgent = req?.get?.("User-Agent");
  const isBot = isbot(userAgent);

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

    if (!sessionToken && req?.accessToken) {
      // If sessionToken was not sent as a header, we use a pseudonymized accessToken
      res.sessionToken = (
        await req.datasources.getLoader("pseudonymizer").load(req.accessToken)
      )?.token;
    }

    return res;
  }

  function shouldSendEvent(eventContext) {
    if (!eventContext.sessionToken) {
      return false;
    }
    if (isBot) {
      return false;
    }
    return true;
  }

  async function createSearchEvent({ data, fieldInfo }) {
    const context = await getContext();
    if (!shouldSendEvent(context)) {
      return;
    }

    const event = {
      context,
      kind: "SEARCH",
      variables: {},
      result: {},
    };
    if (fieldInfo?.search?.args) {
      event.variables = fieldInfo?.search?.args;
    }
    if (fieldInfo?.["search.works"]?.args?.offset) {
      event.variables.offset = fieldInfo["search.works"].args.offset;
    }
    if (fieldInfo?.["search.works"]?.args?.limit) {
      event.variables.limit = fieldInfo["search.works"].args.limit;
    }
    if (data?.search?.didYouMean) {
      event.result.didYouMean = data.search.didYouMean.map((suggestion) => {
        return {
          query: suggestion.query,
          score: suggestion.score,
          traceId: suggestion.traceId || createTraceId(),
        };
      });
    }
    if (data?.search?.intelligentFacets) {
      event.result.intelligentFacets = data?.search?.intelligentFacets?.map(
        (facet) => {
          return {
            name: facet.name,
            values: facet.values?.map((val) => ({
              key: val.key,
              term: val.term,
              score: val.score,
              traceId: val.traceId || createTraceId(),
            })),
          };
        }
      );
    }

    if (data?.search?.works?.[0]?.workId) {
      event.result.identifiers = data.search.works?.map((w) => ({
        identifier: w.workId,
        traceId: w.traceId || createTraceId(),
      }));
    }

    if (Array.isArray(data?.search?.facets)) {
      event.result.facets = data.search.facets.map((facet) => {
        return {
          name: facet?.name,
          values: facet?.values?.map((val) => ({
            key: val.key,
            term: val.term,
            score: val.count,
            traceId: val.traceId || createTraceId(),
          })),
        };
      });
    }

    if (Object.keys(event.result).length > 0) {
      req.datasources.getLoader("datahub").load(event);
    }
  }

  async function createWorkEvent({ input = {}, work }) {
    const { id, faust, pid, oclc } = input;
    const context = await getContext();
    if (!shouldSendEvent(context) || !work) {
      return;
    }

    const variables = { id, faust, pid, oclc };
    const identifiers = [{ identifier: work?.workId, traceId: work?.traceId }];
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

  async function createSeriesEvent({ input = {}, result }) {
    const { seriesId } = input;
    const context = await getContext();
    if (!shouldSendEvent(context) || !result) {
      return;
    }

    const identifiers = result?.map((identifier) => ({
      identifier: identifier?.work?.workId,
      traceId: identifier?.work?.traceId,
    }));
    const variables = { seriesId };

    const event = {
      context,
      kind: "SERIES",
      variables,
      result: {
        identifiers,
      },
    };

    req.datasources.getLoader("datahub").load(event);
  }

  async function createManifestationEvent({ input = {}, manifestation }) {
    const { faust, pid } = input;
    const context = await getContext();
    if (!shouldSendEvent(context) || !manifestation) {
      return;
    }

    const variables = { faust, pid };
    const identifiers = [
      { identifier: manifestation?.pid, traceId: manifestation?.traceId },
    ];
    const event = {
      context,
      kind: "MANIFESTATION",
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
    if (!shouldSendEvent(context) || !suggestions) {
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
    if (!shouldSendEvent(context) || !suggestions) {
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

  async function createSubmitOrderEvent({ input = {}, order }) {
    const context = await getContext();
    if (!shouldSendEvent(context)) {
      return;
    }

    const event = {
      kind: "SUBMIT_ORDER",
      context,
      variables: {
        input: {
          pids: input?.pids,
          pickUpBranch: input?.pickUpBranch,
        },
      },
      result: {
        submitOrder: {
          status: order?.status,
          orderId: order?.orderId,
        },
      },
    };

    req.datasources.getLoader("datahub").load(event);
  }
  async function createUniverseEvent({ input = {} }) {
    const { universeId, identifiers } = input;
    const context = await getContext();

    if (!shouldSendEvent(context)) {
      return;
    }

    const event = {
      context,
      kind: "UNIVERSE",
      variables: { universeId },
      result: {
        identifiers: identifiers,
      },
    };

    req.datasources.getLoader("datahub").load(event);
  }

  //also used to send facet event
  async function createComplexSearchEvent({
    input = {},
    result = { facets: [], works: [] },
  }) {
    const context = await getContext();
    if (!shouldSendEvent(context)) {
      return;
    }
    const variables = {
      cql: input?.cql,
      filters: input?.filters,
      facets: input?.facets,
      offset: input?.offset || 0,
      limit: input?.limit || 10,
      sort: input?.sort,
    };

    const identifiers = result?.works?.map((w) => ({
      identifier: w?.workId,
      traceId: w?.traceId,
    }));

    const facets = result?.facets?.map((facet) => ({
      name: facet?.name,
      values: facet?.values?.map((value) => ({
        key: value.key,
        score: value.score,
        traceId: value.traceId,
      })),
    }));

    const event = {
      context,
      kind: "COMPLEX_SEARCH",
      variables,
      result: {
        identifiers,
        facets,
      },
    };

    req.datasources.getLoader("datahub").load(event);
  }

  async function createInspirationEvent({ input = {}, result = {} }) {
    const context = await getContext();
    if (!shouldSendEvent(context)) {
      return;
    }

    const variables = {
      limit: input.limit || 10,
      filters: input.filter?.map(({ category, subCategories }) => ({
        category,
        subCategories,
      })),
    };

    const inspiration = {
      categories: result.data.map((category) => ({
        title: category.category,
        subCategories: category.subCategories.map((sub) => ({
          title: sub.title,
          identifiers: sub.result.map((work) => ({
            identifier: work.work,
            traceId: work.traceId
          })),
        })),
      })),
    };

    const event = {
      context,
      kind: "INSPIRATION",
      variables,
      result: { inspiration },
    };

    req.datasources.getLoader("datahub").load(event);
  }

  if (!req.onOperationComplete) {
    req.onOperationComplete = [];
  }

  const FIELD_FUNC_MAP = {
    search: createSearchEvent,
  };

  // Observe  the actual data that is sent to client
  req.onOperationComplete.push((data, variables, query) => {
    // holds info about fields that recieve arguments
    let fieldInfo;

    // Check each root field, and call a corresponding function
    // (if it is available in FIELD_FUNC_MAP)
    Object.keys(data).forEach((field) => {
      if (FIELD_FUNC_MAP[field]) {
        if (!fieldInfo) {
          fieldInfo = findAliasesAndArgs(query, variables);
        }
        FIELD_FUNC_MAP[field]({ data, fieldInfo });
      }
    });
  });

  req.dataHub = {
    createWorkEvent,
    createManifestationEvent,
    createSuggestEvent,
    createComplexSuggestEvent,
    createSubmitOrderEvent,
    createSeriesEvent,
    createUniverseEvent,
    createComplexSearchEvent,
    createInspirationEvent,
  };

  next();
}
