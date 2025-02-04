import { log } from "dbc-node-logger";
import _ from "lodash";
import config from "./config";
import { datasources } from "./datasourceLoader";
import { status as redisStatus } from "./datasources/redis.datasource";
import { getStats } from "./utils/fetchWithLimit";
import { checkServicesStatus } from "./howru";
function jsonToPrometheus(data) {
  let output = [];

  // Global metrics
//   output.push(`# HELP system_ok Indicates if the system is operational`);
//   output.push(`# TYPE system_ok gauge`);
  output.push(`system_ok ${data.ok ? 1 : 0}`);

//   output.push(
//     `# HELP system_up_since The timestamp when the system was last started`
//   );
  //output.push(`# TYPE system_up_since gauge`);
  output.push(`system_up_since ${new Date(data.upSince).getTime() / 1000}`);

  // Services status
//   output.push(`# HELP service_ok Indicates if a service is operational`);
//   output.push(`# TYPE service_ok gauge`);
  data.services.forEach((service, index) => {
    //TODO: add a label for the service team? 

    index<1&&console.log('jsonToPrometheus.data.services.service',service.teamLabel);
    output.push(
      `service_ok{service="${service.service}", team="${service.teamLabel}"} ${service.ok ? 1 : 0}`

    );
  });

  // HTTP statistics
//   output.push(
//     `# HELP service_http_requests_total Total number of HTTP requests per service and status code`
//   );
//   output.push(`# TYPE service_http_requests_total counter`);
//   output.push(`# HELP service_errors_total Total number of errors per service`);
//   output.push(`# TYPE service_errors_total counter`);

  data.httpStats.forEach((service) => {
    Object.entries(service.status).forEach(([statusCode, count]) => {
      output.push(
        `service_http_requests_total{service="${service.service}",status="${statusCode}"} ${count}`
      );
    });

    output.push(
      `service_errors_total{service="${service.service}"} ${service.errors}`
    );
  });

  return output.join("\n");
}

// Create upSince timestamp
let upSince = new Date();

/**
 * Route handler for the howru endpoint
 *
 */
async function metrics(req, res) {
  // Call status function of every service
  const results = await checkServicesStatus();

  // Loop through service status check results, to determine if all is ok
  let ok = true;
  results.forEach((service) => {
    if (!service.ok) {
      ok = false;
      res.status(500);
    }
  });

  // loop through http stats and check if all is ok
  const httpStats = getStats().map((service) => ({
    ...service,
    ok: service.errors === service.prevErrors,
  }));

  httpStats.forEach((service) => {
    if (!service.ok) {
      ok = false;
      res.status(500);
    }
  });

  const body = {
    ok,
    upSince,
    services: results,
    httpStats,
  };

  res.send(jsonToPrometheus(body));
}

export default metrics;

