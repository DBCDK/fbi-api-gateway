import fetch from "isomorphic-unfetch";
import request from "superagent";
import _permissions from "../../../../src/permissions.json";
import config from "../../../../src/config.js";

/**
 * remote smaug api call
 */
async function getElasticSearchLog({
  start,
  end,
  q,
  clientId,
  agencyId,
  profile,
}) {
  const { user, password, url } = config.datasources.elk;

  const req = {
    version: true,
    size: 1,
    sort: [
      {
        "@timestamp": {
          order: "desc",
          unmapped_type: "boolean",
        },
      },
    ],
    aggs: {
      2: {
        date_histogram: {
          field: "timestamp",
          fixed_interval: "3h",
          time_zone: "Europe/Copenhagen",
          min_doc_count: 1,
        },
      },
    },
    stored_fields: ["*"],
    script_fields: {},
    docvalue_fields: [
      {
        field: "@timestamp",
        format: "date_time",
      },
      {
        field: "howruStatus.upSince",
        format: "date_time",
      },
      {
        field: "time.end",
        format: "date_time",
      },
      {
        field: "time.start",
        format: "date_time",
      },
      {
        field: "timestamp",
        format: "date_time",
      },
    ],
    _source: {
      excludes: [],
    },
    query: {
      bool: {
        must: [],
        filter: [
          {
            bool: {
              should: [
                {
                  query_string: {
                    fields: ["parsedQuery.keyword"],
                    query: `*${q}*`,
                  },
                },
              ],
              minimum_should_match: 1,
            },
          },
          {
            exists: {
              field: "parsedQuery.keyword",
            },
          },
          {
            match_phrase: {
              "sys_kubernetes.labels.app.keyword": "fbi-api-gateway",
            },
          },
          {
            range: {
              timestamp: {
                gte: start,
                lte: end,
                format: "strict_date_optional_time",
              },
            },
          },
        ],
        should: [],
        must_not: [],
      },
    },
  };

  if (clientId) {
    req.query.bool.filter.push({
      match_phrase: {
        "clientId.keyword": clientId,
      },
    });
  }

  if (agencyId) {
    req.query.bool.filter.push({
      match_phrase: {
        "profile.agency.keyword": agencyId,
      },
    });
  }

  if (profile) {
    req.query.bool.filter.push({
      match_phrase: {
        "profile.name.keyword": profile,
      },
    });
  }
  console.log("prooooooooooops", {
    start,
    end,
    q,
    clientId,
    agencyId,
    profile,
  });
  console.log("rrrrrrrrrreq", req.query.bool.filter);

  return (await request.post(url).auth(user, password).send(req)).body;
}

/**
 * remote smaug api call
 */
async function getConfiguration(token) {
  const url = config.datasources.smaug.url;
  return await fetch(`${url}/configuration?token=${token}`, {
    method: "GET",
  });
}

/**
 * Handle smaug endpoint req and res
 */
export default async function handler(req, res) {
  const token = req.query.token;

  if (!token) {
    // Missing token -> throw bad request
    return res.status(400).send({});
  }

  const smaug_response = await getConfiguration(token);

  switch (smaug_response.status) {
    case 200:
      const smaug_data = await smaug_response.json();

      const days = args?.options?.days || 1;

      const end = new Date();
      end.setUTCHours(0, 0, 0, 0);
      const start = new Date(end);
      start.setDate(end.getDate() - days);

      const elastic_response = await getElasticSearchLog(token);

      const res = await context.datasources.getLoader("elastic").load({
        start: start.toISOString(),
        end: end.toISOString(),
        clientId: args?.options?.clientId,
        agencyId: args?.options?.agencyId,
        profile: args?.options?.profile,
        q: args?.options?.q,
      });

      const hit = res.hits.hits[0];
      const hasHit = !!hit;

      if (!hasHit) {
        return {
          hasMatch: hasHit,
          debug: { didTimeout: res.timed_out, totalMs: res.took },
        };
      }

      const source = hit?._source;

      const result = {
        debug: { didTimeout: res.timed_out, totalMs: res.took },
        hasMatch: hasHit,
        timestamp: source.timestamp,
        parsedQuery: source.parsedQuery,
        queryVariables: JSON.stringify(source.queryVariables),
        opeartionName: source.operationName,
        profile: source.profile?.name,
        agencyId: source.profile?.agency,
      };

      return res.status(200).send(result);
    default:
      return res.status(smaug_response.status).send({});
  }
}
