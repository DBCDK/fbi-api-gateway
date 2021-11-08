import request from "superagent";
import config from "../config";

const { url, ttl, prefix } = config.datasources.holdingstatus;

/**
 * Constructs soap request to perform holdings request
 * @param {array} parameters
 * @returns {string} soap request string
 */
function constructSoap(pids) {
  const soappids = pids.map((pid) => `<ns1:pid>${pid}</ns1:pid>`).join("");

  let soap = `<?xml version="1.0" encoding="UTF-8"?>
  <SOAP-ENV:Envelope xmlns:SOAP-ENV="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ns1="http://oss.dbc.dk/ns/openholdingstatus"><SOAP-ENV:Body>
    <ns1:localisationsRequest>
        <ns1:agencyId>DK-870970</ns1:agencyId>
        ${soappids}
        <ns1:outputType>json</ns1:outputType>
        <ns1:mergePids>true</ns1:mergePids>
    </ns1:localisationsRequest>
  </SOAP-ENV:Body></SOAP-ENV:Envelope>`;

  return soap;
}

function parseResponse(text) {
  const obj = JSON.parse(text);
  const count =
    (obj.localisationsResponse &&
      obj.localisationsResponse.localisations[0] &&
      obj.localisationsResponse.localisations[0].agency &&
      obj.localisationsResponse.localisations[0].agency.length) ||
    0;

  if (count > 0) {
    const holdingItems = obj.localisationsResponse.localisations[0].agency.map(
      (item) => {
        const holdingsItem = {};
        for (const [key, value] of Object.entries(item)) {
          holdingsItem[key] = value.$;
        }
        return holdingsItem;
      }
    );
    return { count: count, holdingItems: holdingItems };
  } else {
    return { count: count };
  }
}

export async function load({ pids }) {
  const soap = constructSoap(pids);

  const res = await request
    .post(url)
    .set("Content-Type", "text/xml")
    .send(soap);

  return parseResponse(res.text);
}

export const options = {
  redis: {
    prefix,
    ttl,
    staleWhileRevalidate: 60 * 60, // 1 hour
  },
};
