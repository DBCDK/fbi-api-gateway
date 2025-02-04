import { log } from "dbc-node-logger";
import _ from "lodash";
import config from "./config";
import { datasources } from "./datasourceLoader";
import { status as redisStatus } from "./datasources/redis.datasource";
import { getStats } from "./utils/fetchWithLimit";

// Create upSince timestamp
let upSince = new Date();

// Array of services to check
const services = [
  ...datasources
    .filter((datasource) => datasource.statusChecker)
    .map((datasource) => ({
      name: datasource.name,
      status: datasource.statusChecker,
      teamLabel: datasource.teamLabel,
    })),
  { name: "redis", status: redisStatus },
];

/**
 * Convert JSON to Prometheus format
 */
function jsonToPrometheus(data) {
  let output = [];
  output.push(`system_ok ${data.ok ? 1 : 0}`);
  output.push(`system_up_since ${new Date(data.upSince).getTime() / 1000}`);
  data.services.forEach((service) => {
    const team = service.teamLabel || "febib";
    output.push(
      `service_ok{service="${service.service}", team="${team}"} ${service.ok ? 1 : 0}`
    );
  });

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

/**
 * Returns a list of services and their status
 */
export async function checkServicesStatus() {
  return await Promise.all(
    services.map(async (service) => {
      let ok = false;
      let message;
      try {
        await service.status();
        ok = true;
      } catch (e) {
        message = (e.response && e.response.text) || e.message;
      }

      // Return result for the service
      return {
        service: service.name,
        ok,
        message,
        teamLabel: service?.teamLabel,
      };
    })
  );
}

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
