import request from "superagent";
import config from "../config";
import { getInfomediaDetails } from "../utils/utils";

const { id, url, ttl, prefix , teamLabel } = config.datasources.infomedia;

function createSoap({ articleId, userId, agencyId }) {
  return `
<SOAP-ENV:Envelope xmlns:SOAP-ENV="http://schemas.xmlsoap.org/soap/envelope"
  xmlns:xml="http://www.w3.org/XML/1998/namespace"
  xmlns:wsdl="http://schemas.xmlsoap.org/wsdl/"
  xmlns:xs="http://www.w3.org/2001/XMLSchema"
  xmlns:uaim="http://oss.dbc.dk/ns/useraccessinfomedia"
  xmlns:soap="http://schemas.xmlsoap.org/wsdl/soap/"
  xmlns:xmlns="http://www.w3.org/1999/xhtml">
  <SOAP-ENV:Body>
  <uaim:getArticleRequest>
    <uaim:articleIdentifier>
    <uaim:file>${articleId}</uaim:file>
    </uaim:articleIdentifier>
    <uaim:userId>${id || userId}</uaim:userId>
    <uaim:libraryCode>${agencyId.replace(/[^0-9]+/g, "")}</uaim:libraryCode>
    <uaim:outputType>json</uaim:outputType>
  </uaim:getArticleRequest>
  </SOAP-ENV:Body>
</SOAP-ENV:Envelope>`;
}

export async function load({ articleId, userId, agencyId }) {
  // agencyId might be empty
  if (!agencyId) {
    return { error: "NO_AGENCYID" };
  }

  try {
    const res = await request
      .post(url)
      .field("xml", createSoap({ articleId, userId, agencyId }));
    const html =
      res?.body?.getArticleResponse?.getArticleResponseDetails?.[0]?.imArticle
        ?.$;
    const error = res?.body?.getArticleResponse?.error?.$;
    if (error) {
      return { error: error.toUpperCase() };
    }
    if (html) {
      const details = getInfomediaDetails({ html });
      if (!details.text) {
        return null;
      }
      return { id: articleId, ...details };
    }
    return null;
  } catch (e) {
    return { error: "INTERNAL_SERVER_ERROR" };
  }
}

export const options = {
  external: true,
  redis: {
    prefix,
    ttl,
  },
};
