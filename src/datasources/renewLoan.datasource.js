/**
 * @file This datasource is used to renew a loan placed through openuserstatus service
 * It leverages the openuserstatus service to renew the loan
 */
import config from "../config";
import { auditTrace, ACTIONS } from "@dbcdk/dbc-audittrail-logger";

const { url } = config.datasources.openuserstatus;
const { authenticationUser, authenticationGroup, authenticationPassword } =
  config.datasources.openorder;

/**
 * Constructs soap request to perform renew request
 * @param {string} loanId
 * @param {string} agencyId
 * @param {string} userId
 * @returns {string} soap
 */
function constructSoap({ loanId, agencyId, userId }) {
  return `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:open="http://oss.dbc.dk/ns/openuserstatus">
   <soapenv:Header/>
   <soapenv:Body>
      <open:renewLoanRequest>
         <open:agencyId>${agencyId}</open:agencyId>
         <open:authentication>
            <open:groupIdAut>${authenticationGroup}</open:groupIdAut>
            <open:passwordAut>${authenticationPassword}</open:passwordAut>
            <open:userIdAut>${authenticationUser}</open:userIdAut>
         </open:authentication>
         <open:loanId>${loanId}</open:loanId>
         <open:outputType>json</open:outputType>
         <open:userId>${userId}</open:userId>
      </open:renewLoanRequest> 
   </soapenv:Body>
</soapenv:Envelope>`;
}

/**
 * Renews the loan
 */
export async function load(
  { loanId, agencyId, userId, smaug, accessToken },
  context
) {
  auditTrace(
    ACTIONS.write,
    config.app.id,
    smaug.app.ips,
    {
      login_token: accessToken,
    },
    `${userId}/${agencyId}`,
    {
      renew_loan: loanId,
    }
  );

  const soap = constructSoap({ loanId, agencyId, userId });

  const res = await context?.fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "text/xml",
    },
    body: soap,
  });

  const error =
    res.body?.renewLoanResponse?.renewLoanStatus?.[0]?.renewLoanError?.$ ||
    res.body?.getUserStatusResponse?.getUserStatusError?.$;

  return {
    error: error,
    dueDate: res.body?.renewLoanResponse?.renewLoanStatus?.[0]?.dateDue?.$,
  };
}

export async function testLoad() {
  return {
    error: null,
    dueDate: "2023-12-12",
  };
}
