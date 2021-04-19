import request from "superagent";
import config from "../config";
import { withRedis } from "./redis.datasource";
import displayFormat from "./openformat.displayformat.json";
import monitor from "../utils/monitor";

const { url, ttl, prefix } = config.datasources.openformat;

function createRequest(pid) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<SOAP-ENV:Envelope xmlns:SOAP-ENV="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ns1="http://oss.dbc.dk/ns/openformat" xmlns:os="http://oss.dbc.dk/ns/opensearch" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dkabm="http://biblstandard.dk/abm/namespace/dkabm/" xmlns:ISO639-2="http://lcweb.loc.gov/standards/iso639-2/" xmlns:dcmitype="http://purl.org/dc/dcmitype/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:ac="http://biblstandard.dk/ac/namespace/" xmlns:dkdcplus="http://biblstandard.dk/abm/namespace/dkdcplus/" xmlns:oss="http://oss.dbc.dk/ns/osstypes" xmlns:marcx="info:lc/xmlns/marcxchange-v1" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
    <SOAP-ENV:Body>
        <ns1:formatObjectRequest>
            <ns1:pid>${pid}</ns1:pid>
            <ns1:outputFormat>
              ${JSON.stringify(displayFormat)}
            </ns1:outputFormat>
            <ns1:outputType>
                json
            </ns1:outputType>
        </ns1:formatObjectRequest>
    </SOAP-ENV:Body>
</SOAP-ENV:Envelope>`;
}

async function fetchManifestation({ pid }) {
  return (await request.post(url).field("xml", createRequest(pid))).body
    .formatResponse.customDisplay[0].manifestation;
}

// fetchManifestation monitored
const monitored = monitor(
  { name: "REQUEST_openformat", help: "openformat requests" },
  fetchManifestation
);

/**
 * The status function
 *
 * @throws Will throw error if service is down
 */
export async function status() {
  await fetchManifestation({ pid: "870970-basis:51877330" });
}

/**
 * A DataLoader batch function
 *
 * Could possibly be optimised to fetch all pids in a single
 * openformat request.
 *
 * @param {Array.<string>} keys The keys to fetch
 */
async function batchLoader(keys) {
  return await Promise.all(
    keys.map(async (key) => await monitored({ pid: key }))
  );
}

/**
 * Enhance batch function with Redis caching
 */
export default withRedis(batchLoader, {
  prefix,
  ttl,
});
