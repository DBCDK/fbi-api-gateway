import request from "superagent";
import config from "../config";

const { url, ttl, prefix } = config.datasources.holdingstatus;

/**
 * Constructs soap request to perform holdings request
 * @param {array} parameters
 * @returns {string} soap request string
 */
function constructSoap(localIds, branch) {
  console.log(localIds, "SOURCE");

  const lookupRecords = localIds
    .map(
      (localId, agency) =>
        `<open:lookupRecord>
            <open:responderId>${branch}</open:responderId>
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

  console.log(soap, "SOAP");
  return soap;
}

function parseResponse(text, branch) {
  /*const obj = {
    holdingsResponse: {
      responder: [
        {
          localHoldingsId: {
            $: "99122473022805763",
          },
          willLend: {
            $: "true",
          },
          expectedDelivery: {
            $: "2021-11-08",
          },
          bibliographicRecordId: {
            $: "99122473022805763",
          },
          responderId: {
            $: "800022",
          },
        },
      ],
    },
    "@namespaces": {
      ohs: "http://oss.dbc.dk/ns/openholdingstatus",
    },
  };*/

  const obj = JSON.parse(text);

  console.log(JSON.stringify(obj, null, 4));

  // catch errors
  if (obj.holdingsResponse.error) {
    // red lamp - @TODO set message and lamp
    const localholding = [
      {
        localholdingsId: "fisk",
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
    branchId: branch,
    holdingstatus: localholdings,
  };

  //const obj = JSON.parse(text);

  // do we have a good answer (a responder)
  const responder = obj.holdingsResponse.responder;
  // do we have an error
  const error = obj.holdingsResponse.error;
  // happy path  - we have one or more responder(s)
  if (responder) {
    return;
  }
}

export async function load({ localIds, branch }) {
  const soap = constructSoap(localIds, branch);

  try {
    const res = await request
      .post(url)
      .set("Content-Type", "text/xml")
      .send(soap);

    return parseResponse(res.text, branch);
  } catch (e) {
    console.log("ERROR");
    console.log(e);
  }
}

/*
export const options = {
  redis: {
    prefix,
    ttl,
    staleWhileRevalidate: 60 * 60, // 1 hour
  },
};*/
