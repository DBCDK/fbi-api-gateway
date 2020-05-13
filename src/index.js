/**
 * Trying out GraphQL for record fetching
 * Using openformat and a content-first recommender
 *
 */

/*
Example query:
{
  manifestation(pid: "870970-basis:47619912") {
    pid
    title
    materialType
    creators {
      name
    }
    recommendations(limit: 2) {
      manifestation {
        title
      }
      value
    }
    materialType
  }
}
*/
import schema from './schema/schema';
import openformatDS from './datasources/openformat.datasource';
import recommendationsDS from './datasources/recommendations.datasource';
import idmapperDS from './datasources/idmapper';
import moreinfoDS from './datasources/moreinfo';
import express from 'express';
import cors from 'cors';
import graphqlHTTP from 'express-graphql';
const port = process.env.PORT || 3000;
const app = express();
let server;

(async () => {
  app.use(cors());

  // set up context
  app.use((req, res, next) => {
    // user authentication could be done here

    req.datasources = {
      openformat: openformatDS,
      recommendations: recommendationsDS,
      idmapper: idmapperDS,
      moreinfo: moreinfoDS
    };
    next();
  });

  app.use(
    '/graphql',
    graphqlHTTP({
      schema: await schema(),
      graphiql: true
    })
  );
  server = app.listen(port);
  console.log(
    `Running a GraphQL API server at http://localhost:${port}/graphql`
  );
})();

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
