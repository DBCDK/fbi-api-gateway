import isbot from "isbot";
import { findAliasesAndArgs } from "../utils/graphQLQueryTools";
import { createTraceId } from "../utils/trace";
// import createHash from "../utils/hash";

function getDate() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

// TODO add descriptions of headers in our documentation
export function dataHubMiddleware(req, res, next) {
  const userAgent = req?.get?.("User-Agent");
  const isBot = isbot(userAgent);

  async function getContext() {
    if (isBot) {
      return null;
    }

    // The ID identifying the calling system (a smaug client id)
    const systemId = req?.smaug?.app?.clientId;

    // Indicates if the user accepted tracking via the cookie consent form
    const trackingConsentGiven = req.headers["x-tracking-consent"] === "true";

    // Visitor ID:
    // - Without tracking consent, the client app should use browser fingerprinting.
    // - With tracking consent, the client app should use a long lived cookie.
    const sessionToken = req.headers["x-session-token"];

    // A cookieless fingerprint identifying an end user
    const clientFingerprint = req.headers["x-client-fingerprint"] || "";

    // User ID (only used if user is logged in and tracking consent is given):
    // - Uses the uniqueId from culr if available.
    // - Otherwise, a hashed userId (if userId exists).
    const userTokenBeforePseudo = trackingConsentGiven
      ? req.user?.uniqueId || req.user?.userId
      : null;

    // Trace ID passed from a previous FBI-API response.
    const causedBy = req.headers["x-caused-by"];

    // const uniqueKey = createHash(req.accessToken);

    let res = {
      systemId,
      sessionToken,
      clientFingerprint,
      causedBy: causedBy ? [causedBy] : [],
      agency: req.profile?.agency,
      profile: req.profile?.name,
      // uniqueKey: uniqueKey,
    };

    if (userTokenBeforePseudo) {
      res.userToken = (
        await req.datasources
          .getLoader("pseudonymizer")
          .load(userTokenBeforePseudo)
      )?.token;
    }

    if (!sessionToken) {
      // If sessionToken was not sent as a header, we use todays date
      res.sessionToken = `unknown-${getDate()}`;
    }

    return res;
  }

  function shouldSendEvent(eventContext) {
    if (!eventContext?.sessionToken) {
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
      await req.datasources.getLoader("datahub").load(event);
    }
  }

  async function createMoodSearchEvent({ data, fieldInfo }) {
    const context = await getContext();
    if (!shouldSendEvent(context)) {
      return;
    }

    const event = {
      context,
      kind: "MOOD_DATA_SEARCH",
      variables: {},
      result: {},
    };
    if (fieldInfo["mood.moodSearch"]?.args) {
      event.variables = { ...fieldInfo["mood.moodSearch"].args };
    }
    if (fieldInfo?.["mood.moodSearch.works"]?.args?.offset) {
      event.variables.offset = fieldInfo["mood.moodSearch.works"].args.offset;
    }
    if (fieldInfo?.["mood.moodSearch.works"]?.args?.limit) {
      event.variables.limit = fieldInfo["mood.moodSearch.works"].args.limit;
    }

    if (data?.mood?.moodSearch?.works?.[0]?.workId) {
      event.result.identifiers = data.mood.moodSearch.works?.map((w) => ({
        identifier: w.workId,
        traceId: w.traceId || createTraceId(),
      }));
    }

    if (Object.keys(event.result).length > 0) {
      await req.datasources.getLoader("datahub").load(event);
    }
  }

  async function createMoodSearchKidsEvent({ data, fieldInfo }) {
    const context = await getContext();
    if (!shouldSendEvent(context)) {
      return;
    }

    const event = {
      context,
      kind: "MOOD_DATA_SEARCH_KIDS",
      variables: {},
      result: {},
    };
    if (fieldInfo["mood.moodSearchKids"]?.args) {
      event.variables = { ...fieldInfo["mood.moodSearchKids"].args };
    }
    if (fieldInfo?.["mood.moodSearchKids.works"]?.args?.offset) {
      event.variables.offset =
        fieldInfo["mood.moodSearchKids.works"].args.offset;
    }
    if (fieldInfo?.["mood.moodSearchKids.works"]?.args?.limit) {
      event.variables.limit = fieldInfo["mood.moodSearchKids.works"].args.limit;
    }

    if (data?.mood?.moodSearchKids?.works?.[0]?.workId) {
      event.result.identifiers = data.mood.moodSearchKids.works?.map((w) => ({
        identifier: w.workId,
        traceId: w.traceId || createTraceId(),
      }));
    }

    if (Object.keys(event.result).length > 0) {
      await req.datasources.getLoader("datahub").load(event);
    }
  }

  async function createMoodSuggestEvent({ data, fieldInfo }) {
    const context = await getContext();
    if (!shouldSendEvent(context) || !data?.mood?.moodSuggest?.response) {
      return;
    }

    const event = {
      context,
      kind: "MOOD_DATA_SUGGEST",
      variables: { q: fieldInfo["mood.moodSuggest"]?.args?.q },
      result: {
        suggestions: data?.mood?.moodSuggest?.response.map((s) => ({
          term: s.term,
          type: s.type,
          traceId: s.traceId || createTraceId(),
        })),
      },
    };

    await req.datasources.getLoader("datahub").load(event);
  }

  async function createMoodTagRecommendEvent({ data, fieldInfo }) {
    const context = await getContext();
    if (!shouldSendEvent(context) || !data?.mood?.moodTagRecommend) {
      return;
    }

    const event = {
      context,
      kind: "MOOD_DATA_RECOMMEND",
      variables: fieldInfo["mood.moodTagRecommend"]?.args,
      result: {
        identifiers: data?.mood?.moodTagRecommend?.map((entry) => ({
          identifier: entry?.work?.workId,
          traceId: entry?.work?.traceId || createTraceId(),
        })),
      },
    };

    await req.datasources.getLoader("datahub").load(event);
  }

  async function createMoodRecommendKidsEvent({ data, fieldInfo }) {
    const context = await getContext();
    if (!shouldSendEvent(context) || !data?.mood?.moodRecommendKids?.works) {
      return;
    }

    const event = {
      context,
      kind: "MOOD_DATA_RECOMMEND_KIDS",
      variables: fieldInfo["mood.moodRecommendKids"]?.args,
      result: {
        identifiers: data?.mood?.moodRecommendKids?.works?.map((entry) => ({
          identifier: entry?.workId,
          traceId: entry?.traceId || createTraceId(),
        })),
      },
    };

    if (fieldInfo?.["mood.moodRecommendKids.works"]?.args?.offset) {
      event.variables.offset =
        fieldInfo["mood.moodRecommendKids.works"].args.offset;
    }
    if (fieldInfo?.["mood.moodRecommendKids.works"]?.args?.limit) {
      event.variables.limit =
        fieldInfo["mood.moodRecommendKids.works"].args.limit;
    }

    await req.datasources.getLoader("datahub").load(event);
  }

  async function createMoodWorkRecommendEvent({ data, fieldInfo }) {
    const context = await getContext();
    if (!shouldSendEvent(context) || !data?.mood?.moodWorkRecommend) {
      return;
    }

    const event = {
      context,
      kind: "MOOD_DATA_RECOMMEND",
      variables: fieldInfo["mood.moodWorkRecommend"]?.args,
      result: {
        identifiers: data?.mood?.moodWorkRecommend?.map((entry) => ({
          identifier: entry?.work?.workId,
          traceId: entry?.work?.traceId || createTraceId(),
        })),
      },
    };

    await req.datasources.getLoader("datahub").load(event);
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

    await req.datasources.getLoader("datahub").load(event);
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

    await req.datasources.getLoader("datahub").load(event);
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

    await req.datasources.getLoader("datahub").load(event);
  }

  async function createSuggestEvent({ data, fieldInfo }) {
    const context = await getContext();
    if (!shouldSendEvent(context)) {
      return;
    }

    const variables = { ...fieldInfo?.suggest?.args };

    const event = {
      context,
      kind: "SUGGEST",
      variables,
      result: {
        suggestions: data?.suggest?.result?.map((s) => ({
          term: s.term,
          type: s.type,
          traceId: s.traceId || createTraceId(),
        })),
      },
    };

    await req.datasources.getLoader("datahub").load(event);
  }

  async function createRecommendEvent({ data, fieldInfo }) {
    const context = await getContext();
    if (!shouldSendEvent(context)) {
      return;
    }

    const variables = { ...fieldInfo?.recommend?.args };

    const event = {
      context,
      kind: "RECOMMEND",
      variables,
      result: {
        identifiers: data?.recommend?.result?.map((r) => ({
          identifier: r?.work?.workId,
          traceId: r?.work?.traceId || createTraceId(),
        })),
      },
    };

    await req.datasources.getLoader("datahub").load(event);
  }

  async function createRelatedSubjectsEvent({ data, fieldInfo }) {
    const context = await getContext();
    if (!shouldSendEvent(context)) {
      return;
    }

    const variables = { ...fieldInfo?.["recommendations.subjects"]?.args };

    const event = {
      context,
      kind: "RELATED_SUBJECTS",
      variables,
      result: {
        relatedSubjects: data?.recommendations?.subjects?.map((entry) => ({
          subject: entry?.subject,
          traceId: entry?.traceId || createTraceId(),
        })),
      },
    };

    await req.datasources.getLoader("datahub").load(event);
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

    await req.datasources.getLoader("datahub").load(event);
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

    await req.datasources.getLoader("datahub").load(event);
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

    await req.datasources.getLoader("datahub").load(event);
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
      includeFilteredPids: input?.includeFilteredPids || false,
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

    await req.datasources.getLoader("datahub").load(event);
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
            traceId: work.traceId,
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

    await req.datasources.getLoader("datahub").load(event);
  }

  if (!req.onOperationComplete) {
    req.onOperationComplete = [];
  }

  // Observe  the actual data that is sent to client
  req.onOperationComplete.push(async (data, variables, query) => {
    if (data?.search) {
      await createSearchEvent({
        data,
        fieldInfo: findAliasesAndArgs(query, variables),
      });
    }
    if (data?.suggest) {
      await createSuggestEvent({
        data,
        fieldInfo: findAliasesAndArgs(query, variables),
      });
    }

    if (data?.mood?.moodSearch) {
      await createMoodSearchEvent({
        data,
        fieldInfo: findAliasesAndArgs(query, variables),
      });
    }

    if (data?.mood?.moodSuggest) {
      await createMoodSuggestEvent({
        data,
        fieldInfo: findAliasesAndArgs(query, variables),
      });
    }

    if (data?.mood?.moodTagRecommend) {
      await createMoodTagRecommendEvent({
        data,
        fieldInfo: findAliasesAndArgs(query, variables),
      });
    }

    if (data?.mood?.moodWorkRecommend) {
      await createMoodWorkRecommendEvent({
        data,
        fieldInfo: findAliasesAndArgs(query, variables),
      });
    }

    if (data?.mood?.moodSearchKids) {
      await createMoodSearchKidsEvent({
        data,
        fieldInfo: findAliasesAndArgs(query, variables),
      });
    }

    if (data?.mood?.moodRecommendKids) {
      await createMoodRecommendKidsEvent({
        data,
        fieldInfo: findAliasesAndArgs(query, variables),
      });
    }

    if (data?.recommend) {
      await createRecommendEvent({
        data,
        fieldInfo: findAliasesAndArgs(query, variables),
      });
    }

    if (data?.recommendations?.subjects) {
      await createRelatedSubjectsEvent({
        data,
        fieldInfo: findAliasesAndArgs(query, variables),
      });
    }
  });

  req.dataHub = {
    createWorkEvent,
    createManifestationEvent,
    createComplexSuggestEvent,
    createSubmitOrderEvent,
    createSeriesEvent,
    createUniverseEvent,
    createComplexSearchEvent,
    createInspirationEvent,
  };

  next();
}
