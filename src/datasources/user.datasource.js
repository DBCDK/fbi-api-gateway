import config from "../config";
import { generateName } from "../utils/nameGenerator";

const { url } = config.datasources.openuserstatus;
const {
  authenticationUser,
  authenticationGroup,
  authenticationPassword,
} = config.datasources.openorder;

const constructSoap = ({ agencyId, userId }) => {
  let soap = `
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:open="http://oss.dbc.dk/ns/openuserstatus">
  <soapenv:Header/>
  <soapenv:Body>
    <open:getUserStatusRequest>
      <open:agencyId>${agencyId}</open:agencyId>
      <open:authentication>
        <open:groupIdAut>${authenticationGroup}</open:groupIdAut>
        <open:passwordAut>${authenticationPassword}</open:passwordAut>
        <open:userIdAut>${authenticationUser}</open:userIdAut>
      </open:authentication>
      <open:outputType>json</open:outputType>
      <open:userId>${userId}</open:userId>
      <open:selectUserInfo>userData</open:selectUserInfo>
    </open:getUserStatusRequest>
  </soapenv:Body>
</soapenv:Envelope>
`;

  return soap;
};

const reduceBody = (body) => ({
  name: body?.getUserStatusResponse?.userName?.$,
  mail: body?.getUserStatusResponse?.userMail?.$,
  address: body?.getUserStatusResponse?.userAddress?.$,
  postalCode: body?.getUserStatusResponse?.userPostalCode?.$,
  country: body?.getUserStatusResponse?.userCountry?.$,
});

/**
 * Fetch user info
 * @param homeAccount: {agencyId: String, userId: String, userIdType: String}
 */
export async function load({ agencyId, userId }, context) {
  const soap = constructSoap({
    agencyId,
    userId,
  });

  const res = await context?.fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "text/xml",
    },
    body: soap,
  });

  return reduceBody(res?.body);
}

/**
 *
 */
export async function testLoad({ agencyId, userId }, context) {
  return {
    name: generateName(context?.testUser.key || ""),
    mail: "test@test.dk",
    address: "Some Address 10",
    postalCode: "1010",
    country: "DK",
  };
}

export const options = {
  external: true,
};
