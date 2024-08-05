import fetch from "isomorphic-unfetch";
import request from "superagent";
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
 * Handle elasticSearch endpoint req and res
 */
export default async function handler(req, res) {
  const token = req.headers.authorization?.replace(/bearer /i, "");

  if (!token) {
    // Missing token -> throw bad request
    return res.status(400).send({});
  }

  const smaug_response = await getConfiguration(token);

  switch (smaug_response.status) {
    case 200:
      const smaug_data = await smaug_response.json();

      const body = JSON.parse(req.body);

      const options = body.options;

      const profile = options.profile && body.profile;
      const clientId = options.client && smaug_data.app?.clientId;
      const agencyId = options.agency && smaug_data.agencyId;

      const days = 30;

      const end = new Date();
      end.setUTCHours(0, 0, 0, 0);
      const start = new Date(end);
      start.setDate(end.getDate() - days);

      const elastic_response = await getElasticSearchLog({
        start: start.toISOString(),
        end: end.toISOString(),
        q: body.q,
        clientId,
        agencyId,
        profile,
      });

      const hit = elastic_response.hits.hits[0];
      const hasHit = !!hit;

      if (!hasHit) {
        return res.status(200).send({
          hasMatch: hasHit,
          debug: {
            didTimeout: elastic_response.timed_out,
            totalMs: elastic_response.took,
          },
        });
      }

      const source = hit?._source;

      const result = {
        debug: {
          didTimeout: elastic_response.timed_out,
          totalMs: elastic_response.took,
        },
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
