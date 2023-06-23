const url =
  "http://copa-rs.iscrum-ors-staging.svc.cloud.dbc.dk/copa-rs/api/v1/checkorderpolicy/";
const serviceRequester = "190101";

export async function load({ pid, pickupBranch, accessToken }, context) {
  const post = {
    pickUpAgencyId: pickupBranch,
    pid: [pid],
    serviceRequester: serviceRequester,
  };

  const policy = await context.fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(post),
  });

  return policy?.body || null;
}
