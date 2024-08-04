import { log } from "dbc-node-logger";
import request from "superagent";
import config from "../config";

const { user, password, url, prefix } = config.datasources.elk;

// https://kibana.dbc.dk/app/kibana#/discover?_g=(filters:!(),refreshInterval:(pause:!t,value:0),time:(from:now-15m,to:now))&_a=(columns:!(parsedQuery,clientId,profile.combined),filters:!(('$state':(store:appState),exists:(field:parsedQuery.keyword),meta:(alias:!n,disabled:!f,index:'8a5a6670-94f6-11ee-9938-753d08cf4a51',key:parsedQuery.keyword,negate:!f,type:exists,value:exists)),('$state':(store:appState),meta:(alias:!n,disabled:!f,index:'8a5a6670-94f6-11ee-9938-753d08cf4a51',key:sys_kubernetes.labels.app.keyword,negate:!f,params:(query:fbi-api-gateway),type:phrase),query:(match_phrase:(sys_kubernetes.labels.app.keyword:fbi-api-gateway)))),index:'8a5a6670-94f6-11ee-9938-753d08cf4a51',interval:auto,query:(language:lucene,query:''),sort:!(!('@timestamp',desc)))

/**
 * Fetches stats from elastic search
 * @param {Object} params
 * @param {string} params.start start time
 * @param {string} params.end end time
 */
export async function load({ start, end, q, clientId, agencyId, profile }) {
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

  console.log("rrrrrrrrrrrrrrrrrrrrr", JSON.stringify(req, null, 2));

  return (await request.post(url).auth(user, password).send(req)).body;
}

export const options = {
  redis: {
    prefix,
    ttl: 60 * 60 * 24,
  },
};
