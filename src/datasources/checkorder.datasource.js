/**
 * @file Get suggestions
 *
 * This is temporary until real suggester is implemented
 */

import request from "superagent";
import config from "../config";

let parseString = require("xml2js").parseString;
let stripNS = require("xml2js").processors.stripPrefix;

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
  return `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:open="http://oss.dbc.dk/ns/openorder">
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
</soapenv:Envelope>`;
}

export async function load({ pid, pickupBranch }) {
  const xml = createRequest(pid, pickupBranch);
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
        // @TODO log
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
      if (body.lookUpUrl) {
        data.lookUpUrl = body.lookUpUrl[0];
      }
      return { statusCode: 200, data: data };
    })
    .catch((err) => {
      // @TODO log
      console.log(err);
    });

  return policy.data;
}

/**
 * The status function
 *
 * @throws Will throw error if service is down
 */

export async function status(loadFunc) {
  await loadFunc("870970-basis:51877330", "710100");
}

export const options = {
  redis: {
    prefix,
    ttl,
  },
};
