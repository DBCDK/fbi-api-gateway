import { orderBy, get } from "lodash";
import request from "superagent";
import { parseString, processors } from "xml2js";
import { auditTrace, ACTIONS } from "@dbcdk/dbc-audittrail-logger";
import config from "../config";

const {
  url,
  authenticationUser,
  authenticationGroup,
  authenticationPassword,
  serviceRequester,
} = config.datasources.openorder;

// Openorder is very strict when it comes to the order of parameters
const paramOrder = [
  "authentication",
  "articleDirect",
  "author",
  "authorOfComponent",
  "bibliographicCategory",
  "callNumber",
  "copy",
  "edition",
  "exactEdition",
  "fullTextLink",
  "fullTextLinkType",
  "isbn",
  "issn",
  "issue",
  "itemId",
  "language",
  "localHoldingsId",
  "mediumType",
  "needBeforeDate",
  "orderId",
  "orderSystem",
  "pagination",
  "pickUpAgencyId",
  "pickUpAgencySubdivision",
  "pid",
  "placeOfPublication",
  "publicationDate",
  "publicationDateOfComponent",
  "publisher",
  "requesterId",
  "requesterNote",
  "responderId",
  "seriesTitelNumber",
  "serviceRequester",
  "title",
  "titleOfComponent",
  "trackingId",
  "userAddress",
  "userAgencyId",
  "userDateOfBirth",
  "userId",
  "userIdAuthenticated",
  "userIdType",
  "userMail",
  "userName",
  "userReferenceSource",
  "userTelephone",
  "verificationReferenceSource",
  "volume",
  "outputType",
  "callback",
].reduce((obj, key, index) => ({ ...obj, [key]: index }), {});

/**
 * Constructs soap request to perform placeOrder request
 * @param {array} parameters
 * @returns {string} soap request string
 */
function constructSoap(parameters) {
  let soap = `<SOAP-ENV:Envelope xmlns="http://oss.dbc.dk/ns/openorder" xmlns:SOAP-ENV="http://schemas.xmlsoap.org/soap/envelope/">
     <SOAP-ENV:Body>
        <placeOrderRequest>
           <authentication>
              <groupIdAut>${authenticationGroup}</groupIdAut>
              <passwordAut>${authenticationPassword}</passwordAut>
              <userIdAut>${authenticationUser}</userIdAut>
           </authentication>
           ${parameters
             .map(({ key, val }) => `<${key}>${val}</${key}>`)
             .join("\n           ")}
         </placeOrderRequest>
      </SOAP-ENV:Body>
    </SOAP-ENV:Envelope>`;
  return soap;
}

/**
 * Creates date three months in the future. Used if a date is not provided
 */
function createNeedBeforeDate() {
  let offsetInDays = 90;
  let offsetInMilliseconds = offsetInDays * 24 * 60 * 60 * 1000;
  let date = new Date(Date.now() + offsetInMilliseconds);
  let dateStr = `${date.getFullYear()}-${("0" + (date.getMonth() + 1)).slice(
    -2
  )}-${("0" + date.getDate()).slice(-2)}T00:00:00`;
  return dateStr;
}

async function postSoap(soap) {
  const res = await request
    .post(url)
    .set("Content-Type", "text/xml")
    .send(soap);

  return res.text;
}

/**
 * Converts input to a valid openorder request
 * Will also
 * @param {object} input
 * @param {func} postSoapFunc
 * @returns
 */
export async function processRequest(input, postSoapFunc) {
  // If id is found the user is authenticated via some agency
  // otherwise the token is anonymous
  const userIdFromToken = input.smaug.user.id;

  // Check if the user is authenticated on the given pickUpBranch
  const userIdAuthenticated =
    (userIdFromToken && input.branch.agencyId === input.smaug.user.agency) ||
    false;

  const userIdTypes = ["cpr", "userId", "barcode", "cardno", "customId"];
  // Use the userId from token, if user is authenticated,
  // otherwise the userId must be provided via args
  const userId = userIdAuthenticated
    ? ["userId", userIdFromToken]
    : Object.entries(input.userParameters).find(([key]) =>
        userIdTypes.includes(key)
      );

  if (!userId) {
    throw new Error(
      "User must be authenticated via the pickUpBranch, or provide userId manually"
    );
  }

  let userParameters = Object.entries(input.userParameters).filter(
    ([key]) => !userIdTypes.includes(key)
  );

  let parameters = [
    ["copy", false],
    ["exactEdition", input.exactEdition || false],
    ["needBeforeDate", createNeedBeforeDate()],
    ["orderSystem", input.smaug.orderSystem],
    ["pickUpAgencyId", input.pickUpBranch],
    ["author", input.author],
    ["authorOfComponent", input.authorOfComponent],
    ["pagination", input.pagination],
    ["publicationDate", input.publicationDate],
    ["publicationDateOfComponent", input.publicationDateOfComponent],
    ["title", input.title],
    ["titleOfComponent", input.titleOfComponent],
    ["volume", input.volume],
    ...input.pids.map((pid) => ["pid", pid]),
    ["serviceRequester", serviceRequester],
    ["userId", userId[1]],
    ["userIdAuthenticated", userIdAuthenticated],
    ...userParameters,
    ["verificationReferenceSource", "dbcdatawell"],
    ["outputType", "json"],
  ]
    .filter(([key, val]) => !!val)
    .map(([key, val]) => ({ key, val, order: paramOrder[key] }));

  parameters = orderBy(parameters, "order");

  const soap = constructSoap(parameters);

  const text = await postSoapFunc(soap);

  let parsed;
  parseString(
    text,
    { trim: true, tagNameProcessors: [processors.stripPrefix] },
    function (err, result) {
      parsed = {
        orderId: get(
          result,
          "Envelope.Body[0].placeOrderResponse[0].orderPlaced[0].orderId[0]"
        ),
        status:
          get(
            result,
            "Envelope.Body[0].placeOrderResponse[0].orderPlaced[0].orderPlacedMessage[0]"
          ) ||
          get(
            result,
            "Envelope.Body[0].placeOrderResponse[0].orderNotPlaced[0].placeOrderError[0]"
          ),
      };
    }
  );

  auditTrace(
    ACTIONS.write,
    config.app.id,
    input.smaug.app.ips,
    {
      login_token: input.accessToken,
    },
    `${userId[1]}/${input.branch.agencyId}`,
    {
      place_order: parsed.orderId,
    }
  );
  return parsed;
}

/**
 * Do the request
 * @param input
 * @return {Promise<*>}
 */
export async function load(input) {
  return await processRequest(input, postSoap);
}
