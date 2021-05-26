/**
 * @file Get suggestions
 *
 * This is temporary until real suggester is implemented
 */

import request from "superagent";
import config from "../config";

let parseString = require("xml2js").parseString;
let stripNS = require("xml2js").processors.stripPrefix;

/*
NOTES
$authentication['groupIdAut'] = variable_get('bibdk_openorder_groupIdAut');
  $authentication['passwordAut'] = variable_get('bibdk_openorder_passwordAut');
  $authentication['userIdAut'] = variable_get('bibdk_openorder_userIdAut');
  $params['authentication'] = $authentication;

  $params['pickUpAgencyId'] = $pickupAgencyId;
  $params['pid'] = $pid;
  $params['serviceRequester'] = variable_get('bibdk_openorder_serviceRequester');
  $params['trackingId'] = date('Y-m-d\TH:i:s:') . substr((string) microtime(), 2, 6) . ':' . getmypid();
 */

const {
  authenticationUser,
  authenticationGroup,
  authenticationPassword,
  serviceRequester,
  url,
  ttl,
  prefix,
} = config.datasources.openorder;

function createRequest(pid, pickupAgency) {
  return `
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:open="http://oss.dbc.dk/ns/openorder">
    <soapenv:Header/>
    <soapenv:Body>
<open:checkOrderPolicyRequest xmlns:open="http://oss.dbc.dk/ns/openorder">
  <open:authentication>
                <open:groupIdAut>${authenticationGroup}</open:groupIdAut>
                <open:passwordAut>${authenticationPassword}</open:passwordAut>
                <open:userIdAut>${authenticationUser}</open:userIdAut>
            </open:authentication>
            <open:pickUpAgencyId>${pickupAgency}</open:pickUpAgencyId>
            <!--Zero or more repetitions:-->
            <open:pid>${pid}</open:pid>
            <open:serviceRequester>${serviceRequester}</open:serviceRequester>
</open:checkOrderPolicyRequest>
</soapenv:Body>
</soapenv:Envelope>
`;
}

export async function load({ pid, pickupAgency }) {
  console.log(pid, "PID");
  console.log("FISK");
  console.log(url, "URL");

  const xml = createRequest(pid, pickupAgency);
  console.log(xml);

  const policy = await request
    .post(url)
    .set("Content-Type", "text/xml")
    .send(xml)
    .then((body) => {
      parseString(
        body.text,
        { trim: true, tagNameProcessors: [stripNS] },
        function (err, result) {
          body = result.Envelope.Body[0].checkOrderPolicyResponse[0];
        }
      );
      const data = {};

      if (body.checkOrderPolicyError) {
        return {
          statusCode: 500,
          error: body.checkOrderPolicyError[0],
        };
      }

      if (body.orderPossible) {
        data.orderPossible = body.orderPossible[0] !== "false";
      }
      if (body.orderPossibleReason) {
        data.orderPossibleReason = body.orderPossibleReason[0];
      }
      return { statusCode: 200, data: data };
    })
    .catch((err) => {
      console.log(err, "ERROR");
      throw err;
    });

  /*
  const policy = await request
    .post({
      url: "https://openorder.addi.dk/3.0/",
      headers: { "Content-Type": "text/xml" },
      accept: "text/xml",
    })
    .field("xml", xml)
    .end(function (err, res) {
      if (err) {
        console.log("There's been an error");
        console.log(err, "ERROR");
      } else {
        return res;
      }
    });
*/
  console.log(policy, "POLICY");

  return policy.data;
}

/* TODO parse xml from service
return context.call('openorder', soap).then(body => {
    parseString(body, {trim: true, tagNameProcessors: [stripNS]}, function(
      err,
      result
    ) {
      body = result.Envelope.Body[0].checkOrderPolicyResponse[0];
    });
    const data = {};

    if (body.checkOrderPolicyError) {
      return {statusCode: 500, error: body.checkOrderPolicyError[0]};
    }

    if (body.orderPossible) {
      data.orderPossible = body.orderPossible[0] !== 'false';
    }
    if (body.orderPossibleReason) {
      data.orderPossibleReason = body.orderPossibleReason[0];
    }
    return {statusCode: 200, data: data};
  });
 */

/**
 * The status function
 *
 * @throws Will throw error if service is down
 */
/*
export async function status(loadFunc) {
  await loadFunc("870970-basis:51877330", "710100");
}

export const options = {
  redis: {
    prefix,
    ttl,
  },
};
 */
