export default async function handler(req, res) {
  const accessToken = req.headers.authorization.replace(/bearer /i, "");
  const [_test, agency] = accessToken.split("_");

  // fetch testUser from fbi-api running on same host as this app
  const testUser = await fetch("http://localhost:3000/test/graphql", {
    method: "post",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      query: `query TestUser {
      test {
        user {
          accounts {
            agency {
              agencyId
            }
            cpr
            uniqueId
          }
        }
      }
    }`,
      variables: {},
    }),
  });

  const testUserJson = await testUser.json();
  const agencyId = agency === "nemlogin" ? "190101" : agency;
  const loggedInAgency = testUserJson?.data?.test?.user?.accounts.find(
    (account) => account.agency.agencyId === agencyId
  );

  // Find uniqueId if any of the agency that the user is logged in at
  const uniqueId = loggedInAgency?.cpr && loggedInAgency?.uniqueId;

  res.status(200).json({ attributes: { userId: "0101011234", uniqueId } });
}
