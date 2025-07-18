import config from "../config";

const { user, password, url, prefix, teamLabel } = config.datasources.elk;

/**
 * Fetches stats from elastic search
 * @param {Object} params
 * @param {string} params.start start time
 * @param {string} params.end end time
 * @param {Object} context
 */
export async function load({ start, end }, context) {
  const authHeader = `Basic ${Buffer.from(`${user}:${password}`).toString("base64")}`;

  const response = await context.fetch(url, {
    method: "POST",
    headers: {
      Authorization: authHeader,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      aggs: {
        2: {
          terms: {
            field: "parsedQuery.keyword",
            order: {
              _key: "desc",
            },
            size: 100,
          },
          aggs: {
            3: {
              terms: {
                field: "profile.combined.keyword",
                order: {
                  _count: "desc",
                },
                size: 100,
              },
            },
          },
        },
      },
      size: 0,
      stored_fields: ["*"],
      script_fields: {},
      docvalue_fields: [
        {
          field: "@timestamp",
          format: "date_time",
        },
        {
          field: "alerts.time",
          format: "date_time",
        },
        {
          field: "params.expires",
          format: "date_time",
        },
        {
          field: "request.query.expires",
          format: "date_time",
        },
        {
          field: "response.data.lastUpdated",
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
        {
          field: "upSince",
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
              match_all: {},
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
    }),
  });

  return response.body;
}

export const options = {
  redis: {
    prefix,
    ttl: 60 * 60 * 24,
  },
};

export { teamLabel };
