import fetch from "isomorphic-unfetch";

const query = `
query User_Details {
  user {
    name
    mail
    municipalityAgencyId
    agencies {
      hitcount
      result {
        name
        branchId
        userIsBlocked
        agencyId
        agencyName
      }
    }
  }
}`;

async function graphQL({ token, profile }) {
  return await fetch(`http://localhost:3000/${profile}/graphql`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ query, variables: {} }),
  }).then(async (r) => ({
    status: r.status,
    message: r.message,
    body: await r.json(),
  }));
}

/**
 * Handle smaug endpoint req and res
 */
export default async function handler(req, res) {
  const { token, profile } = req.query;

  if (!token || !profile) {
    // Missing params -> throw bad request
    return res.status(400).send({});
  }

  const response = await graphQL({ token, profile });

  return res.status(response.status).send(response);
}
