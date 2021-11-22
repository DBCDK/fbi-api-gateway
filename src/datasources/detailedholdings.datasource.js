import request from "superagent";
import config from "../config";

const { url, prefix } = config.datasources.holdingstatus;

/**
 * Constructs soap request to perform holdings request
 * @param {array} parameters
 * @returns {string} soap request string
 */
function constructSoap(localIds, agencyId) {
  console.log(localIds, "LOCALIDS");

  const lookupRecords = localIds
    .map(
      (localId) =>
        `<open:lookupRecord>
            <open:responderId>${agencyId}</open:responderId>
            <open:bibliographicRecordId>${localId}</open:bibliographicRecordId>
         </open:lookupRecord>`
    )
    .join("");

  let soap = `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:open="http://oss.dbc.dk/ns/openholdingstatus">
   <soapenv:Header/>
   <soapenv:Body>
      <open:holdingsRequest>
         ${lookupRecords}
         <open:outputType>json</open:outputType>
      </open:holdingsRequest>
   </soapenv:Body>
</soapenv:Envelope>
`;

  console.log(soap, "SAOP");
  return soap;
}

function parseResponse(text, agencyId) {
  const obj = JSON.parse(text);
  // catch errors
  if (obj.holdingsResponse.error) {
    // red lamp - @TODO set message and lamp
    const localholding = [
      {
        localholdingsId: "none",
        willLend: "false",
        expectedDelivery: "never",
      },
    ];
    return { count: 0, branchId: branch, holdingstatus: localholding };
  }

  const responders = obj.holdingsResponse.responder;
  const localholdings = [];
  for (const [key, value] of Object.entries(responders)) {
    localholdings.push({
      localHoldingsId: (value.localHoldingsId && value.localHoldingsId.$) || "",
      willLend: (value.willLend && value.willLend.$) || "",
      expectedDelivery:
        (value.expectedDelivery && value.expectedDelivery.$) || "",
    });
  }

  return {
    count: responders.length,
    branchId: agencyId,
    holdingstatus: localholdings,
  };
}

export async function load({ localIds, agencyId }) {
  const soap = constructSoap(localIds, agencyId);

  try {
    const res = await request
      .post(url)
      .set("Content-Type", "text/xml")
      .send(soap);

    return parseResponse(res.text, agencyId);
  } catch (e) {
    console.log("ERROR");
    console.log(e);
  }
}

export const options = {
  redis: {
    prefix,
    ttl: 60 * 15, // cache for 15 minutes
  },
};
