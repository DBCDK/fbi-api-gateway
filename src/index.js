/**
 * Trying out GraphQL for record fetching
 * Using openplatform and a content-first recommender
 *
 */

/*
Example query:
{
  record(pid: "870970-basis:51020340") {
    title
    type
    creator {
      name
    }
    recommendations(limit: 2) {
      record {
        title
        creator {
          name
        }
        collection {
          type
        }
      }
      value
    }
  }
}
*/

const express = require('express');
const cors = require('cors');
const graphqlHTTP = require('express-graphql');
const {buildSchema} = require('graphql');
const request = require('superagent');
const access_token = '7fcb59a1fe4dfd66493795b98c0666999120c0de'; // to be deleted. anonymous token content-first

// Construct a schema, using GraphQL schema language
const schema = buildSchema(`
  type Query {
    record(pid: String!): Record!
  }
  type Record {
    pid: String!
    title: String!
    creator: Creator!
    type: String!
    collection: [Record!]!
    recommendations(limit: Int): [Recommendation!]!
    cover: Cover
  }
  type Creator {
    name: String!
  }
  type Recommendation {
    record: Record!
    value: Float
  }
  type Cover {
    url: String!
  }
`);
const recommendationsFetcher = async ({pid, limit = 10}) => {
  const response = await request
    .post('http://recompass-work-1-2.mi-prod.svc.cloud.dbc.dk/recompass-work')
    .send({
      likes: [pid],
      limit
    });
  return response.body;
};
const recordFetcher = async pid => {
  const response = await request
    .post('https://openplatform.dbc.dk/v3/work')
    .send({
      fields: ['title', 'collection', 'creator', 'type', 'coverUrlFull'],
      access_token,
      pids: [pid]
    });
  return response.body.data[0];
};
const recordResolver = async ({pid}) => {
  const record = await recordFetcher(pid);

  return {
    pid,
    title: () => {
      return record.title[0];
    },
    collection: () => {
      return record.collection.map(pid => recordResolver({pid}));
    },
    creator: () => {
      return {name: record.creator[0]};
    },
    type: () => {
      return record.type[0];
    },
    recommendations: async ({limit}) => {
      return (await recommendationsFetcher({pid, limit})).response.map(
        entry => {
          return {
            ...entry,
            record: recordResolver({pid: entry.pid})
          };
        }
      );
    },
    cover: () => {
      if (!record.coverUrlFull || !record.coverUrlFull[0]) {
        return null;
      }
      return {url: record.coverUrlFull[0]};
    }
  };
};

// The root provides a resolver function for each API endpoint
const root = {
  record: recordResolver
};
const port = process.env.PORT || 3000;
const app = express();
app.use(cors());
app.use(
  '/graphql',
  graphqlHTTP({
    schema: schema,
    rootValue: root,
    graphiql: true
  })
);
const server = app.listen(port);
console.log(`Running a GraphQL API server at http://localhost:${port}/graphql`);

const signals = {
  SIGINT: 2,
  SIGTERM: 15
};
function shutdown(signal, value) {
  server.close(function() {
    console.log('server stopped by ' + signal);
    process.exit(128 + value);
  });
}
Object.keys(signals).forEach(function(signal) {
  process.on(signal, function() {
    shutdown(signal, signals[signal]);
  });
});
