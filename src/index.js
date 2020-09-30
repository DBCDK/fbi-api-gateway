/**
 * @file Setting up a GraphQL server using Express
 *
 */
import { log } from "dbc-node-logger";
import schema from "./schema/schema";
import workLoader from "./datasources/work.datasource";
import openformatLoader from "./datasources/openformat.datasource";
import recommendationsLoader from "./datasources/recommendations.datasource";
import idmapperLoader from "./datasources/idmapper.datasource";
import moreinfoLoader from "./datasources/moreinfo.datasource";
import express from "express";
import cors from "cors";
import graphqlHTTP from "express-graphql";
import DataLoader from "dataloader";
import config from "./config";
import howruHandler from "./howru";

const app = express();
let server;

(async () => {
  app.use(cors());

  // set up context per request
  app.use((req, res, next) => {
    // user authentication could be done here

    req.datasources = {
      openformat: new DataLoader(openformatLoader),
      recommendations: new DataLoader(recommendationsLoader, {
        // the key of recommendation batchloader is an object
        // hence we stringify
        cacheKeyFn: key => JSON.stringify(key)
      }),
      idmapper: new DataLoader(idmapperLoader),
      moreinfo: new DataLoader(moreinfoLoader),
      workservice: new DataLoader(workLoader)
    };

    next();
  });

  // Setup route handler for GraphQL
  app.use(
    "/graphql",
    graphqlHTTP({
      schema: await schema(),
      graphiql: true
    })
  );

  // Setup route handler for howru
  app.get("/howru", howruHandler);

  server = app.listen(config.port);
  log.info(`Running GraphQL API at http://localhost:${config.port}/graphql`);
})();

const signals = {
  SIGINT: 2,
  SIGTERM: 15
};
function shutdown(signal, value) {
  server.close(function() {
    log.info(`server stopped by ${signal}`);
    process.exit(128 + value);
  });
}
Object.keys(signals).forEach(function(signal) {
  process.on(signal, function() {
    shutdown(signal, signals[signal]);
  });
});
