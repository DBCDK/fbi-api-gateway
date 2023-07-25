import config from "../config";
import { getHomeAgencyAccount } from "../utils/utils";

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
 * @param accessToken: String
 */
export async function load({ accessToken }, context) {
  const userinfo = await context.getLoader("userinfo").load(
    {
      accessToken: accessToken,
    },
    context
  );
  const homeAccount = getHomeAgencyAccount(userinfo);
  const soap = constructSoap({
    agencyId: homeAccount?.agencyId,
    userId: homeAccount?.userId,
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
