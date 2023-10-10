import request from "superagent";
import config from "../config";

const { url, ttl } = config.datasources.openformat;

function createRequest(pid) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<SOAP-ENV:Envelope xmlns:SOAP-ENV="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ns1="http://oss.dbc.dk/ns/openformat" xmlns:os="http://oss.dbc.dk/ns/opensearch" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dkabm="http://biblstandard.dk/abm/namespace/dkabm/" xmlns:ISO639-2="http://lcweb.loc.gov/standards/iso639-2/" xmlns:dcmitype="http://purl.org/dc/dcmitype/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:ac="http://biblstandard.dk/ac/namespace/" xmlns:dkdcplus="http://biblstandard.dk/abm/namespace/dkdcplus/" xmlns:oss="http://oss.dbc.dk/ns/osstypes" xmlns:marcx="info:lc/xmlns/marcxchange-v1" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
    <SOAP-ENV:Body>
        <ns1:formatObjectRequest>
            <ns1:pid>${pid}</ns1:pid>
            <ns1:outputFormat>
              ris
            </ns1:outputFormat>
            <ns1:outputType>
                json
            </ns1:outputType>
        </ns1:formatObjectRequest>
    </SOAP-ENV:Body>
</SOAP-ENV:Envelope>`;
}

function parseResponse(response) {
  return response?.formatResponse?.ris[0]?.$ || "ERROR";
}

export async function load({ pid }) {
  const response = (await request.post(url).field("xml", createRequest(pid)))
    .body;
  return parseResponse(response);
}

export const options = {
  redis: {
    prefix: "ris-1",
    ttl,
    staleWhileRevalidate: 60 * 60 * 24 * 30, // 30 days
  },
};
