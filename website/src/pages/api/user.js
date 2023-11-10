import fetch from "isomorphic-unfetch";

const query = `
query User_Details {
  user {
    name
    mail
    municipalityAgencyId
    loggedInAgencyId
    isCPRValidated
    identityProviderUsed
    agencies {
      hitcount
      borrowerStatus{
        allowed
        statusCode
      }
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
  });
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
  const parsed = await response.json();

  if (parsed.errors?.length > 0) {
    // Errors found -> throw bad request
    return res.status(400).send(parsed);
  }

  return res.status(response.status).send(parsed);
}
