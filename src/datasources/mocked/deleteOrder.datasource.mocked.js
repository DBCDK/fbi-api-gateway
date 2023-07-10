import { processRequest } from "../deleteOrder.datasource";

export async function load(input) {
  const postSoap = () =>
    `<?xml version='1.0' encoding='UTF-8'?>
        <S:Envelope
            xmlns:S="http://schemas.xmlsoap.org/soap/envelope/">
            <S:Body>
                <ns1:deleteOrderResponse
                    xmlns:ns1="http://http://oss.dbc.dk/ns/openuserstatus">
                    <ns1:deleted>true</ns1:deleted>
            </ns1:deleteOrderResponse>
        </S:Body>
    </S:Envelope>   
    `;
  return await processRequest(input, postSoap);
}
