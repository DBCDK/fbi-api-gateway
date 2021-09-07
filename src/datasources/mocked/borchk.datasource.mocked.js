export function load({ libraryCode, userId, userPincode }) {
  const data = {
    borrowerCheckResponse: {
      userId: { $: "fisk" },
      requestStatus: { $: "ok" },
    },
    "@namespaces": { bc: "http://oss.dbc.dk/ns/borchk" },
  };

  return data.borrowerCheckResponse.requestStatus.$;
}
