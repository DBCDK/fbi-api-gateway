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

/**
 * The status function
 *
 * @throws Will throw error if service is down
 */

// export async function status(loadFunc) {
//   await loadFunc({pid: "870970-basis:51877330", pickupBranch: "710100"});
// }

export const options = {
  redis: {
    prefix: "checkorder-1",
    ttl: 5,
  },
};
